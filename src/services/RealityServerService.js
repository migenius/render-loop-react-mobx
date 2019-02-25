import { reaction } from 'mobx';
import { Command,Command_error,Error as RS_error,Utils,State_data,Service } from 'realityserver-client';
import RSCamera from '../js/RSCamera';
import RealityServerState from './RealityServerState';

export default class RealityServerService {

    /** The RealityServer Service object */
    service = undefined;

    /** The application scope name. The same for all sessions.
     * The scene will be loaded into this scope, ensuring that
     * all sessions share the same loaded scene. */
    applicationScope = 'demo_application_scope';

    /** The unique user session scope name. User modifications will be
     * made in this scope to make sure changes does not affect other
     * sessions. */
    userScope = 'user_scope_' + Utils.create_random_string(8);

    /** The path to the scene to load. */
    scenePath = 'scenes/meyemII.mi';

    /** The name to use for the loaded scene. */
    sceneName = 'demo_scene';

    /** Name of the camera object to use. Will be
     * set from the result of the import_scene command. */
    cameraName = undefined;

    /** Name of the camera instance to use. Will be
     * set from the result of the import_scene command. */
    cameraInstanceName = undefined;

    /** The client side camera obect. Used to keep track of the
     * camera transform and implement camera orbit navigation. */
    camera = new RSCamera();

    /** The vector that represents up in the scene.
     * Different depending on the DCC used to create
     * the scene (such as 3ds max, or Maya). */
    sceneUpVector = RSCamera.Y_UP;

    // rendererd image width
    imgWidth = 500;

    // rendered image height
    imgHeight = 370;

    /** The name of the render loop to use */
    renderLoopName = 'demo_render_loop_' + Utils.create_random_string();

    /** Name of the render loop handler to use */
    renderLoopHandlerName = 'default';

    /** The Image element used for displaying rendered images. */
    renderImage = undefined;

    /** pick request ID */
    pickRequest = 0;

    /** the render loop stream */
    stream = undefined;

    constructor() {
        this.state = new RealityServerState();

        this.state.status = 'Initializing application...';

        this.acquire_host_and_port();
    }

    acquire_host_and_port() {
        if (process.env.RS_HOST !== undefined || process.env.RS_PORT !== undefined || process.env.RS_SECURE !== undefined) {
            if (process.env.RS_HOST === undefined || process.env.RS_PORT === undefined || process.env.RS_SECURE === undefined)  {
                throw 'If any of RS_HOST, RS_PORT or RS_SECURE is defined then all must be defined';
            }
            this.state.host = process.env.RS_HOST;
            this.state.port = process.env.RS_PORT;
            this.state.secure = process.env.RS_SECURE === 'true';
            return;
        }
        try {
            const details = Utils.extract_url_details(document.location.toString());
            this.state.host = details.host;
            this.state.port = details.port;
            this.state.secure = details.secure;
        } catch (err) {
            this.state.status = 'Failed to extract service URL.';
            this.state.connection_error = ('Service URL: Failed to acquire URL. Original URL: ' + document.location.toString());
        }
    }

    async start(renderHandlerImage, width, height) {
        if (!renderHandlerImage || !width || !height) {
            throw 'invalid parameters';
        }

        this.renderImage = renderHandlerImage;

        this.imgWidth = width;
        this.imgHeight = height;

        if (Service.supported) {
            // Create a Service object to use for command
            // processing and receiving rendered images for the
            // render loop. The service can be used once connected
            // and will then use the web socket connection when processing
            // commands.
            this.service = new Service();
            try {
                await this.service.connect((this.state.secure ? 'wss://' : 'ws://')+this.state.host+':'+this.state.port+'/service/');
            } catch (err) {
                this.state.status = `Web Socket connection failed: ${err.toString()}`;
                return;
            }
            this.state.status = 'Web Socket streamer connected, loading scene.';
            this.state.connection_status = 'connected';
            
            // Uncomment below to enable debug mode where WebSocket commands are
            // sent using text rather than binary. This can be helpful when
            // trying to debug command sequences.
            //this.service.debug_commands = true;

            this.import_scene();
        } else {
            this.state.status = 'Web Sockets not supported.';
        }
    }

