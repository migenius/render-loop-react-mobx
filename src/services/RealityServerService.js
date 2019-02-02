import { observable, computed, action, autorun } from "mobx";
import {Command,HTMLImageDisplay,RenderLoopStateData,StateData,WebSocketStreamer} from "realityserver";
import RSCamera from "../js/RSCamera";
import RealityServerState from "./RealityServerState";

class WebSocketRenderDisplay {
    constructor(RS) {
        this.RS = RS;
    }

    async start() {
        if (!this.RS.service.streaming(this.RS.renderLoopName)) {
            this.RS.state.status = "Starting web socket stream.";

            this.RS.state.imageRendered.source = this.RS.service.connectorName;
            // Setting the below will switch the default state so that all commands will now be executed on
            // the render loop. This isn't necessary for this application however this shows how this is
            // achieved.
            this.RS.service.defaultStateData = new RenderLoopStateData(this.RS.renderLoopName,1,true);
            let count = 0;
            try {
                await this.RS.service.stream({render_loop_name: this.RS.renderLoopName, image_format: "jpg", quality: "100" },
                    this.RS.renderHandler,
                    (data) => {
                        if (data.result < 0) {
                            return; // error on render, don't try and show it
                        }
                        this.RS.state.imageRendered.count = this.RS.state.imageRendered.count+1; 
                        this.RS.state.imageRendered.data = data;
                    }
                );
                this.RS.state.status = "Waiting for first render.";
            } catch (e) {};
        }
    }
    restart() {
        // noop, loop will automatically restart itself as required
    }
}

export default class RealityServerService {

    /** The RealityServer Service object */
    service = undefined;

    /** The application scope name. The same for all sessions.
     * The scene will be loaded into this scope, ensuring that
     * all sessions share the same loaded scene. */
    applicationScope = "demo_application_scope";

    /** The unique user session scope name. User modifications will be
     * made in this scope to make sure changes does not affect other
     * sessions. */
    userScope = "user_scope_" + WebSocketStreamer.createRandomString(8);

    /** The path to the scene to load. */
    scenePath = "scenes/meyemII.mi";

    /** The name to use for the loaded scene. */
    sceneName = "demo_scene";

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
    renderLoopName = "demo_render_loop_" + WebSocketStreamer.createRandomString(8);

    /** Name of the render loop handler to use */
    renderLoopHandlerName = "default";

    /** The RenderedImageHandler used for displaying rendered images. */
    renderHandler = undefined;

    /** pick request ID */
    pickRequest = 0;

	constructor() {
		this.state = new RealityServerState();

		this.state.status = "Initializing application...";

		this.acquire_host_and_port();
	}

  	acquire_host_and_port()
	{
		if (process.env.RS_HOST !== undefined || process.env.RS_PORT !== undefined || process.env.RS_SECURE !== undefined) {
			if (process.env.RS_HOST === undefined || process.env.RS_PORT === undefined || process.env.RS_SECURE === undefined)  {
				throw 'If any of RS_HOST, RS_PORT or RS_SECURE is defined then all must be defined';
			}
			this.state.host = process.env.RS_HOST;
			this.state.port = process.env.RS_PORT;
			this.state.secure = process.env.RS_SECURE == "true";
			return;
		}
	    let serviceURL = document.location.toString();
	    if(serviceURL.indexOf("file://") === 0)
	    {
	        // File URL defaults to using local host. Mostly useful
	        // during development.
	        this.state.host = "127.0.0.1";
	        this.state.port = 8080;
	    }
	    else if(serviceURL.indexOf("http://") === 0)
	    {
	        let bracketIndex = serviceURL.indexOf("]", 7);
	        let colonIndex = -1;
	        if (bracketIndex != -1)
	        {
	            /** Brackets are only used for numerical IPv6, check for port after brackets. */
	            colonIndex = serviceURL.indexOf(":", bracketIndex);
	        }
	        else
	        {
	            colonIndex = serviceURL.indexOf(":", 7);
	        }
	        if(colonIndex < 0)
	        {
	            this.state.port = 80;
	            this.state.host = serviceURL.substring(7, serviceURL.indexOf("/", 7));
	        }
	        else
	        {
	            this.state.host = serviceURL.substring(7, colonIndex);
	            let portStr = serviceURL.substring(colonIndex+1, serviceURL.indexOf("/", 7));
	            this.state.port = parseInt(portStr);
	        }
	    }
	    else if(serviceURL.indexOf("https://") === 0)
	    {
	        let bracketIndex = serviceURL.indexOf("]", 8);
	        let colonIndex = -1;
	        if (bracketIndex != -1)
	        {
	            /** Brackets are only used for numerical IPv6, check for port after brackets. */
	            colonIndex = serviceURL.indexOf(":", bracketIndex);
	        }
	        else
	        {
	            colonIndex = serviceURL.indexOf(":", 8);
	        }
	        if(colonIndex < 0)
	        {
	            this.state.port = 443;
	            this.state.host = serviceURL.substring(8, serviceURL.indexOf("/", 8));
	        }
	        else
	        {
	            this.state.host = serviceURL.substring(8, colonIndex);
	            let portStr = serviceURL.substring(colonIndex+1, serviceURL.indexOf("/", 8));
	            this.state.port = parseInt(portStr);
	        }
	        this.state.secure = true;
	    }
	    else
	    {
	        this.state.status = "Failed to extract service URL.";
	        this.state.connection_error = ("Service URL: Failed to acquire URL. Original URL: " + document.location.toString());
	    }
	}

