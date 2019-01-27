/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/

// ----- Public Class: RSService -----

// RSService Public Interface:

/**
 * @class RSService
 * The main RealityServer Client Library class that can process
 * RealityServer commands. This interface specifies the methods and
 * properties that allows commands to be processed by RealityServer
 * and introduce a couple of important concepts that will be briefly
 * covered here.
 *
 * <b>%Command Processing</b>
 * The most obvious goal of the RealityServer client library is to
 * make it as easy as possible to process RealityServer webservice
 * commands. The service accepts commands for processing from the
 * application, for instance by calling RSService.addCommand().
 * Commands will be processed one by one in the order they are added.
 * If the responses of the commands are of interest it is possible to
 * add response handlers that will be called when commands have been
 * processed. The service can optimize command processing by sending
 * a bunch of commands to the server at once, but logically all
 * commands are serialized and processed one by one. Commands also
 * fail individually so command processing will always continue with
 * the next command even if the previous command failed. %Command
 * processing
 * is asynchronous and adding commands while the service is busy will
 * cause the commands to queue up, meaning it might take some time
 * before they are finally sent to the server and processed. The
 * RealityServer client library will alwasy process all added commands
 * and even if processing of commands might be delayed there is no
 * concept of a command queue or any possibility to remove reduntant
 * commands once they are added to the service. This means that it is
 * vital that the application don't add any redundant commands. To be
 * able to accomplish this the application will need some way to know
 * when the service is ready to process commands. This is solved by
 * the central concept called <i>Process Commands Callback</i>.
 *
 * <b>Process Commands Callback</b>
 *
 * This is the core mechanism that the RealityServer Client
 * Library use to process commands and is used to
 * know when the service is ready to process commands. When the
 * application needs to process commands, for instance in response
 * to user input, it should generally not add the commands directly
 * by using RSService.addCommand(). Instead it should add a Process
 * Commands Callback by calling RSService.addCallback(callbackFunc).
 * What the application essentially say is this: Hello service! I
 * have some commands I need to process. Please call the supplied
 * function when you have time to process them. The service may
 * then call this function immediately, or after some time if
 * currently busy, at which point the application adds the commands.
 *
 * <p>When adding a callback using RSService.addCallback() it will be
 * placed in a callback queue. Each callback represents some part of
 * the application that wish to process commands, for instance to
 * update the scene database, render the scene, or maybe persist some
 * data to a database. Each callback, when made, can then add zero or
 * more commands that will then be processed by the service immediately.
 * It is important to note that while there is no concept of a command
 * queue in the RealityServer Client Library, there is a process
 * commands callback queue instead. The same callback can only be
 * added once at a time, but is single shot. When the applicaiton needs
 * to process commands again it needs add the callback again. It is the
 * responsibility of the application to keep track of user input, etc,
 * occuring in the time between adding the callback and when it is
 * actually made, at which point the application must add an optimized
 * sequence of commands.</P>
 *
 * <b><i>Exmple:</i></b> Scene Navigation
 *
 * <p>An application wants to implement scene navigation by letting the
 * user drag the mouse on the rendered scnene image. To accomplish this
 * the application would have to perform the following steps: </p>
 * <p><b>1.</b> When the user triggers a mouse drag event, register a
 * process commands callback and indicate that a callback is pending.</p>
 *
 * <p><b>2.</b> While the callback is pending, update a client local
 * camera transform each time the user triggers new mouse drag events.</p>
 *
 * <p><b>3.</b> When the callback is made, add a RealityServer command
 * that updates the camera transform to the current value.
 * </p>
 *
 * <p><b>4.</b> Clear the indication that a callback is pending and
 * repeat from step 1.</p>
 *
 * <p>As can be seen in this example the callback mechanism can be used
 * to add a single command to update the camera transform at the time when
 * the service is ready to process the command. This can't be accomplished
 * with the RSService.addCommand() method since the service will always
 * execute all commands added and there is no way to know when it is a good
 * time to add commands. It is important to note that RSService.addCommand()
 * is just a convenience method so that a callback does not need to be
 * registered when not needed. Internally a call to addCommand will result
 * in a callback being added to the callback queue, so commands added this
 * way will not be executed before any callbacks already in the queue.
 * This means that adding command A using addCommand() is equivalent to
 * adding a callback and adding A when the callback is made. An example
 * when callbacks are not needed is for instance when initializing an
 * application. During initialization it is common for a fixed sequence
 * of commands, for instance to load a scene, create scopes, etc, to be
 * executed. It is perfectly safe to use both addCommand() and the
 * callback mechanism at the same time.</p>
 *
 * <p><b>State Data</b></p>
 *
 * <p>RealityServer commands are executed in a specific state that is set
 * up by optional state handers on the server. The state handler
 * determines things like the scope in which to execute commands based on
 * parameters passed with the low level request, for
 * instance an HTTP request. Since the user of the RealityServer Client
 * library should not have to worry how commands are sent to the server
 * this state data is instead specified using an object implementing the
 * StateData interface. This interface allow specification of a path
 * and a set of key/value pairs that the server side state handler then
 * inspects to determine the state to execute the commands in. The
 * StateData instance to use when executing a command is determined
 * when calling the RSService.addCallback method (or the
 * RSService.addCommand method). All commands added in the callback
 * will be associated with this state data and the service will make sure
 * that the commands are processed on the server in such a way that the
 * RealityServer state handler is invoked with the provided data. Note
 * that this means that to add commands using different state data they
 * have to be added in different callbacks. The StateData interface also
 * allow specification of state commands which can be used to for instance
 * call the set_scope command. Again the service will make sure that
 * commands are processed on the server in such a way that state commands
 * affect all the commands associated with a specific StateData instance.
 * </p>
 *
 * <p>RSService also allow setting a default StateData to use when no
 * explicit state data is specified in calls to addCommand or addCallback.
 * If no state is specified at all then the commands will be executed in
 * the default (global) scope.</p>
 *
 * <p><b>Connectors</b></p>
 *
 * <p>The RealityServer Client library delegates actual processing of
 * commands to a connector. All client library implementations support
 * a HTTP connector which process commands using HTTP requests. The
 * ActionScript libary also supports an RTMP connector in addition to
 * the HTTP connector which can be enabled to get access to RTMP specific
 * commands. The %RSService.connectorName can be used to determine which
 * connector is currently in use. The RSService will also dispatch
 * %RSService events to indication when the connector has switched so that
 * the application can take advantage of any connector specific commands.
 * </p>
 */