    async import_scene() {
        // Queue a series of commands to initialize the application.
        // We fetch the available renderers, create scopes and import the scene
        const [ renderers, scene_info ] = await this.service.queue_commands()
            .queue(
                new Command('get_available_renderers', {}),true
            )
            .queue(
                new Command('create_scope', { scope_name:this.applicationScope })
            )
            .queue(
                new Command('create_scope', { parent_scope:this.applicationScope, scope_name:this.userScope })
            )
            .queue(
                new Command('use_scope', { scope_name:this.applicationScope })
            )
            .queue(
                new Command('import_scene', { block:true, scene_name:this.sceneName, filename:this.scenePath }),true
            )
            .execute()
            .catch(err => [ err ]);

        if (renderers instanceof Command_error) {
            this.state.status = `Error getting renderers: ${renderers.message}`;
            return;
        }

        if (renderers instanceof RS_error) {
            this.state.status = `Service error: ${err.toString()}`;
            return;
        }
        if (scene_info instanceof Command_error) {
            this.state.status = `Error loading scene: ${scene_info.message}`;
            return;
        }

        this.prepare_scene(renderers,scene_info);
    }

    async prepare_scene(renderers,scene_info) {
        this.state.renderers = renderers;
        this.state.renderer = 'iray';

        // Extract the name of the camera and camera instance from
        // the import_scene response. This command is at index 3
        // (added as the fourth command) so its response will also
        // be at index 3.
        this.cameraName = scene_info.camera;
        this.cameraInstanceName = scene_info.camera_instance;

        // The scene is now loaded and the application and user
        // scopes have been created. The commands that are processed
        // by the service should not be processed in the user scope
        // to avoid any changes to the scene affecting other users.
        // The scope commands are executed in is determined by the
        // state information that is available to the server in the
        // request to process one or more commands. On the server
        // this state data is inspected by optionally installed state
        // handler plugins that define the proper scope for instance
        // by inspecting the state path or parameters such as a
        // session id.

        // It is also possible to set the scope using the
        // use_scope command, which this application will use. This
        // will work even if no state handlers are installed on the
        // server. The RealityServer client API makes sure commands
        // are executed with the correct state data available by
        // associating commands with an IState_data instance. This
        // instance is either specified when commands are added to
        // the service or it is possible to set a default IState
        // data which will then be used whenever no IState_data is
        // explicitly set.

        // Set the default state data using a use_scope state command
        // that selects the user scope. From now on the service will
        // make sure that all commands are executed in the user scope
        // (unless commands are added with an explicit IState_data
        // instance).
        this.service.default_state_data = new State_data(null, null, [ new Command('use_scope', { scope_name:this.userScope }) ]);

        // Initialize rendering.
        this.state.status = 'Initializing rendering...';

        const [ camera_info, camera_matrix ] = await this.service.queue_commands()
            .queue(
                new Command('localize_element', { element_name:this.cameraInstanceName })
            )
            .queue(
                new Command('localize_element', { element_name:this.cameraName })
            )
            .queue(
                new Command('camera_set_aspect', { camera_name:this.cameraName, aspect:(this.imgWidth/this.imgHeight) })
            )
            .queue(
                new Command('camera_set_resolution', { camera_name:this.cameraName, resolution:{ x:this.imgWidth, y:this.   imgHeight } })
            )
            .queue(
                new Command('get_camera', { camera_name:this.cameraName }),true
            )
            .queue(
                new Command('instance_get_world_to_obj', { instance_name:this.cameraInstanceName }),true
            )
            .execute()
            .catch(err => [ err ]);

        if (camera_info instanceof Command_error) {
            this.state.status = `Error getting camera: ${camera_info.message}`;
            return;
        }

        if (camera_info instanceof RS_error) {
            this.state.status = `Service error: ${camera_info.toString()}`;
            return;            
        }

        if (camera_matrix instanceof Command_error) {
            this.state.status = `Error loading camera matrix: ${camera_matrix.message}`;
            return;
        }

        // Update the client side camera representation with
        // initial values from the scene camera.
        this.camera.setFromObject(camera_info);

        this.camera.matrix = camera_matrix;


        // Set the scene up vector (depends on the application that
        // created the scene and affects navigation).
        this.camera.sceneUpDirection = this.sceneUpVector;

        this.state.status = 'Rendering using server side render loop...';
        const [ start_loop_response ] = await this.service.execute_command(
            new Command('render_loop_start',
                {
                    render_loop_name:this.renderLoopName,
                    render_loop_handler_name:this.renderLoopHandlerName,
                    scene_name: this.sceneName,
                    render_loop_handler_parameters: [ 'renderer', this.state.renderer ],
                    timeout: this.state.renderLoopExpiryTime
                }),{
                    want_response:true
                }).catch(err => [ err ])
        if (start_loop_response instanceof Command_error) {
            this.state.status = `Creation of render loop failed ${start_loop_response.message}.`;
            return;
        }
        if (start_loop_response instanceof RS_error) {
            this.state.status = `Service error: ${err.toString()}`;
            return;
        }

        this.start_local_render_loop();
    }

