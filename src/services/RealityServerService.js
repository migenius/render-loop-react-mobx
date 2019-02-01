import { observable, computed, action, autorun } from "mobx";
import {BatchCommand,Command,HTMLImageDisplay,RenderLoopStateData,StateData,WebSocketStreamer} from "realityserver";
import RSCamera from "../js/RSCamera";
import RealityServerState from "./RealityServerState";

/*
function Promisify(thing,func) {
    const orig = thing.prototype[func];

    thing.prototype[func] = function(arg) {
        return new Promise(function (resolved, rejected) {
            orig(arg,resolved,rejected);
         });
    }
}
Promisify(WebSocketStreamer,'connect');
*/

class WebSocketRenderDisplay {
    constructor(RS) {
        this.RS = RS;
    }

    start() {
        if (!this.RS.service.streaming(this.RS.renderLoopName)) {
            this.RS.state.status = "Starting web socket stream.";

            this.RS.state.imageRendered.source = this.RS.service.connectorName;
            // Setting the below will switch the default state so that all commands will now be executed on
            // the render loop. This isn't necessary for this application however this shows how this is
            // achieved.
            this.RS.service.defaultStateData = new RenderLoopStateData(this.RS.renderLoopName,1,true);
            let count = 0;
            this.RS.service.stream({render_loop_name: this.RS.renderLoopName, image_format: "jpg", quality: "100" },
                this.RS.renderHandler,
                (response) => {
                    this.RS.state.status = "Waiting for first render.";
                },
                (data) => {
                    if (data.result < 0) {
                        return; // error on render, don't try and show it
                    }
                    this.RS.state.imageRendered.count = this.RS.state.imageRendered.count+1; 
                    this.RS.state.imageRendered.data = data;
                }
            );
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

		this.acquireHostAndPort();
	}

  	acquireHostAndPort()
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
            
            this.service.connect((this.state.secure ? "wss://" : "ws://")+this.state.host+":"+this.state.port+"/render_loop_stream/",
                () => {
                    this.state.status = "Web Socket streamer connected, loading scene.";
                    this.state.connection_status = 'connected';
                    // Uncomment below to enable debug mode where WebSocket commands are
                    // sent using text rather than binary. This can be helpful when
                    // trying to debug command sequences.
                    
                    this.service.debug_commands(true);
                    this.importScene();
                },
                err => {
                    this.state.status = "Web Socket connection failed.";
                }
            );

        } else {
            this.state.status = "Web Sockets not supported.";
        }
	}

    importScene() {
        // Create a batch command to initialize the application. Batch
        // commands are useful to process a bunch of commands as if
        // they were a single command and can simplify certain tasks
        // and also offer a bit more control in some regards, such as
        // error handling.
        const initApplicationBatch = new BatchCommand();

        // Get available renderers to populate the select box
        initApplicationBatch.addCommand(new Command("get_available_renderers", {}));

        // Add sub-command that creates the application scope.
        initApplicationBatch.addCommand(new Command("create_scope", {scope_name:this.applicationScope}));

        // Add sub-command that creates the user scope which is a
        // child of the application scope.
        initApplicationBatch.addCommand(new Command("create_scope", {parent_scope:this.applicationScope, scope_name:this.userScope}));

        // Add command that switch the current scope to the
        // application scope. This will affect the rest of the
        // commands in this batch. (Note that this is safe usage
        // of use_scope only because this is the first and only
        // command added by the application and other commands
        // won't be added until this command completes. use_scope
        // should normally only be used as state commands. See
        // IStateData for more information.)
        initApplicationBatch.addCommand(new Command("use_scope", {scope_name:this.applicationScope}));

        // Load the scene. The scene will be loaded in the
        // application scope which will be the same for all users
        // of this application. This ensures that only one copy of
        // the scene is loaded regardless of how many users have
        // loaded this application.
        initApplicationBatch.addCommand(new Command("import_scene", {block:true, scene_name:this.sceneName, filename:this.scenePath}));

        // Add the batch command. All of the sub-commands defined
        // above will be processed as part of the batch command in
        // the order they were added. Only a single response handler
        // can be added for the batch command as a whole and the
        // response will contain responses for all the sub-commands.
        this.service.addCommand(initApplicationBatch, (resp) => { this.importSceneResponse(resp); } );
    }

	importSceneResponse(resp)
    {
        // First check if the batch command itself failed.
        if(resp.isErrorResponse)
        {
            this.state.status = "Failed to initialize application. " + resp.error.message;
            return;
        }
        let responses = resp.subResponses;

        // Check if any of the sub-commands failed.
        if(resp.hasSubErrorResponse)
        {
            // There was an error in one or more of the responses.
            // Go through each response. If the first response is
            // an error response and the code is -3 then the
            // create application scope command failed because the
            // scope already exists. This is expected since this
            // scope will only be created once. So ignore this
            // error. Other errors will cause application
            // initialization aborted.

            let len = responses.length;
            let fatalError = false;
            let errMsg = "";
            for(let i=0; i<len; i++)
            {
                let c = responses[i];
                if(c.isErrorResponse && !( (i==1) && (c.error.code == -3) ))
                {
                    if(errMsg == "")
                        errMsg = c.error.message;
                    fatalError = true;
                }
            }

            if(fatalError)
            {
                // Initialization failed! errMsg will contain the
                // error message of the first fatal error.
                this.state.status = "Initialization error: " + errMsg;
                return;
            }
        }

        // Populate renderer list
        let renderers = responses[0].result;

        this.state.renderers = renderers;
        this.state.renderer = 'iray';

        // Extract the name of the camera and camera instance from
        // the import_scene response. This command is at index 3
        // (added as the fourth command) so its response will also
        // be at index 3.
        let importSceneResponse = responses[4];
        if(importSceneResponse.command.name !== "import_scene")
        {
            // The application has been modified and the import_scene
            // command is no longer at the expected index.
            this.state.status = "Failed to initialize application. The import_scene response not at expected index.";
            return;
        }
        
        this.cameraName = importSceneResponse.result.camera;
        this.cameraInstanceName = importSceneResponse.result.camera_instance;

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

        // A batch command is used also to initialize the rendering.
        let initRenderingBatch = new BatchCommand();

        // Just executing commands in the user scope is not enough
        // to ensure that the changes are local to a user. The
        // scene objects that the applications changes must also be
        // localized to the user scope using the localize_element
        // command. Localization will be made to the current scope
        // which was set earlier to be the user scope by default.

        // Localize the scene camera object and the camera instance
        // since this application will modify these two scene objects.
        initRenderingBatch.addCommand(new Command("localize_element", {element_name:this.cameraInstanceName}));
        initRenderingBatch.addCommand(new Command("localize_element", {element_name:this.cameraName}));

        // Set the camera resolution and aspect to match the
        // size of the view.
        initRenderingBatch.addCommand(new Command("camera_set_aspect", {camera_name:this.cameraName, aspect:(this.imgWidth/this.imgHeight)}));
        initRenderingBatch.addCommand(new Command("camera_set_resolution", {camera_name:this.cameraName, resolution:{x:this.imgWidth, y:this.   imgHeight}}));

        // Fetch camera data, needed to set up the client side
        // camera object.
        initRenderingBatch.addCommand(new Command("get_camera", {camera_name:this.cameraName}));

        // Fetch the camera instance transform, needed to set up the
        // initial orientation of the client side camera object.
        initRenderingBatch.addCommand(new Command("instance_get_world_to_obj", {instance_name:this.cameraInstanceName}));

        // Process the batch command that will initialize rendering.
        this.service.addCommand(initRenderingBatch,  (resp) => { this.initRenderingResponse(resp); } );
    }


    /**
     * Called when the initRenderingBatch command has been processed.
     */
    initRenderingResponse(resp)
    {
        // First check if the batch command itself failed.
        if(resp.isErrorResponse)
        {
            this.state.status = "Failed to initialize application. " + resp.error.message;
            return;
        }

        // Check if any of the sub commads had errors.
        if(resp.hasSubErrorResponse)
        {
            var responses = resp.subResponses;
            var len = responses.length;
            var errMsg = "";
            for(var i=0; i<len; i++)
            {
                // There was an error in one or more of the responses.
                // Go through each response. The first error will also
                // be printed in the status line.
                var c = responses[i];
                if(c.isErrorResponse)
                {
                    if(errMsg == "")
                        errMsg = c.error.message;
                }
            }
            this.state.status = "Failed to initialize rendering." + errMsg;
            return;
        }

        // Extract camera information from the reply. The get_camera
        // command was added as the fifth command so the sub-response
        // will be at index 2.
        var getCameraResponse = resp.subResponses[4];
        if(getCameraResponse.command.name !== "get_camera")
        {
            // The application has been modified and the sub-response
            // is no longer at the expected index.
            this.state.status = "Failed to initialize application. The get_camera sub-response not at expected index.";
            return;
        }

        // Extract the camera transform from the reply. The
        // instance_get_world_to_obj command was added as the
        // sixth command so the sub-response will be at index 5.
        var getCameraTransformResponse = resp.subResponses[5];
        if(getCameraTransformResponse.command.name !== "instance_get_world_to_obj")
        {
            // The application has been modified and the sub-response
            // is no longer at the expected index.
            this.state.status = "Failed to initialize application. The instance_get_world_to_obj sub-response not at expected index.";
            return;
        }

        // Update the client side camera representation with
        // initial values from the scene camera.
        this.camera.setFromObject(getCameraResponse.result);

        this.camera.matrix = getCameraTransformResponse.result;


        // Set the scene up vector (depends on the application that
        // created the scene and affects navigation).
        this.camera.sceneUpDirection = this.sceneUpVector;

            /*
        this.camera.addEventListener("transform_change", event => {
            // At this point we know that the client side camera
            // transform has changed and that the scene camera needs
            // to be updated for this to be reflected in the rendering.

            // Previously in the example commands have been added by
            // using service.addCommand(). This is fine for commands
            // that just needs to be executed once, such as commands
            // to load the scene, create scopes, etc. But in this case
            // we need to update the server side camera as a response
            // to user input. While the service is busy processing
            // commands it will simply queue up any commands added by
            // service.addCommand(). So adding a command to update the
            // camera transform everytime the client side camera
            // transform change would flood the service with redundant
            // commands. What is needed is a mechanism to know when the
            // service is ready to process new commands, and this is done
            // by using the process commands callback mechansism.

            // Add a callback to the service that will be called when
            // the service is no longer buzy processing commands. During
            // now and the time this callback is made it is the
            // responsibility of the application to keep track of user
            // input and translate that into an optimized set of commands
            // when the callback is made. The callback will be placed in a
            // queue so any callbacks added by other parts of the
            // application before this one will be called first, and
            // consequently any commands they add will be processed before
            // any commands added by this callback.
            this.service.addCallback( (seq) => this.updateCameraTransformCallback(seq));
        });;
*/
        this.state.status = "Rendering using server side render loop...";
        this.service.addCommand(new Command("render_loop_start", {render_loop_name:this.renderLoopName, render_loop_handler_name:this.renderLoopHandlerName, scene_name: this.sceneName, render_loop_handler_parameters: [ "renderer", this.state.renderer ], timeout: this.state.renderLoopExpiryTime}),() => { this.startLocalRenderLoop() });
    }

    /**
     * Starts the local render loop to fetch rendered images from the server.
     * Renders will be retrieved at a fixed frame rate configured by the
     * renderFPS variable.
     */
    startLocalRenderLoop(resp)
    {
        if(resp != null && resp.isErrorResponse)
        {
            this.state.status = "Creation of render loop failed.";
            return;
        }

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
            this.service.addCallback( (seq) => {
                // The service is now ready to process commands and it is
                // time to generate an optimized sequence of commands that
                // updated the camera transform. In this case this is very
                // simple since the client side camera representation is
                // keeping track of the most recent camera transform and
                // this is what should be used.

                if (this.service.connectorName == 'WS') {
                    this.service.update_camera(this.renderLoopName,{camera_instance: { name: this.cameraInstanceName, transform: this.camera.matrix }});
                } else {
                    // Add the command that sets the camera instance transform
                    // to the most recent value. Note that this command must be
                    // added to the supplied ICommandSequence instance, not by
                    // using service.addCommand().
                    seq.addCommand(new Command("instance_set_world_to_obj", {instance_name:this.cameraInstanceName, transform:this.camera.matrix}));
                    seq.addCommand(new Command("render_loop_cancel_render", {render_loop_name:this.renderLoopName, cancel_level: 1}));
                }
                this.localLoop.restart();
            });
        })

        // watch renderer
        autorun( reaction => {
            this.service.addCommand(
                new Command("render_loop_set_parameter", {render_loop_name:this.renderLoopName,key:"renderer",value:this.state.renderer})
            );
        });

        // watch selection to outline it.
        autorun( reaction => {
            // Now that we picked something, set the outline parameter to highlight. Format is:
            //    r,g,b;outline_instance(,outline_instance)*(;(watch_instance)?(,watch_instance)*(;disable_instance(,disable_instance)*)?)?
            const outline = this.state.outlined && this.state.outlined.length ? ('1,1,0;' + this.state.outlined.join(',')) : '';
            this.service.addCommand(
                new Command("render_loop_set_parameter", {
                    render_loop_name: this.renderLoopName,
                    key: "outline",
                    value: outline
                }), (resp) => {
                    this.service.addCommand(new Command("render_loop_mark_dirty", {
                        render_loop_name: this.renderLoopName,
                        cancel_level: 1
                    }), (resp) => {
                        this.localLoop.restart();
                    }); 
                });
        });
    }

    /**
     * Called when the service is ready to process commands for this
     * callback.
     */
    updateCameraTransformCallback(seq)
    {
        // The service is now ready to process commands and it is
        // time to generate an optimized sequence of commands that
        // updated the camera transform. In this case this is very
        // simple since the client side camera representation is
        // keeping track of the most recent camera transform and
        // this is what should be used.

        if (this.service.connectorName == 'WS') {
            this.service.update_camera(this.renderLoopName,{camera_instance: { name: this.cameraInstanceName, transform: this.camera.matrix }});
        } else {
            // Add the command that sets the camera instance transform
            // to the most recent value. Note that this command must be
            // added to the supplied ICommandSequence instance, not by
            // using service.addCommand().
            seq.addCommand(new Command("instance_set_world_to_obj", {instance_name:this.cameraInstanceName, transform:this.camera.matrix}));
            seq.addCommand(new Command("render_loop_cancel_render", {render_loop_name:this.renderLoopName, cancel_level: 1}));
        }
        //renderIsConverged = false;
        this.localLoop.restart();
        /*
        // if the render loop is not running, and we're not streaming, start it again
        if (renderLoopTimer==null && !webSocketStreamer) {
            restartedRenderLoop = true;
            setStatus("Scene dirty, restarting client render loop.");
            startLocalRenderLoop(null);
        }*/
    }

    async pick(x,y) {
        const params = {
                "pick_request":     { type: "Sint32",       value: ++this.pickRequest},
                "pick_position":    { type: "Float32<2>",   value: {x,y} }
        }
        const batch = new BatchCommand();
        const pickCommand = new Command("element_set_attributes", {
            element_name: this.cameraName,
            attributes: params,
            create: true
        });
        batch.addCommand(pickCommand);

        // Must mark the scene dirty to create a new transaction
        batch.addCommand(new Command("render_loop_cancel_render", {
            render_loop_name: this.renderLoopName
        }));

        // Send the commands to the server
        this.service.addCommand(batch);

        return new Promise((resolved, rejected) => {
            // Wait then poll for our pick results on the render loop
            setTimeout(() => this.pickPollCallback(resolved,rejected), 500); 
        });
    }

    pickPollCallback(resolved,rejected) {
        const pollBatch = new BatchCommand();
        ["pick_response", "pick_result_error", "pick_result_position", "pick_result_object_name", "pick_result_path"].forEach((attr_name) => {
            pollBatch.addCommand(new Command("element_get_attribute", {
                element_name: this.cameraName,
                attribute_name: attr_name
            }));
        });
        this.service.addCommand(pollBatch, (resp) => this.pickDoneCallback(resp,resolved,rejected));
    }

    pickDoneCallback(resp,resolved,rejected) {
        if (resp.isErrorResponse) {
            console.error("Pick Error: ", resp);
            rejected();
            return;
        }
        var pickResponse = resp.subResponses[0];
        if (pickResponse.isErrorResponse || pickResponse.result !== this.pickRequest) {
            setTimeout(() => this.pickPollCallback(resolved,rejected), 1000); 
        } else {
            var error = resp.subResponses[1].result;
            if (error && error.length > 0) {
                // picked nothing
                resolved(undefined);
            } else {
                var result = [{
                    world_point: resp.subResponses[2].result,
                    picked_object_name: resp.subResponses[3].result,
                    picked_object_instance: resp.subResponses[4].result[1],
                    paths: resp.subResponses[4].result
                }];
                resolved(result);
            }
        }
    }

}