/**
 * @ctor
 * Creates an %RSService object. Note that the defaultStateData and the ssl
 * argument can be swapped when calling creating %RSService.
 * @param host String The host name or ip number of the server.
 * @param port Number The server port.
 * @param defaultStateData StateData Optional. The default state data. If
 * not specified an empty state data instance will be created and used as
 * default.
 * @param ssl if true then make a secure HTTPS connection, if false use
 * HTTP. If not defined then use the page protocol.

 */
com.mi.rs.RSService = function(host, port, defaultStateData, ssl)
{
    if(typeof host !== "string")
        throw new String("Failed to create RSService instance. Host parameter not of required type string. type: " + (typeof host));

    if(typeof port !== "number")
        throw new String("Failed to create RSService instance. Port parameter not of required type number. type: " + (typeof port));

    // allow ssl as the 3rd argument
    if (defaultStateData === true || defaultStateData === false) {
        // swap ssl and defaultStateData
        var temp = ssl;
        ssl = defaultStateData;
        defaultStateData = temp;
    }

    if(!defaultStateData)
        this.defaultStateData = new com.mi.rs.StateData();
    else
        this.defaultStateData = defaultStateData;

    protocol = "//";
    if (ssl === true) {
        protocol = "https://";
    } else if (ssl === false) {
        protocol = "http://";
    }
    this.baseURL = protocol + host + ":" + port + "/";

    this.m_next_id = 0;
    this.m_callback_queue = new com.mi.rs.CallbackQueue();
    this.m_is_busy = false;
    this.m_current_cmd_sequence = null;
    this.m_current_service_callback = null;
    this.connectorName = "HTTP";

    this.m_general_error_handler = this.on_default_general_error;
    this.m_response_error_handler = this.on_default_response_error;
    this.m_callback_error_handler = this.on_default_callback_error;
    this.m_http_status_handler = null;
}

/**
 * The response error code for commands that could not be processed
 * because of an internal client side library error. Client side
 * errors are in the range 5000 to 5999.
 */
com.mi.rs.RSService.CLIENT_SIDE_ERROR_CODE_INTERNAL = -5000;

/**
 * The response error code for commands that could not be
 * processed because of a connection error. Client side
 * errors are in the range 5000 to 5999.
 */
com.mi.rs.RSService.CLIENT_SIDE_ERROR_CODE_CONNECTION = -5100;

/**
 * @private String
 * Characters to use in random strings.
 */
com.mi.rs.RSService.uidArr = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','x','y','z'];

/**
 * @static com::mi::rs::RSService
 * Creates a random string of the given lenght using characters 0-9 and a-z.
 * @param length Number
 * @return String
 */
com.mi.rs.RSService.createRandomString = function(length)
{
    var charsArr = com.mi.rs.RSService.uidArr;

//    alert("createRandomString called with length: " + length)
    var id = "";
    var len = charsArr.length;
    for(var i=0; i<length; i++)
    {
        var n = Math.floor((Math.random()*len));
//        alert("n: " + n + " id: " + id);
        id += charsArr[n];
    }

    return id;
}

/**
 * Returns a string describing this Object.
 * @return String A String describing this Object.
 */
com.mi.rs.RSService.prototype.toString = function()
{
    return "[Object RSService(" + this.baseURL + ")]";
}

/**
 * @public String
 * Returns the base URL to the service. The base URL is the
 * URL with no path or URL arguments added.
 * <p>Example: <code>http://somehost:8080/</code></p>
 */
com.mi.rs.RSService.prototype.baseURL;

/**
 * @public String
 * Returns the name of the current connector. The connector
 * encapsulates the on-the-wire protocol used to process
 * commands. Currently one connector is available:<p>
 * "HTTP" - Commands are processed using HTTP requests.<br>
 */
com.mi.rs.RSService.prototype.connectorName;

/**
 * @public com::mi::rs::StateData
 * The default state data for this RSService instance. If no state
 * data is specified in the addCommand and addCallback methods,
 * then this is the state data that will be used.
 */
com.mi.rs.RSService.prototype.defaultStateData;

/**
 * @private com::mi::rs::ServiceCallback
 * The service callback that keeps track of commands added by the addCommand
 * method.
 */
com.mi.rs.RSService.prototype.m_current_service_callback;

/**
 * Adds a command to be processed. The service guarantees that
 * all added commands will be processed and any response handler will
 * always be called regardless of if previous commands experience
 * errors. Furthermore added commands will always be executed in the
 * order they were added.
 * <p>
 * Note that adding commands using this method is equivalent to
 * registering a process commands callback and adding commands
 * when the process commands callback is made. This means that any
 * callbacks already registered will be executed before the command
 * (or commands if the delayProcessing flag is used) added using this
 * method.
 * <p>
 * Example: Adding commands A, B, and C with delayProcessing set to
 * true for A and B, but false for C will be equivalent to register a
 * callback and add A, B, and C when the callback is made.
 *
 * @param cmd com::mi::rs:Command The command to add.
 *
 * @param responseHandler Object Optional. If specified, this is
 * a callback that will be called when the command has been
 * processed. The response handler is either a function or
 * a callback object of the form {method:String, context:Object}.
 * In the first form the function will be called in the context of the
 * global object meaning that the this pointer will refer to the global
 * object. The second form will call the function with the name given
 * by the "method" member in the context of the object given by the
 * "context" member. If the callback object is specified as
 * {method:"myMethod", context:someObject} the call made will be
 * someObject["myMethod"](response). The object passed in the callback
 * have the type com.mi.rs.Response and can be used to check if the
 * command succeeded and to access any returned data.
 *
 * @param stateData com.mi.rs.StateData Optional. The state data to use. If null or omitted
 * the default state data will be used as specified in the constructor.
 *
 * @param delayProcessing Boolean A hint that tells the service not to try to send the
 * command immediately. This hint is useful when adding a sequence
 * of commands in one go. Specifying this flag to true for all
 * commands except the last one added will ensure that the Service
 * don't start processing the events immediately, but holds
 * processing until the last command in the sequence has been added.
 **/