    /**
     * Starts the local render loop to fetch rendered images from the server.
     * Renders will be retrieved at a fixed frame rate configured by the
     * renderFPS variable.
     */
    async start_local_render_loop() {
        this.state.status = 'Starting web socket stream.';

        this.state.imageRendered.source = this.service.connector_name;

        try {
            this.stream = this.service.create_stream();

            this.stream.on('image',Utils.html_image_display(this.renderImage));
            this.stream.on('image',image => {
                if (image.result < 0) {
                    return; // error on render, don't try and show it
                }
                this.state.imageRendered.count = this.state.imageRendered.count+1;
                this.state.imageRendered.data = image;
            });

            this.stream.cancel_level = 0;
            
            await this.stream.start(
                {
                    render_loop_name: this.renderLoopName,
                    image_format: 'jpg',
                    quality: '100'
                }
            );

            this.state.status = 'Waiting for first render.';
        } catch (err) {
            this.state.status = `Service error: ${err.toString()}`;
            return;
        };

        // The application is now ready to respond to user input.

        // Camera navigation is handled by the application level.
        // Here we just watch for the changes to the camera matrx
        // and update it on change.
        
        // React to camera transform change events. This will
        // be triggered any time the camera is modified in such a way
        // that its transform changes.
        reaction(
            () => { return this.camera.matrix },
            matrix => {
                this.stream.update_camera(
                {
                    camera_instance: {
                        name: this.cameraInstanceName,
                        transform: matrix
                    }
                });
            }
        );

        // watch the renderer and change to the new renderer when it
        // changes
        reaction(
            () => { return this.state.renderer },
            renderer => {
                this.service.send_command(
                    new Command('render_loop_set_parameter',
                        {
                            render_loop_name:this.renderLoopName,
                            key:'renderer',
                            value: renderer
                        })
                );
            }
        );

        // watch the array of outlined objects and outline the objects
        // when it changes
        reaction(
            () => { return this.state.outlined.slice() },
            async outlined => {
                // Now that we picked something, set the outline parameter to highlight. Format is:
                //    r,g,b;outline_instance(,outline_instance)*(;(watch_instance)?(,watch_instance)*(;disable_instance(,disable_instance)*)?)?
                const outline = outlined && outlined.length ?
                    ('1,1,0;' + outlined.join(',')) :
                    '';
                // set outline and wait until the change appears
                await this.stream.execute_command(
                    new Command('render_loop_set_parameter', {
                        render_loop_name: this.renderLoopName,
                        key: 'outline',
                        value: outline
                    }),{
                        want_response: false,
                        wait_for_render:true
                    }).catch(e => {});
                this.resume_display();
            }
        );
    }

    pause_display() {
        if (this.stream) {
            this.stream.pause();
        }
    }

    resume_display() {
        if (this.stream) {
            this.stream.resume();
        }
    }

    async pick(x,y) {
        const params = {
            'pick_request':     { type: 'Sint32',       value: ++this.pickRequest },
            'pick_position':    { type: 'Float32<2>',   value: { x,y } }
        };
        this.service.queue_commands()
            .queue(
                new Command('element_set_attributes', {
                    element_name: this.cameraName,
                    attributes: params,
                    create: true
                })
            )
            .queue(
                new Command('render_loop_cancel_render', {
                    render_loop_name: this.renderLoopName
                })
            ).execute().catch(e => {});

        return new Promise((resolve, reject) => {
            // Wait then poll for our pick results on the render loop
            setTimeout(() => this.pick_poll_callback(resolve,reject), 500);
        });
    }

    async pick_poll_callback(resolve,reject) {
        const queue = this.service.queue_commands();

        [ 'pick_response', 'pick_result_error', 'pick_result_position', 'pick_result_object_name', 'pick_result_path' ].forEach((attr_name) => {
            queue.queue(new Command('element_get_attribute', {
                element_name: this.cameraName,
                attribute_name: attr_name
            }),true);
        });
        let responses;
        try {
            responses = await queue.execute();
        } catch (err) {
            this.state.status = `Service error: ${err.toString()}`;
            reject();
            return;
        }
        this.pick_done(responses,resolve,reject);
    }

    pick_done(resp,resolve,reject) {
        if (!resp) {
            // strange. let's try again later
            setTimeout(() => this.pick_poll_callback(resolve,reject), 1000);
        }
        if (!resp || resp[0] instanceof Command_error || resp[0] !== this.pickRequest) {
            setTimeout(() => this.pick_poll_callback(resolve,reject), 1000);
        } else {
            let error = resp[1];
            if (error && error.length > 0) {
                // picked nothing
                resolve(undefined);
            } else {
                let result = [ {
                    world_point: resp[2],
                    picked_object_name: resp[3],
                    picked_object_instance: resp[4][1],
                    paths: resp[4]
                } ];
                resolve(result);
            }
        }
    }

}