	async start(renderHandlerImage, width, height) {
        if (!renderHandlerImage || !width || !height) {
            throw "invalid parameters";
        }

        this.renderHandler = new HTMLImageDisplay(renderHandlerImage);

        this.imgWidth = width;
        this.imgHeight = height;

        if (WebSocketStreamer.supported()) {
            // Create a WebSocketStreamer object to use for command
            // processing and receiving rendered images for the 
            // render loop. The service can be used once connected
            // and will then use the web socket connection when processing
            // commands.
            this.service = new WebSocketStreamer();
            
            try {
                await this.service.connect((this.state.secure ? "wss://" : "ws://")+this.state.host+":"+this.state.port+"/render_loop_stream/");
            } catch(err) {
                this.state.status = "Web Socket connection failed.";
                return;
            }
            this.state.status = "Web Socket streamer connected, loading scene.";
            this.state.connection_status = 'connected';
            // Uncomment below to enable debug mode where WebSocket commands are
            // sent using text rather than binary. This can be helpful when
            // trying to debug command sequences.
            
           // this.service.debug_commands(true);
            this.import_scene();
        } else {
            this.state.status = "Web Sockets not supported.";
        }
	}

    async import_scene() {
        // Create a batch command to initialize the application. Batch
        // commands are useful to process a bunch of commands as if
        // they were a single command and can simplify certain tasks
        // and also offer a bit more control in some regards, such as
        // error handling.
        let renderers,scene_info;
        try {
            const [ renderers_response, scene_response ] = await this.service.queue_commands()
            .queue(
                new Command("get_available_renderers", {}),true
            )
            .queue(
                new Command("create_scope", {scope_name:this.applicationScope})
            )
            .queue(
                new Command("create_scope", {parent_scope:this.applicationScope, scope_name:this.userScope})
            )
            .queue(
                new Command("use_scope", {scope_name:this.applicationScope})
            )
            .queue(
                new Command("import_scene", {block:true, scene_name:this.sceneName, filename:this.scenePath}),true
            ).send();

            if (renderers_response.error) {
                this.state.status = `Error getting renderers: ${JSON.stringify(renderers_response.error)}`;
                return;
            }
            if (scene_response.error) {
                this.state.status = `Error loading scene: ${JSON.stringify(scene_response.error)}`;
                return;
            }
            renderers = renderers_response.result;
            scene_info = scene_response.result;
        } catch(err) {
            this.state.status = `Service error: ${JSON.stringify(err)}`;
            return;
        }

        this.prepare_scene(renderers,scene_info);        
    }

	async prepare_scene(renderers,scene_info)
    {
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
        // associating commands with an IStateData instance. This
        // instance is either specified when commands are added to
        // the service or it is possible to set a default IState
        // data which will then be used whenever no IStateData is
        // explicitly set.

        // Set the default state data using a use_scope state command
        // that selects the user scope. From now on the service will
        // make sure that all commands are executed in the user scope
        // (unless commands are added with an explicit IStateData
        // instance).
        const stateData = new StateData(null, null, [new Command("use_scope", {scope_name:this.userScope})]);
        this.service.defaultStateData = stateData;

        // Initialize rendering.
        this.state.status = "Initializing rendering...";

        let camera_info,camera_matrix;
        try {
            const [ get_camera_response, get_matrix_response ] = await this.service.queue_commands()
            .queue(
                new Command("localize_element", {element_name:this.cameraInstanceName})
            )
            .queue(
                new Command("localize_element", {element_name:this.cameraName})
            )
            .queue(
                new Command("camera_set_aspect", {camera_name:this.cameraName, aspect:(this.imgWidth/this.imgHeight)})
            )
            .queue(
                new Command("camera_set_resolution", {camera_name:this.cameraName, resolution:{x:this.imgWidth, y:this.   imgHeight}})
            )
            .queue(
                new Command("get_camera", {camera_name:this.cameraName}),true
            )
            .queue(
                new Command("instance_get_world_to_obj", {instance_name:this.cameraInstanceName}),true
            ).send();

            if (get_camera_response.error) {
                this.state.status = `Error getting camera: ${JSON.stringify(get_camera_response.error)}`;
                return;
            }
            if (get_matrix_response.error) {
                this.state.status = `Error loading camera matrix: ${JSON.stringify(get_matrix_response.error)}`;
                return;
            }
            camera_info = get_camera_response.result;
            camera_matrix = get_matrix_response.result;
        } catch(err) {
            this.state.status = `Service error: ${JSON.stringify(err)}`;
            return;
        }


        // Update the client side camera representation with
        // initial values from the scene camera.
        this.camera.setFromObject(camera_info);

        this.camera.matrix = camera_matrix;


        // Set the scene up vector (depends on the application that
        // created the scene and affects navigation).
        this.camera.sceneUpDirection = this.sceneUpVector;

        this.state.status = "Rendering using server side render loop...";
        try {
            const [ start_loop_response ] = await this.service.execute_command(
                new Command("render_loop_start",
                    {
                        render_loop_name:this.renderLoopName,
                        render_loop_handler_name:this.renderLoopHandlerName,
                        scene_name: this.sceneName,
                        render_loop_handler_parameters: [ "renderer", this.state.renderer ],
                        timeout: this.state.renderLoopExpiryTime
                    }),true);
            if (start_loop_response.error) {
                this.state.status = "Creation of render loop failed.";
                return;
            }
        } catch(err) {
            this.state.status = `Service error: ${JSON.stringify(err)}`;
            return;
        }

        this.start_local_render_loop();
    }