com.mi.rs.RSService.prototype.addCommand = function(cmd, responseHandler, stateData, delayProcessing)
{
//    alert("addCommand called with cmd: " + cmd + " responseHandler: " + (responseHandler != null) + " delayProcessing: " + delayProcessing);

    // If no state data is defined, use the default state data. Also make a
    // rudimentary check to see that the stateData implements the StateData
    // interface
    if(!stateData)
        stateData = this.defaultStateData
    else if( (typeof stateData !== "object") || (stateData.stateCommands === undefined) )
        throw new String("RSService.addCallback called but stateData was not of the correct type or didn't implement the StateData interface. type: " + (typeof stateData));

    // Create the current service callback if it doesn't exist.
    if(this.m_current_service_callback == null)
        this.m_current_service_callback = new com.mi.rs.ServiceCallback(stateData);

    // If the current service callback use another stateData instance,
    // then it needs to be added to the callback queue and
    // a new service callback needs to be created.
    if(this.m_current_service_callback.stateData !== stateData)
    {
        this.addCallback(this.m_current_service_callback.processCommandsCallback, this.m_current_service_callback.stateData, delayProcessing);
        this.m_current_service_callback = new com.mi.rs.ServiceCallback(stateData);
    }

    // Add the command to the current service callback.
    this.m_current_service_callback.commands.push(new com.mi.rs.OutgoingCommand(cmd, responseHandler, this));

    // If processing shouldn't be delayed then add the current service
    // callback and then clear m_current_service_callback.
    if(delayProcessing !== true)
    {
        this.addCallback(this.m_current_service_callback.processCommandsCallback, this.m_current_service_callback.stateData);
        this.m_current_service_callback = null;
    }

}

/**
 * @private
 * Private helper function that is added as process callback for commands
 * added by calling the RSService.addCommand method.
 */
com.mi.rs.RSService.prototype.service_process_commands_callback = function(seq)
{
//    alert("service_process_commands_callback called! this: " + this + " seq: " + seq);

    // copy contents of the service cmd sequence into the one provided by
    // the callback.
    seq.copy_from(this.m_service_command_seq);

    // Done with this command sequence, create a new one.
    this.m_service_command_seq = new com.mi.rs.CommandSequence(this);
}


/**
 * @private com::mi::util::Queue
 * The process commands callback queue. Contains
 * the added callback functions that will be called to generate
 * commands to process.
 */
com.mi.rs.RSService.prototype.m_callback_queue;

/**
 * <p>Adds a callback to the end of the callback queue. The callback
 * will be made at the point in time when the service is ready to
 * process commands generated by this callback. Callbacks will
 * always be made in the order they were registered with the
 * service, so if callback A is added before callback B, then A
 * will be called before B and consequently any commands added by
 * A will be processed before any commands added by B.</p>
 *
 * <p>Callbacks are one-shot, meaning that a callback needs to be
 * registered every time the application needs to process commands.
 * The same callback can only be registered once at a time. The
 * application is responsible for keeping track of any user input
 * that occurs while waiting for the callback and convert that
 * user input into an optimized sequence of NWS commands. The same
 * callback function can be added again as soon as it has been
 * called or cancelled.</p>
 *
 * <p>NOTE: When the callback is made the supplied CommandSequence
 * instance must be used to add the commands, not
 * RSService.addCommand().</p>
 *
 * @param callback Object The callback. This is either a function or
 * a callback object of the form {method:String, context:Object}.
 * In the first form the function will be called in the context of the
 * global object meaning that the this pointer will refer to the global
 * object. The second form will call the function with the name given
 * by the "callback" memeber in the context of the object given by the
 * context member. In the example {method:"myMethod",
 * context:someObject} the call made will be someObject["myMethod"](seq).
 * The callback function (regardless of which form is used when
 * registering the callback) will be called with a single argument
 * which is the CommandSequence to which commands should be added
 * using the addCommand(cmd, responseHandler) method.
 *
 * @param stateData com::mi::rs::StateData Optional. The state data to use. If null or omitted
 * the default state data will be used as specified in the constructor.
 *
 * @param delayProcessing Boolean Optional. This flag instructs the
 * service if it should delay processing of the added callback or not.
 * Defaults to false which is recommended in most cases.
 */
com.mi.rs.RSService.prototype.addCallback = function(callback, stateData, delayProcessing)
{
//    alert("addCallback called. Callback: " + (callback != null) + " delayProcessing: " + delayProcessing + " indexOf: " + this.m_callback_queue.indexOf(callback));

    if(callback == null || callback == undefined)
        throw new String("RSService.addCallback called but callback was not defined or null.");

    if(typeof callback !== "function")
    {
        // check if it is a valid callback object
        if( (typeof callback.method !== "string") || (typeof callback.context !== "object"))
            throw new String("RSService.addCallback called but callback was not a function or callback object of the form {method:String, context:Object}.");
    }

    // If no state data is defined, use the default state data. Also make a
    // rudimentary check to see that the stateData implements the StateData
    // interface
    if(!stateData)
        stateData = this.defaultStateData
    else if( (typeof stateData !== "object") || (stateData.stateCommands === undefined) )
        throw new String("RSService.addCallback called but stateData didn't implement the StateData interface. type: " + (typeof stateData));

    // Add callback if not already in the queue
    if(!this.m_callback_queue.hasCallback(callback))
        this.m_callback_queue.pushCallback(new com.mi.rs.CallbackWrapper(callback, stateData));

    // Process the callbacks in the queue, unless delayProcessing is true.
    if(delayProcessing !== true)
        this.process_callbacks();
}

/**
 * Cancels a registered process commands callback. This call removes
 * the callback from the queue. Useful if the callback is no longer
 * needed, or if the callback needs to be moved to the end of the
 * queue. In the latter case, first cancelling and then adding the
 * callback makse sure that it is executed after any callbacks
 * already in the callback queue.
 *
 * @param callback Function The previously added callback function.
 *
 * @return Boolean true if the callback was cancelled, false if it was not
 *         in the queue.
 */
com.mi.rs.RSService.prototype.cancelCallback = function(callback)
{
    if(callback == null || callback == undefined)
        throw new String("RSService.addCallback called but callback was not defined or null.");

    if(typeof callback !== "function")
    {
        // check if it is a valid callback object
        if( (typeof callback.method !== "string") || (typeof callback.context !== "object"))
            throw new String("RSService.addCallback called but callback was not a function or callback object of the form {method:String, context:Object}.");
    }

    return this.m_callback_queue.removeCallback(callback);
}

/**
 * Creates a JSON-RPC 2.0 object from the given parameters suitable to
 * be stringified by the JSON class.
 *
 * @param name String The name of the RealityServer webservice command.
 *
 * @param params Object The Object containing the named parameters of the
 *               realityserver command.
 *
 * @param id int The id of the JSON-RPC request. Optional, if omitted the
 *        constructed JSON-RPC request object will not have an id
 *        parameter.
 *
 * @return Object An object that has the structure of an JSON-RPC 2.0
 *         request.
 */
com.mi.rs.RSService.createJsonRequest = function(name, params, id)
{
    if(id == undefined)
        id = -1;

     if(id >= 0)
        return { "method" : name, "params" : params, "jsonrpc" : "2.0", "id" : id };
    return { "method" : name, "params" : params, "jsonrpc" : "2.0"};
}

// RSService Private Implementation:

/** @private uint The command id counter. */
com.mi.rs.RSService.prototype.m_next_id;

/** @private Boolean True if waiting for an HTTP request to complete. */
com.mi.rs.RSService.prototype.m_is_busy;

/** @private ICommandSequence The command sequence currently being processed
 *, or null. */
com.mi.rs.RSService.prototype.m_current_cmd_sequence;

/** @private Array Contains the OutputCommand commands currently on-the-wire.  */
com.mi.rs.RSService.prototype.m_current_commands;

/** @private Object Associative array that maps command ids to
 * OutgoingCommand objects. */
com.mi.rs.RSService.prototype.m_current_commands_response_map;

/** @private XMLHttpRequest The XMLHttpRequest instance used to communicate
 * with the server. */
com.mi.rs.RSService.prototype.m_xmlhttp;

/**
 * @private Checks if an object is a render command.
 *
 * @param cmd com.mi.rs.Command The object to check.
 * @return Boolean. True if the object is a render command, false otherwise.
 */
com.mi.rs.RSService.prototype.is_render_command = function(cmd)
{
    // FIXME: maybe a bit more robust checking, although this is a
    // pretty unique identifying marker.
    if(cmd.renderTarget instanceof com.mi.rs.ImageRenderTarget)
        return true;
    return false;
}

/**
 * @private Processes the callbacks in the callback queue.
 */
com.mi.rs.RSService.prototype.process_callbacks = function()
{
//    alert("Processing callbacks! len: " + this.m_callback_queue.m_callbacks.length + " m_is_busy: " + this.m_is_busy);

    // If we are buzy then nothing to do at the moment.
    if(this.m_is_busy === true)
        return;

    var safe_seq /* ICommandSequence */ = null;

    // Check if we have left-over work to do
    if(this.m_current_cmd_sequence !== null)
    {
//        alert("Detected current command sequence that needs more processing!");

        // Indicate that we are busy. This prevents any process_callbacks calls
        // generated by the callbacks to be processed immediately.
        this.m_is_busy = true;

        // we need to split up the stored command sequence into chunks
        // that are safe to send.
        safe_seq /* ICommandSequence */ = this.m_current_cmd_sequence.get_safe_subsequence();

        // If no more commands left in m_current_cmd_sequence, set it to
        // null. Otherwise keep it and process it again next call.
        if(this.m_current_cmd_sequence.commands.length === 0)
            this.m_current_cmd_sequence = null;

        this.process_commands(safe_seq);
        return;
    }

    // If no callbacks in the queue, then we are done for now.
    if(this.m_callback_queue.m_callbacks.length === 0)
        return;

//    alert("processing new callbacks! this.m_callback_queue.m_callbacks.length: " + this.m_callback_queue.m_callbacks.length);

    // Indicate that we are busy.
    this.m_is_busy = true;

    // The command sequence we need to fill with commands from
    // callbacks
    var seq = null;

    // Go through all the current callbacks (and any callbacks
    // added by those callbacks) until we hit a binary command
    // or a callback using a different stateData instance.
    var callback_count = 0;
    while(this.m_callback_queue.m_callbacks.length > 0)
    {
        // Create the command sequence if not done yet
        if(seq === null)
            seq = new com.mi.rs.CommandSequence(this, this.m_callback_queue.getFrontCallback().stateData);

        // Check if the next callback is using the same stateData.
        // If not we need to stop and process the current command
        // sequence first.
        if(this.m_callback_queue.getFrontCallback().stateData !== seq.stateData)
            break;

        // Next callback is using the same state data, so call it
        // and add the commands to seq.
        var callbackWrapper = this.m_callback_queue.popCallback();
        function handler()
        {
            var callback = callbackWrapper.callback;
            if(typeof callback === "function")
                callback(seq);
            else
            {
                if(typeof callback.context[callback.method] !== "function")
                    throw new String("Failed to call callback method \"" + callback.method + "\" on context " + callback.context + ". Method does not exist.");
                callback.context[callback.method](seq);
            }
        }

        if (com.mi.rs.OutgoingCommand.enableTryCatch)
        {
            try
            {
                handler.call(this);
            }
            catch(e)
            {
                //alert("Exception caught in process commands callback handler: " + e);
                this.on_callback_error(e);
            }
        }
        else
        {
            handler.call(this);
        }
        ++callback_count;

        // If we get a sequence containing binary commands we
        // need to stop, otherwise continue calling callbacks if
        // there are any left.
        if(seq.contains_render_commands)
            break;
    }

//    alert("Processed " + callback_count + " callbacks. seq.length: " + seq.commands.length + ". " + this.m_callback_queue.m_callbacks.length + " callbacks left in queue. seq.contains_render_commands: " + seq.contains_render_commands + " seq.contains_response_handlers: " + seq.contains_response_handlers);

    if(seq.commands.length === 0)
    {
        // Callbacks didn't produce any commands to process, so we are done.
        this.m_is_busy = false;
        this.process_callbacks();
        return;
    }

    // we need to split up the command sequence into chunks that are safe
    // to send.
    safe_seq /* ICommandSequence */ = seq.get_safe_subsequence();

    // If there are still commands in the sequence, then we need
    // to store it and continue processing it later.
    if(seq.commands.length > 0)
        this.m_current_cmd_sequence = seq;

    this.process_commands(safe_seq);
}