    /**
     * Starts the local render loop to fetch rendered images from the server.
     * Renders will be retrieved at a fixed frame rate configured by the
     * renderFPS variable.
     */
    start_local_render_loop()
    {
        this.localLoop = new WebSocketRenderDisplay(this);
        
        this.localLoop.start();

        // The application is now ready to respond to user input.
        // The code that handles user input and updates the camera
        // is separated out into two navigator classes, one for
        // simple dollying using the mouse wheel and one for orbiting
        // the camera. These classes will modify the camera instance
        // which will fire an event every time its transform changes.

        // Listen for camera transform change events. This event will
        // be triggered any time the camera is modified in such a way
        // that its transform changes.
        autorun(reaction => {
            // The service is now ready to process commands and it is
            // time to generate an optimized sequence of commands that
            // updated the camera transform. In this case this is very
            // simple since the client side camera representation is
            // keeping track of the most recent camera transform and
            // this is what should be used.
            this.service.update_camera(this.renderLoopName,{camera_instance: { name: this.cameraInstanceName, transform: this.camera.matrix }});
        })

        // watch renderer
        autorun( reaction => {
            this.service.execute_command(
                new Command("render_loop_set_parameter", {render_loop_name:this.renderLoopName,key:"renderer",value:this.state.renderer})
            );
        });

        // watch selection to outline it.
        autorun( async reaction => {
            // Now that we picked something, set the outline parameter to highlight. Format is:
            //    r,g,b;outline_instance(,outline_instance)*(;(watch_instance)?(,watch_instance)*(;disable_instance(,disable_instance)*)?)?
            const outline = this.state.outlined && this.state.outlined.length ? ('1,1,0;' + this.state.outlined.join(',')) : '';
            // set outline and wait until the change appears
            await this.service.execute_command(
                new Command("render_loop_set_parameter", {
                    render_loop_name: this.renderLoopName,
                    key: "outline",
                    value: outline
                }),false,true);
            this.resume_display();
        });
    }

    pause_display()
    {
        if (this.localLoop) {
            this.service.pause_display(this.renderLoopName);
        }
    }

    resume_display()
    {
        if (this.localLoop) {
            this.service.resume_display(this.renderLoopName);
        }
    }

    async pick(x,y) {
        const params = {
                "pick_request":     { type: "Sint32",       value: ++this.pickRequest},
                "pick_position":    { type: "Float32<2>",   value: {x,y} }
        }
        this.service.queue_commands()
        .queue(
            new Command("element_set_attributes", {
                element_name: this.cameraName,
                attributes: params,
                create: true
            })
        )
        .queue(
            new Command("render_loop_cancel_render", {
                render_loop_name: this.renderLoopName
            })
        ).send();

        return new Promise((resolve, reject) => {
            // Wait then poll for our pick results on the render loop
            setTimeout(() => this.pick_poll_callback(resolve,reject), 500); 
        });
    }

    async pick_poll_callback(resolve,reject) {
        const queue = this.service.queue_commands();

        ["pick_response", "pick_result_error", "pick_result_position", "pick_result_object_name", "pick_result_path"].forEach((attr_name) => {
            queue.queue(new Command("element_get_attribute", {
                element_name: this.cameraName,
                attribute_name: attr_name
            }),true);
        });
        let responses;
        try {
            responses = await queue.send();
        } catch (err) {
            this.state.status = `Service error: ${JSON.stringify(err)}`;
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
        if (!resp || resp[0].isErrorResponse || resp[0].result !== this.pickRequest) {
            setTimeout(() => this.pick_poll_callback(resolve,reject), 1000); 
        } else {
            var error = resp[1].result;
            if (error && error.length > 0) {
                // picked nothing
                resolve(undefined);
            } else {
                var result = [{
                    world_point: resp[2].result,
                    picked_object_name: resp[3].result,
                    picked_object_instance: resp[4].result[1],
                    paths: resp[4].result
                }];
                resolve(result);
            }
        }
    }

}