/**
 * @private Helper function that process all the commands in the given
 * CommandSequence. An assumption is made that all the commands are safe
 * to send in a single request. If there is a render command, it must be
 * the last command, and no other commands may have callbacks.
 */
com.mi.rs.RSService.prototype.process_commands = function(seq /*ICommandSequence*/)
{
//    alert("Processing " + seq.commands.length + " commands! Contains render command: " + seq.contains_render_commands + " contains callbacks: " + seq.contains_response_handlers);

    // Remove any commands that might have been cancelled.
    seq.remove_cancelled_commands();


    // If no commands left to process, flag that we are no longer buzy
    // and continue to process callbacks.
    if(seq.commands.length === 0)
    {
        this.m_is_busy = false;
        this.process_callbacks();
        return;
    }

    // Generate the list of commands to send.

    // Array containing the commands to send
    var commands = null;

    var stateCommands = seq.stateData.stateCommands;

    var icmd; /*ICommand*/
    var out_cmd; /*OutgoingCommand*/
    var len; /*int*/
    var i; /*int*/

    // Build the array of commands to send
    if( (stateCommands == null || stateCommands.length == 0) )
    {
        // no state commands, use the seq.commands directly.
        commands = seq.commands;
    }
    else
    {
        // Build a new array including the state commands with all the commands.
        commands = new Array();

        // add prefix commands
        if(stateCommands != null)
        {
            len = stateCommands.length;
            for(i=0; i<len; i++)
            {
                icmd = stateCommands[i];
                commands.push(new com.mi.rs.OutgoingCommand(icmd, null, this));
            }
        }

        // add normal commands
        len = seq.commands.length;
        for(i=0; i<len; i++)
        {
            icmd = seq.commands[i];
            commands.push(icmd)
        }

    }

    this.m_current_commands = commands;
    this.m_current_commands_response_map = new Object();

    // Convert the commands one by one to json strings.
    var cmds = new Array();
    var len = commands.length;
    for(var i=0; i<len; i++)
    {
        var cmd /*OutgoingCommand*/ = commands[i];

        // Add the command to the response map if it has a callaback.
        if(cmd.cmd_id >= 0)
            this.m_current_commands_response_map[String(cmd.cmd_id)] = cmd;

        var jobj = cmd.json_object();
        try
        {
            cmds.push(JSON.stringify(jobj));
        }
        catch(e)
        {
            // FIXME:
            // Strictly speaking, this callback can't be made
            // immediately since that breaks the service contract that
            // response handlers are called in the same order they are
            // handed to the service.

            // failed to json serialize the command. call response
            // handler with an error (if one is registered).
            cmd.service = this;
            cmd.do_client_error_callback("Failed to JSON serialize the command. " + e, com.mi.rs.RSService.CLIENT_SIDE_ERROR_CODE_INTERNAL);
        }

    }

    // FIXME: If the sequence contains a render command, then the params
    // will need to be added in the URL itself. Images can only be loaded
    // using get. To be sure this is handled correctly the URL can't be
    // too big, so we might need to split the commands into more than one
    // HTTP GET request. This is currently not done...
    // NOTE: There has been an addition made to CommandSequence to check the length of a request.
    // If the request is seen to be too long and there is a render command without callbacks, it is
    // considered to have a callback and the render request is left behind for the next process.

    // Convert the array of stringified commands to a json array:
    var arr_str = "[";
    len = cmds.length;
    for(i=0; i<len; i++)
    {
        arr_str += cmds[i];
        if(i<(len-1))
            arr_str += ",";
    }
    arr_str += "]";

    // Convert the StateData.parameters into a url parameter string.
    var param_str /*String*/ = "";
    var params /*Array*/ = seq.stateData.parameters;
    if(params != null)
    {
        for(var param_key in params)
        {
            if(param_str.length > 0)
                param_str += "&"
            param_str += (param_key + "=" + encodeURIComponent(String(params[param_key])));
        }
    }

    var url_path = (seq.stateData.path === null ? "" : seq.stateData.path);

    if(seq.contains_render_commands === true)
    {
//        alert("Sequence with render command detected!");

        // It is a requirement that seq only contains commands without
        // response handlers (except that the render command may have
        // one) and that the render command is the last command.

        var renderCommand /*OutgoingCommand*/ = seq.commands[seq.commands.length-1];
        renderCommand.service = this;
        if(!this.is_render_command(renderCommand.cmd))
        {
            renderCommand.do_client_error_callback("Failed to send render command. Failed to acquire the render command to send from the command sequence.", com.mi.rs.RSService.CLIENT_SIDE_ERROR_CODE_INTERNAL);
            this.m_is_busy = false;
            this.process_callbacks();
            throw new String("Failed to send render command. Failed to acquire the render command to send from the command sequence.");
        }

        var renderTarget /*ImageRenderTarget*/ = renderCommand.cmd.renderTarget;
        if(!(renderTarget instanceof com.mi.rs.ImageRenderTarget))
        {
            renderCommand.do_client_error_callback("Failed to send render command. Failed to acquire the ImageRenderTarget object.", com.mi.rs.RSService.CLIENT_SIDE_ERROR_CODE_INTERNAL);
            this.m_is_busy = false;
            this.process_callbacks();
            return;
        }

        var rid = com.mi.rs.RSService.createRandomString(7);

        var service = this;

        // Set the image.src property to load the image
        var renderURL = this.baseURL + url_path + "?json_rpc_request=" + encodeURIComponent(arr_str) + "&rid=" + rid + (param_str.length > 0 ? ("&" + param_str) : "");

        // Delegate loading of the URL to the ImageRenderTarget
        renderTarget.loadRenderURL(renderURL, this);

//        alert("Render request: " + img.src + " Commands: " + arr_str );
    }
    else
    {
        var requestURL = this.baseURL + url_path + (param_str.length > 0 ? ("?" + param_str) : "");

//        alert("Normal request: " + requestURL + " commands: " + arr_str);

        this.m_xmlhttp = new XMLHttpRequest();
        var service = this;
        this.m_xmlhttp.onreadystatechange = function(){ service.onreadystatechange(); };
        this.m_xmlhttp.open("POST", requestURL , true);
        this.m_xmlhttp.withCredentials = true;
        this.m_xmlhttp.setRequestHeader("Content-type", "application/json");

        this.m_xmlhttp.send(arr_str);
    }
}

/**
 * @private callback called when the image is loaded.
 */
com.mi.rs.RSService.prototype.on_image_loaded = function()
{
//    alert("image loaded! this: " + this);

    var renderCommand /*OutgoingCommand*/ = this.m_current_commands[this.m_current_commands.length-1];
    if(!this.is_render_command(renderCommand.cmd))
    {
        alert("Failed to make render command callback. Failed to acquire the render command from the stored command sequence.");
        throw new String("Failed to make render command callback. Failed to acquire the render command from the stored command sequence.");
    }

    renderCommand.service = this;
    renderCommand.do_result_callback({result:{}});

    // Continue to process callbacks.
    this.m_is_busy = false;
    this.process_callbacks();
}

/**
 * @private Callback that is called if the image failed to load.
 */
com.mi.rs.RSService.prototype.on_image_error = function()
{
//    alert("Image load error! this: " + this);

    var renderCommand /*OutgoingCommand*/ = this.m_current_commands[this.m_current_commands.length-1];
    if(!this.is_render_command(renderCommand.cmd))
    {
        alert("Failed to make render command callback. Failed to acquire the render command from the stored command sequence.");
        throw new String("Failed to make render command callback. Failed to acquire the render command from the stored command sequence.");
    }

    renderCommand.service = this;
    renderCommand.do_result_callback({error:{code:-2, message:"Failed to load image."}});

    // Continue to process callbacks.
    this.m_is_busy = false;
    this.process_callbacks();
}

/**
 * @private Helper function that is called when an AJAX request changes
 * state.
 */
com.mi.rs.RSService.prototype.onreadystatechange = function()
{
    // We don't care about the progress callbacks
    if(this.m_xmlhttp.readyState !== 4)
        return;

//    alert("onreadystatechange called! status: " + this.m_xmlhttp.status);

    if(this.m_xmlhttp.status !== 200)
    {
        var len = this.m_current_commands.length;
        for(var i=0; i<len; i++)
        {
            var cmd /*OutgoingCommand*/ = this.m_current_commands[i];
            cmd.service = this;
            cmd.do_client_error_callback("HTTP request failed. Status: " + this.m_xmlhttp.status, com.mi.rs.RSService.CLIENT_SIDE_ERROR_CODE_CONNECTION);
            this.on_http_status_callback(cmd, this.m_xmlhttp.status);
        }
        this.m_is_busy = false;
        this.process_callbacks();
        return;
    }

//    alert("responseText: " + this.m_xmlhttp.responseText);

    // Process the response
    var responses = null;
    try {
        responses = JSON.parse(this.m_xmlhttp.responseText);
    }
    catch (err) {
        console.error("Error parsing response: " , this.m_xmlhttp.responseText);
    }
    var len = responses.length;
    // Loop through all the responses.
    for(var i=0; i<len; i++)
    {
        var response = responses[i];
//        alert("response: " + JSON.stringify(response));

        if(response.id != null)
        {
            var cmd /*OutgoingCommand*/ = this.m_current_commands_response_map[response.id]
            cmd.service = this;
            cmd.do_result_callback(response)
        }
    }

    // Continue to process callbacks.
    this.m_is_busy = false;
    this.process_callbacks();
}

/**
 * Sets the general error handler.
 * This is called by both response and callback error handlers by default.
 *
 * If the handler is not a function the general error handler will be set to the default handler.
 *
 * @param handler Function Handler function to deal with all errors.
 */
com.mi.rs.RSService.prototype.set_general_error_handler = function(handler)
{
    if (typeof handler !== "function")
    {
        handler = this.on_default_general_error;
    }
    this.m_general_error_handler = handler;
}
/**
 * Returns the general error handler function.
 *
 * @return Function Handler function that deals with all errors.
 */
com.mi.rs.RSService.prototype.get_general_error_handler = function()
{
    if (typeof this.m_general_error_handler === "function")
    {
        return this.m_general_error_handler;
    }
    return this.on_default_general_error;
}

/**
 * Sets the response error handler.
 * This deals with errors that are caused by command response functions.
 *
 * If the handler is not a function the response error handler will be set to the default handler.
 *
 * @param handler Function Handler function to deal with command response function errors.
 */
com.mi.rs.RSService.prototype.set_response_error_handler = function(handler)
{
    if (typeof handler !== "function")
    {
        handler = this.on_default_response_error;
    }
    this.m_response_error_handler = handler;
}
/**
 * Returns the general error handler function.
 *
 * @return Function Handler function that deals with command response function errors.
 */
com.mi.rs.RSService.prototype.get_response_error_handler = function()
{
    if (typeof this.m_response_error_handler === "function")
    {
        return this.m_response_error_handler;
    }
    return this.on_response_general_error;
}

/**
 * Sets the callback error handler.
 * This deals with errors that are caused by callback functions (ie functions added to addCallback).
 *
 * If the handler is not a function the callback error handler will be set to the default handler.
 *
 * @param handler Function Handler function to deal with callback function errors.
 */
com.mi.rs.RSService.prototype.set_callback_error_handler = function(handler)
{
    if (typeof handler !== "function")
    {
        handler = this.on_default_callback_error;
    }
    this.m_callback_error_handler = handler;
}
/**
 * Returns the callback error handler function.
 *
 * @return Function Handler function that deals with callback function errors.
 */
com.mi.rs.RSService.prototype.get_callback_error_handler = function()
{
    if (typeof this.m_callback_error_handler === "function")
    {
        return this.m_callback_error_handler;
    }
    return this.on_callback_general_error;
}

/**
 * Sets the HTTP error status handler.
 * This deals with errors that are caused by the HTTP connection.
 *
 * If the handler is not a function the response error handler will be set to null.
 *
 * @param handler Function Handler function.
 */
com.mi.rs.RSService.prototype.set_http_status_handler = function(handler)
{
    if (typeof handler !== "function")
    {
        handler = null;
    }
    this.m_http_status_handler = handler;
}
/**
 * Returns the http status error handler function.
 *
 * @return Function Handler function.
 */
com.mi.rs.RSService.prototype.get_http_status_handler = function()
{
    if (typeof this.m_http_status_handler === "function")
    {
        return this.m_http_status_handler;
    }
    return null;
}

/**
 * @private Default general error function.
 */
com.mi.rs.RSService.prototype.on_default_general_error = function(error)
{
    var errorMsg = error.toString();
    if (typeof window.console !== "undefined")
    {
        console.error(errorMsg);
        return;
    }
    alert(errorMsg);
}

/**
 * @private Default response error function.
 */
com.mi.rs.RSService.prototype.on_default_response_error = function(error)
{
    this.on_general_error("Error in response: " + error);
}

/**
 * @private Default callback error function.
 */
com.mi.rs.RSService.prototype.on_default_callback_error = function(error)
{
    this.on_general_error("Error in callback: " + error);
}

/**
 * @private Calls the general error function handler.
 */
com.mi.rs.RSService.prototype.on_general_error = function(error)
{
    if (typeof this.m_general_error_handler === "function")
    {
        this.m_general_error_handler(error);
    }
    else
    {
        this.default_error_handler(error);
    }
}

/**
 * @private Calls the response error function handler.
 */
com.mi.rs.RSService.prototype.on_response_error = function(error)
{
    if (typeof this.m_response_error_handler === "function")
    {
        this.m_response_error_handler(error);
    }
    else
    {
        this.default_error_handler(error);
    }
}

/**
 * @private Calls the callback error function handler.
 */
com.mi.rs.RSService.prototype.on_callback_error = function(error)
{
    if (typeof this.m_callback_error_handler === "function")
    {
        this.m_callback_error_handler(error);
    }
    else
    {
        this.default_error_handler(error);
    }
}

/**
 * @private helper.
 */
com.mi.rs.RSService.prototype.on_http_status_callback = function(cmd /*Command*/, statusCode)
{
    if (typeof this.m_http_status_handler === "function")
    {
        this.m_http_status_handler(cmd, statusCode);
    }
}

// ----- Internal Class: OutgoingCommand -----

/* @private The next command id. */
com.mi.rs.next_command_id = 0;

/*
 * @private
 * @class OutgoingCommand
 * The %OutgoingCommand class wraps an ICommand instance and adds some
 * things needed to handle response callbacks etc. Used only internally
 * by the RSService implementation.
 */



/**
 * @ctor
 * Creates an %OutgoingCommand object.
 * @param cmd com::mi::rs::Command The command to wrap.
 * @param callback Function The callback associated with the command, or null.
 * @param service com::mi::rs::RSService The RSService which created this OutgoingCommand.
 */
com.mi.rs.OutgoingCommand = function(cmd, callback, service)
{
    this.cmd = cmd;
    if (typeof this.cmd.commandCallbackFactory === "function") {
        this.callback = this.cmd.commandCallbackFactory(callback,service);
    } else {
        this.callback = callback;
    }
    this.service = service;

    if((this.callback !== null) && (this.callback !== undefined))
        this.cmd_id = ++com.mi.rs.next_command_id;
    else
        this.cmd_id = -1;

//    alert("created " + this)
}

/** @private ICommand The command. */
com.mi.rs.OutgoingCommand.prototype.cmd;

/** @private Function The callback associated with the command, or null. */
com.mi.rs.OutgoingCommand.prototype.callback;

/** @private Boolean The command id. Only required when there is a callback */
com.mi.rs.OutgoingCommand.prototype.cmd_id;

/**
 * @static com.mi.rs.OutgoingCommand
 * Enables or disables try catches around callback handlers.
 * Disabling this can be useful during development as when there is
 * an error in a callback handler, the stack is lost.
 */
com.mi.rs.OutgoingCommand.enableTryCatch = false;

/**
 * Returns a JSON-RPC v2 friendly representation of the data of the command.
 */
com.mi.rs.OutgoingCommand.prototype.json_object = function()
{
    return com.mi.rs.RSService.createJsonRequest(this.cmd.name, this.cmd.params, this.cmd_id);
}

/**
 * Returns a string describing this Object.
 * @return String A String describing this Object.
 */
com.mi.rs.OutgoingCommand.prototype.toString = function()
{
    return "[Object OutgoingCommand(name: \"" + this.cmd.name + "\" id: " + this.cmd_id + ")]";
}

/**
 * @private helper.
 */
com.mi.rs.OutgoingCommand.prototype.do_client_error_callback = function(msg /*String*/, errorCode)
{
    if(this.callback === null || this.callback === undefined)
        return;

    function handler()
    {
        var callback = this.callback;
        if(typeof callback === "function")
            callback(new com.mi.rs.Response(this.cmd, {error:{code:errorCode, message:msg}}));
        else
        {
            if(typeof callback.context[callback.method] !== "function")
                throw new String("Failed to call response handler method \"" + callback.method + "\" on context " + callback.context + ". Method does not exist.");
            callback.context[callback.method](new com.mi.rs.Response(this.cmd, {error:{code:errorCode, message:msg}}));
        }
    }

    if (com.mi.rs.OutgoingCommand.enableTryCatch)
    {
        try
        {
            handler.call(this);
        }
        catch(e)
        {
            //alert("Exception thrown in response handler. " + e);
            this.service.on_response_error(e);
        }
    }
    else
    {
        handler.call(this);
    }
}

/**
 * @private helper.
 */
com.mi.rs.OutgoingCommand.prototype.do_result_callback = function(resp /*Object*/)
{
    if(this.callback === null || this.callback === undefined)
        return;

    function handler()
    {
        var callback = this.callback;
        if(typeof callback === "function")
            callback(new com.mi.rs.Response(this.cmd, resp));
        else
        {
            if(typeof callback.context[callback.method] !== "function")
                throw new String("Failed to call response handler method \"" + callback.method + "\" on context " + callback.context + ". Method does not exist.");
            callback.context[callback.method](new com.mi.rs.Response(this.cmd, resp));
        }
    }

    if (com.mi.rs.OutgoingCommand.enableTryCatch)
    {
        try
        {
            handler.call(this);
        }
        catch(e)
        {
            //alert("Exception thrown in response handler. " + e);
            this.service.on_response_error(e);
        }
    }
    else
    {
        handler.call(this);
    }
}

// ----- Internal Class: ServiceCallback -----

/*
 * @class ServiceCallback
 * @private Helper class that keeps track of commands added by the addCommand
 * method that should be added in a single callback.
 */

/**
 * @ctor
 * Creates a ServiceCallback instance.
 */
com.mi.rs.ServiceCallback = function(stateData)
{
    if( (typeof stateData !== "object") || (stateData.stateCommands === undefined) )
        throw new String("Internal Error. Failed to create CommandSequence instance. stateData not of the correct type. type: " + (typeof stateData));

    this.commands = new Array();
    this.stateData = stateData;

//    alert("ServiceCallback created! this.stateData: " + this.stateData);

    var thisProxy = this;
    this.processCommandsCallback = function(seq)
    {
        var len = thisProxy.commands.length;
        for(var i=0; i<len; i++)
        {
            var item = thisProxy.commands[i];
            seq.addCommand(item.cmd, item.callback);
        }
    }
}

com.mi.rs.ServiceCallback.prototype.commands;

com.mi.rs.ServiceCallback.prototype.stateData;

com.mi.rs.ServiceCallback.prototype.processCommandsCallback;

// ----- Internal Class: CallbackWrapper -----

/*
 * @class CallbackWrapper
 * @private Helper class that keeps track of the stateData associated with
 * a callback.
 */

/**
 * @ctor
 * Creates a CallbackWrapper instance.
 */
com.mi.rs.CallbackWrapper = function(callback, stateData)
{
    this.callback = callback;
    this.stateData = stateData;

//    alert("CallbackWrapper created!")
}

com.mi.rs.CallbackWrapper.prototype.callback;
com.mi.rs.CallbackWrapper.prototype.stateData;


// ----- Internal Class: CallbackQueue -----

/*
 * @class CallbackQueue
 * @private Implements a queue for callbacks.
 */

/**
 * @ctor
 * Creates a CallbackQueue instance.
 */
com.mi.rs.CallbackQueue = function()
{
//    alert("CallbackQueue created!")

    this.m_callbacks = new Array();
}

com.mi.rs.CallbackQueue.prototype.m_callbacks;

/**
 * Returns the index of the callback wrapper that corresponds to the
 * provided callback function.
 */
com.mi.rs.CallbackQueue.prototype.getCallbackIndex = function(callback)
{
    var len = this.m_callbacks.length;
    for(var i=0; i<len; i++)
    {
        // extract the current callback object
        var curr = this.m_callbacks[i].callback;

        // Either callback is a function in which case it should be
        // equal to the stored callback, or it is a callback object.
        if(typeof callback === "function" && (curr === callback))
            return i;
        else if( (callback.method !== null) && (callback.method !== undefined) && (callback.context !== null) && (callback.context !== undefined) && (curr.method === callback.method) && (curr.context === callback.context) )
            return i;
    }
    return -1;
}

/**
 * Returns the front callback without removing it from the queue.
 */
com.mi.rs.CallbackQueue.prototype.getFrontCallback = function()
{
    if(this.m_callbacks.length === 0)
        return null;

    return this.m_callbacks[0];
}

com.mi.rs.CallbackQueue.prototype.hasCallback = function(callbackFunc)
{
    return this.getCallbackIndex(callbackFunc) >= 0;
}

com.mi.rs.CallbackQueue.prototype.pushCallback = function(callbackFunc)
{
    this.m_callbacks.push(callbackFunc);
}

com.mi.rs.CallbackQueue.prototype.popCallback = function()
{
    if(this.m_callbacks.length === 0)
        return null;

    return this.m_callbacks.shift();
}

com.mi.rs.CallbackQueue.prototype.removeCallback = function(callbackFunc)
{
    var i = this.getCallbackIndex(callbackFunc);
    if(i<0)
        return false;

    this.m_callbacks.splice(i, 1);
    return true;
}

/**
 * Returns the callback at the given position without removing it from
 * the queue.
 */
com.mi.rs.CallbackQueue.prototype.getCallbackAt = function(i)
{
    if(this.m_callbacks.length < (i+1))
        return null;

    return this.m_callbacks[i];
}
