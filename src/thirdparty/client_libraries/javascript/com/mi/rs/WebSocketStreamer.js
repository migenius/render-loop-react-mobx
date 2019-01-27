/******************************************************************************
 * Copyright 2010-2017 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/

/**
 * @file WebSocketStreamer.js
 * This file contains the com.mi.rs.WebSocketStreamer class.
 */
 
/**
 * @class WebSocketStreamer
 * The WebSocketStreamer class provides the same functionality as
 * the RSService except it operates over a Web Socket connection
 * rather than HTTP. It is essetially a drop in replaceent for
 * RSService and additionaly provides streaming of rendered
 * images from a render loop. This allows for push based image
 * updates rather than the polling system required in HTTP.
 * <p>This documentation should be read in conjuction with the
 * RSService documentations which provides an overall description
 * of the service functionality.</p> 
 */
   
/**
 * @ctor
 * Creates a WebSocketStreamer object that can stream images from a
 * render loop. Throws if web sockets are not supported by the browser.
 */
com.mi.rs.WebSocketStreamer = function(defaultStateData) {
   if (!com.mi.rs.WebSocketStreamer.supported()) {
        throw 'Websockets not supported.';
    }
    if(!defaultStateData)
        this.defaultStateData = new com.mi.rs.StateData();
    else
        this.defaultStateData = defaultStateData;

    this.connectorName = "WS";
    this.binary_commands = true;

    this.m_general_error_handler = this.on_default_general_error;
    this.m_response_error_handler = this.on_default_response_error;
    this.m_callback_error_handler = this.on_default_callback_error;
}

/**
 * @public com::mi::rs::StateData|com::mi::rs::RenderLoopStateData
 * The default state data for this WebSocketStreamer instance. If no state
 * data is specified in the addCommand and addCallback methods,
 * then this is the state data that will be used. If this is set
 * to an instance of com.mi.rs.RenderLoopStateData then all commands
 * will be executed on the render loop. It is the user's responsibility
 * to ensure that the render loop exists in this case.
 */
com.mi.rs.WebSocketStreamer.prototype.defaultStateData;

/**
 * @public String
 * Returns the name of the current connector. The connector
 * encapsulates the on-the-wire protocol used to process
 * commands. Currently one connector is available:<p>
 * "WS" - Commands are processed using WebSocket requests.<br>
 */
com.mi.rs.WebSocketStreamer.prototype.connectorName;

/**
 * @static com.mi.rs.WebSocketStreamer
 * By default calls to user callbacks are wrapped in try/catch
 * blocks and if they error the appropriate error handler is
 * called. Disabling this can be useful during development as
 * when there is an error in a callback handler, the stack is lost.
 * Set this to true to unwrap the handler calls.
 */
com.mi.rs.WebSocketStreamer.catchHandlers = true;

/**
 * @private
 * @static com.mi.rs.WebSocketStreamer
 * Command sequence id used to identify when the results of a
 * command appear in a render.
 */
com.mi.rs.WebSocketStreamer.sequence_id = 0;


/**
 * @static com.mi.rs.WebSocketStreamer
 * Returns whether web sockets are supported or not. This should be used to
 * test if web sockets are available before attempting to use them.
 */
com.mi.rs.WebSocketStreamer.supported = function() {
    return window.WebSocket ? true : false
}

/**
 * @static com.mi.rs.WebSocketStreamer
 * Returns a timestamp in seconds
 */
com.mi.rs.WebSocketStreamer.now = function() {
    return (window.performance && performance.now) ?
        function()
        {
            return performance.now() / 1000;
        }
        : 
        function()
        {
            return Date.now() / 1000;
        }
    }();
// The strange construct above is so the documentation system picks up the now
// function. Don't ask, just accept that there's an anonymous function that returns
// the actual function to use and move on.


/*
 * Protocol message IDs
*/
com.mi.rs.WebSocketStreamer.MESSAGE_ID_IMAGE            = 0x01;
com.mi.rs.WebSocketStreamer.MESSAGE_ID_IMAGE_ACK        = 0x02;
com.mi.rs.WebSocketStreamer.MESSAGE_ID_TIME_REQUEST     = 0x03;
com.mi.rs.WebSocketStreamer.MESSAGE_ID_TIME_RESPONSE    = 0x04;
com.mi.rs.WebSocketStreamer.MESSAGE_ID_COMMAND          = 0x05;
com.mi.rs.WebSocketStreamer.MESSAGE_ID_RESPONSE         = 0x06;
com.mi.rs.WebSocketStreamer.MESSAGE_ID_PREFER_STRING    = 0x07;

com.mi.rs.WebSocketStreamer._2_to_32 = Math.pow(2,32);

/**
 * Connects to a web socket server and performs initial handshake to ensure 
 * streaming functionality is available.
 * @param url String The web service URL to connect to. Typically of the form
 * ws[s]://HOST::PORT/render_loop_stream/
 * @param onReady Function Called when the web socket is ready to be used. Takes no
 * parameters.
 * @param onError Function Called if there is an error connecting to the URL. Takes one
 * optional parameter detailing the error.
 */
com.mi.rs.WebSocketStreamer.prototype.connect = function( url, onReady, onError )
{
    if (!com.mi.rs.WebSocketStreamer.supported()) {
        if (onError) onError('Websockets not supported.');
        return;
    }
    this.protocol_state = 'prestart';
    this.web_socket_littleendian = true;
    this.command_id = 0;
    this.response_handlers = {};
    this.streaming_loops = {};
    this.protocol_version = 0;

    try {
        this.web_socket = new WebSocket( url );
    } catch (e) {
        if (onError) onError(e);
        return;
    }

    this.web_socket.binaryType = 'arraybuffer';

    var scope = this;
     
    this.web_socket.onopen = function (event) {
    };
    this.web_socket.onclose = function(event) {
      /*
      var code = event.code;
      var reason = event.reason;
      var wasClean = event.wasClean;
      console.log('closed: ' + code + ' ' + reason + ' ' + wasClean);
      */
    };
    this.web_socket.onerror = function(err) {
      if (onError) onError(err);
    };

    function process_response(response) {
        if (scope.response_handlers[response.id] !== undefined) {
            var handler_scope = scope.response_handlers[response.id].scope;
            if (handler_scope === undefined) {
                handler_scope = scope;
            }
            scope.response_handlers[response.id].handler.call(handler_scope,response);
            delete scope.response_handlers[response.id];
        }
    }
    function web_socket_stream(event) {
        if (event.data instanceof ArrayBuffer) {
            // Got some binary data, most likely an image, let's see now.
            var time_sec = com.mi.rs.WebSocketStreamer.now();
            var data = new DataView(event.data);
            var message = data.getUint32(0,scope.web_socket_littleendian);
            if (message == com.mi.rs.WebSocketStreamer.MESSAGE_ID_IMAGE) {
                // yup, an image
                var img_msg = new com.mi.rs.WebSocketMessageReader(data,4,scope.web_socket_littleendian);
                var header_size = img_msg.getUint32();
                if (header_size != 16) {
                    // not good
                    if (onError) onError('Invalid image message size.');
                    return;
                }
                var image_id = img_msg.getUint32();
                var result = img_msg.getSint32();
                // render loop name
                var render_loop_name = img_msg.getString();
                if (scope.streaming_loops[render_loop_name] === undefined) {
                    // nothing to do, no handler
                    return;
                }

                if (result >= 0) {
                    // should have an image
                    var have_image = img_msg.getUint32();
                    if (have_image == 0) {
                        // got an image
                        var img_width = img_msg.getUint32();
                        var img_height = img_msg.getUint32();
                        var mime_type = img_msg.getString();
                        var img_size = img_msg.getUint32();
                        // and finally the image itself
                        var image = img_msg.getUint8Array(img_size);

                        // then any statistical data
                        var have_stats = img_msg.getUint8();
                        var stats;
                        if (have_stats) {
                            stats = img_msg.getTypedValue();
                        }
                        if (scope.streaming_loops[render_loop_name].lastRenderTime) {
                            stats['fps'] = 1 / (time_sec-scope.streaming_loops[render_loop_name].lastRenderTime);
                        }
                        scope.streaming_loops[render_loop_name].lastRenderTime = time_sec;
                        var data = {
                            result: result,
                            width: img_width,
                            height: img_height,
                            mime_type: mime_type,
                            image: image,
                            statistics : stats
                        };
                        if (stats.sequence_id > 0) {
                            while (scope.streaming_loops[render_loop_name].command_handlers.length &&
                                    scope.streaming_loops[render_loop_name].command_handlers[0].sequence_id <= stats.sequence_id) {
                                var handler = scope.streaming_loops[render_loop_name].command_handlers.shift();
                                for (var i=0;i<handler.handlers.length;i++) {
                                    com.mi.rs.WebSocketStreamer.prototype.call_callback.call(
                                        scope,
                                        handler.handlers[i],
                                        scope.on_general_error,
                                        data);
                                }
                            }
                        }
                        if (!scope.streaming_loops[render_loop_name].pause_count) {
                            if (scope.streaming_loops[render_loop_name].renderTarget) {
                                var urlCreator = window.URL || window.webkitURL;
                                
                                if (scope.streaming_loops[render_loop_name].lastUrl) {
                                    urlCreator.revokeObjectURL(scope.streaming_loops[render_loop_name].lastUrl);
                                }
                                var blob = new Blob( [ data.image ], { type: data.mime_type } );
                                scope.streaming_loops[render_loop_name].lastUrl = urlCreator.createObjectURL( blob );
                                scope.streaming_loops[render_loop_name].renderTarget.sideLoadRenderURL(scope.streaming_loops[render_loop_name].lastUrl);
                            }
                            if (scope.streaming_loops[render_loop_name].onData) {
                                scope.streaming_loops[render_loop_name].onData(data);
                            }
                        }
                    }
                } else {
                    if (!scope.streaming_loops[render_loop_name].pause_count && scope.streaming_loops[render_loop_name].onData) {
                        scope.streaming_loops[render_loop_name].onData({
                            result: result                                      
                        });
                    }
                }
                // send ack
                var buffer = new ArrayBuffer(16);
                var response = new DataView(buffer);
                response.setUint32(0,com.mi.rs.WebSocketStreamer.MESSAGE_ID_IMAGE_ACK,scope.web_socket_littleendian); // image ack
                response.setUint32(4,image_id,scope.web_socket_littleendian); // image id
                response.setFloat64(8,time_sec,scope.web_socket_littleendian);
                scope.web_socket.send(buffer);
            } else if (message == com.mi.rs.WebSocketStreamer.MESSAGE_ID_TIME_REQUEST) {
                // time request
                var buffer = new ArrayBuffer(12);
                var response = new DataView(buffer);
                response.setUint32(0,com.mi.rs.WebSocketStreamer.MESSAGE_ID_TIME_RESPONSE,scope.web_socket_littleendian); // time response
                response.setFloat64(4,time_sec,scope.web_socket_littleendian);
                scope.web_socket.send(buffer);
            } else if (message == com.mi.rs.WebSocketStreamer.MESSAGE_ID_RESPONSE) {
                var response_msg = new com.mi.rs.WebSocketMessageReader(data,4,scope.web_socket_littleendian);
                var id = response_msg.getTypedValue();
                var response = response_msg.getTypedValue();
                response.id = id;
                if (response.id !== undefined) {
                    process_response(response);
                }
            }
        } else {
            var data = JSON.parse(event.data);
            if (data.id !== undefined) {
                process_response(data);                
            }
        }
    }

    function web_socket_handshaking(event) {
        if (event.data instanceof ArrayBuffer) {
            var data = new DataView(event.data);
            // validate header
            var hs_header = String.fromCharCode(data.getUint8(0),data.getUint8(1),data.getUint8(2),data.getUint8(3),data.getUint8(4),data.getUint8(5),data.getUint8(6),data.getUint8(7));
            if (hs_header != 'RSWSRLIS') {
                // not good
                scope.web_socket.close();
            } else {
                // check that the protcol version is acceptable
                protocol_version = data.getUint32(8,scope.web_socket_littleendian);
                if (protocol_version < 1 || protocol_version > 2) {
                    // unsupported protocol, can't go on
                    if (onError) onError('Sever protocol version not supported');
                    scope.web_socket.close();                    
                } else {
                    // all good, we support this, enter started mode
                    scope.protocol_version = protocol_version;
                    scope.protocol_state = 'started';
                    scope.web_socket.onmessage = web_socket_stream;
                    if (onReady) onReady();
                }
            }
        } else {
            scope.web_socket.close();
            if (onError) onError('unexpected data during handshake');
        }
    }
    function web_socket_prestart(event) {
        // expecting a handshake message
        if (event.data instanceof ArrayBuffer) {
            var time_sec = com.mi.rs.WebSocketStreamer.now();
            if (event.data.byteLength != 40) {
                if (onError) onError('Invalid handshake header size');
                return;
            }
            var data = new DataView(event.data);
            // validate header
            var hs_header = String.fromCharCode(data.getUint8(0),data.getUint8(1),data.getUint8(2),data.getUint8(3),data.getUint8(4),data.getUint8(5),data.getUint8(6),data.getUint8(7));
            if (hs_header != 'RSWSRLIS') {
                // not good
                scope.web_socket.close();
                if (onError) onError('Invalid handshake header');
            } else {
                scope.web_socket_littleendian = data.getUint8(8) == 1 ? true : false;
                protocol_version = data.getUint32(12,scope.web_socket_littleendian);
                if (protocol_version < 1 || protocol_version > 2) {
                    // unsupported protocol, let's ask for what we know
                    protocol_version = 2;
                }
                // get server time
                var server_time = data.getFloat64(16,scope.web_socket_littleendian);
                scope.protocol_state = 'handshaking';

                var buffer = new ArrayBuffer(40);
                var response = new DataView(buffer);
                for (var i=0;i<hs_header.length;++i) {
                    response.setUint8(i,hs_header.charCodeAt(i));
                }
                response.setUint32(8,protocol_version,scope.web_socket_littleendian);
                response.setUint32(12,0,scope.web_socket_littleendian);
                response.setFloat64(16,time_sec,scope.web_socket_littleendian);
                for (var i=0;i<16;++i) {
                    response.setUint8(i+24,data.getUint8(i+24),scope.web_socket_littleendian);
                }
                scope.web_socket.onmessage = web_socket_handshaking;
                scope.web_socket.send(buffer);
            }
        } else {
            if (onError) onError('unexpected data during handshake');
        }
    }
    this.web_socket.onmessage = web_socket_prestart;
}

/**
 * @private
 * Sends a command over the websocket connection
 * @param command String The command to send
 * @param args Object The commands arguments
 * @param handler Function The function to call with the command's results
 * @param scope Object scope in which to call handler
 */
com.mi.rs.WebSocketStreamer.prototype.send_command = function(command, args, handler, scope)
{
    var command_id = handler !== undefined ? this.command_id : undefined;
    if (command_id !== undefined) {
        this.response_handlers[command_id] = { handler: handler, scope: scope };
        this.command_id++;
    }
    var payload = {
        command: command,
        arguments: args,
        id : command_id
    };

    if (this.binary_commands && this.protocol_version > 1) {
        var buffer = new com.mi.rs.WebSocketMessageWriter(this.web_socket_littleendian);
        buffer.pushUint32(com.mi.rs.WebSocketStreamer.MESSAGE_ID_COMMAND);
        buffer.pushTypedValue(payload);
        buffer = buffer.finalise();
        this.web_socket.send(buffer);
    } else {
        this.web_socket.send(JSON.stringify(payload));    
    }
}

/**
 * Begins streaming images from a render loop over the web socket connection. A single web socket connection
 * can stream from multiple render loops simultaneously however a given render loop can only be streamed once
 * over a given web socket.
 * @param renderLoop String|Object If a string then the name of the render loop to stream. If an Object
 * then must contain a 'render_loop_name' property with the name of the render loop to stream. Other supported 
 * properties are 'image_format' (String) to specify the streamed image format and 'quality' (String) to control
 * the image quality
 * @param renderTarget com.mi.rs.ImageRenderTarget Optional. If provided then images streamed from the render loop
 * will automatically be displayed on this render target.
 * @param onResponse Function If supplied then this is called with the response to the stream request. Response
 * will be true on success.
 * @param onData Function If supplied then this is called every time an image is returned and receives the image
 * and rendering statistics.
 * @param onError Function If supplied then this is called if there is an error starting the stream.
 */
com.mi.rs.WebSocketStreamer.prototype.stream = function(renderLoop, renderTarget, onResponse, onData, onError)
{
    if (!this.web_socket) {
        if (onError) onError('Web socket not connected.');
        return;
    }
    if (this.protocol_state != 'started') {
        if (onError) onError('Web socket not started.');
        return; 
    }
    if (! (renderTarget instanceof com.mi.rs.ImageRenderTarget)) {
        onError = onData;
        onData = onResponse;
        onResponse = renderTarget;
        renderTarget = undefined;
    }

    var scope = this;

    if (typeof renderLoop === 'string' || renderLoop instanceof String) {
        renderLoop = {
            render_loop_name : renderLoop
        }
    }

    function start_stream_response(response) {
        if (response.error) {
            if (onError) onError(response.error.message);
        } else {
            scope.streaming_loops[renderLoop.render_loop_name] = {
                renderTarget: renderTarget,
                onData: onData,
                command_handlers: [],
                pause_count: 0
            };
            if (onResponse) onResponse(response.result);
        }
    }
    // always use the handler since it makes no sense to start a stream without something to deal with it
    this.send_command('start_stream',renderLoop,start_stream_response);
}
    
/**
 * Sets parameters on a stream.
 * @param parameters Object The parameter to set. Must contain a 'render_loop_name' property with the name of
 * the render loop to set parameters for. Supported parameters are 'image_format' (String) to specify the
 * streamed image format and 'quality' (String) to control the image quality
 * @param onResponse Function If supplied then this is called with the response to the set parameter request.
 * @param onError Function If supplied then this is called if there is an error setting parameters.
 */
com.mi.rs.WebSocketStreamer.prototype.set_stream_parameters = function(parameters, onResponse, onError)
{
    if (!this.web_socket) {
        if (onError) onError('Web socket not connected.');
        return;
    }
    if (this.protocol_state != 'started') {
        if (onError) onError('Web socket not started.');
        return; 
    }

    function set_stream_response(response) {
        if (response.error) {
            if (onError) onError(response.error.message);
        } else {
            if (onResponse) onResponse(response.result);
        }
    }

    this.send_command('set_stream_parameters',parameters,onResponse || onError ? set_stream_response : undefined);
}
/**
 * Stops streaming from a render loop
 * @param renderLoop String The name of the render loop to stop streaming.
 * @param onResponse Function If supplied then this is called with the response to the set parameter request.
 * @param onError Function If supplied then this is called if there is an error setting parameters.
 */
com.mi.rs.WebSocketStreamer.prototype.stop_stream = function(renderLoop, onResponse, onError)
{
    if (!this.web_socket) {
        if (onError) onError('Web socket not connected.');
        return;
    }
    if (this.protocol_state != 'started') {
        if (onError) onError('Web socket not started.');
        return; 
    }

    if (typeof renderLoop === 'string' || renderLoop instanceof String) {
        renderLoop = {
            render_loop_name : renderLoop
        }
    }
    
    var scope = this;

    function stop_stream_response(response) {
        if (response.error) {
            if (onError) onError(response.error.message);
        } else {
            delete scope.streaming_loops[renderLoop.render_loop_name]; 
            if (onResponse) onResponse(response.result);
        }
    }

    this.send_command('stop_stream',renderLoop,stop_stream_response);
}

/**
 * Pauses display of images from a render loop. Note the images are still transmitted from
 * the server, they are just not dispayed. Pause calls are counted so you need to call resume_display
 * 
 * @param renderLoop String The name of the render loop to pause display for.
 * @return the pause count, IE: the number of times resume_display will need to be called to
 * start displaying images again. Returns -1 if web socket isn't started or \p renderLoop cannot
 * be found.
 */
com.mi.rs.WebSocketStreamer.prototype.pause_display = function(renderLoop)
{
    if (!this.streaming_loops[renderLoop]) {
        return -1;
    }
 
    return ++this.streaming_loops[renderLoop].pause_count;
}

/**
 * Resumes display of images from a paused render loop if the pause count has reduced to \c 0.
 * 
 * @param renderLoop String The name of the render loop to resume display for.
 * @param force Boolean If \c true then forces display to resume regardless of the pause count.
 * @return the pause count, IE: the number of times resume_display will need to be called to
 * start displaying images again. Returns -1 if web socket isn't started or \p renderLoop cannot
 * be found.
 */
com.mi.rs.WebSocketStreamer.prototype.resume_display = function(renderLoop,force)
{
    if (!this.streaming_loops[renderLoop]) {
        return -1;
    }
    
    if (this.streaming_loops[renderLoop].pause_count > 0) {
        if (force) {
            this.streaming_loops[renderLoop].pause_count = 0;
        } else {
            this.streaming_loops[renderLoop].pause_count--;
        }
    }

    return this.streaming_loops[renderLoop].pause_count;
}

/**
 * Returns the pause count for the given render loop. 
 * 
 * @param renderLoop String The name of the render loop to resume display for.
 * @return the pause count. When evaluated in a truthy way will be \c true if
 * paused and ]c false if not
 */
com.mi.rs.WebSocketStreamer.prototype.is_dispay_paused = function(renderLoop)
{
    if (!this.streaming_loops[renderLoop]) {
        return false;
    }
    
    return this.streaming_loops[renderLoop].pause_count;
}

/**
 * Returns \c true if we are currently streaming the given render loop.
 * @param renderLoop String The name of the render loop to check.
 */
com.mi.rs.WebSocketStreamer.prototype.streaming = function(renderLoop)
{
    return !!this.streaming_loops[renderLoop];
}

/**
 * Updates the camera. The \p data parameter specifies the camera data to set and is 
 * defined as follows:
 * @code
 * {
 *     camera : {
 *       name: String - the camera name to set (required if camera supplied)
 *       aperture: Number - The aperture width of the camera. (optional)
 *       aspect: Number - The aspect ratio of the camera. (optional)
 *       clip_max: Number - The yon clipping distance. (optional)
 *       clip_min: Number - The hither clipping distance. (optional)
 *       focal: Number - The focal length to set. (optional)
 *       frame_time: Number - The frame time of the camera, in seconds. (optional)
 *       offset_x: Number - The horizontal plane shift. (optional)
 *       offset_y: Number - The vertical plane shift. (optional)
 *       orthographic: Boolean - If the camera is orthographic or not. (optional)
 *       resolution_x: Number - The width of the camera. (optional)
 *       resolution_y: Number - The height of the camera. (optional)
 *       window_xh: Number - The right edge of the render sub-window in raster space. (optional)
 *       window_xl: Number - The left edge of the render sub-window in raster space. (optional)
 *       window_yh: Number - The top edge of the render sub-window in raster space. (optional)
 *       window_yl: Number - The bottom edge of the render sub-window in raster space. (optional)
 *       attributes: { Object - attributes to set on the camera. (optional)
 *           attribute_name: { Keys are the attribute names to set.
 *               type: String - The Iray typename of the attribute.
 *               value: Varies - The value of the attribute.
 *           }   
 *       }
 *     },
 *     camera_instance : {
 *       name: String - The camera isntance name to set (required if camera_instance supplied)
 *       transform: Object - The camera instance transform to set in the same format as Float64<4,4>. (optional)
 *       attributes: Object - Attributes to set on the camera instance, format is the same as on the camera. (optional)
 *     }
 * }
 * @endcode
 * @param renderLoop String The name of the render loop to change the camera on.
 * @param data Object object specifying the camera to update. Supported format is:
 * @param onResponse Function If supplied then this is called with the response to the set parameter request.
 * @param onError Function If supplied then this is called if there is an error setting parameters.
 */
com.mi.rs.WebSocketStreamer.prototype.update_camera = function(renderLoop, data, onResponse, onError)
{
    if (!this.web_socket) {
        if (onError) onError('Web socket not connected.');
        return;
    }
    if (this.protocol_state != 'started') {
        if (onError) onError('Web socket not started.');
        return; 
    }

    if (!data) {
        if (onError) onError('No data object provided.');
        return;    
    }

    if (typeof renderLoop === 'string' || renderLoop instanceof String) {
        renderLoop = {
            render_loop_name : renderLoop
        }
    }
    renderLoop.camera = data.camera;
    renderLoop.camera_instance = data.camera_instance;

    function update_camera_response(response) {
        if (response.error) {
            if (onError) onError(response.error.message);
        } else {
            if (onResponse) onResponse(response.result);
        }
    }

    this.send_command('set_camera',renderLoop,onResponse || onError ? update_camera_response : undefined);
}

/**
 * Adds a command to be processed. The service guarantees that
 * all added commands will be processed and any response handler will
 * always be called regardless of if previous commands experience
 * errors. Note however that if commands using regular com.mi.rs.StateData
 * and com.mi.rs.RenderLoopStateData are intermixed then commands will
 * not necessarily be executed in the order they were added. This is also
 * the case if commands are executed on different render loops.
 * <p>
 * Note that adding commands using this method is equivalent to
 * registering a process commands callback and adding commands
 * when the process commands callback is made. This means that any
 * callbacks already registered will be executed before the command
 * (or commands if the \p delayProcessing flag is used) added using this
 * method.
 * <p>
 * Example: Adding commands A, B, and C with delayProcessing set to
 * true for A and B, but false for C will be equivalent to register a
 * callback and add A, B, and C when the callback is made.
 *
 * @param cmd com::mi::rs:Command The command to add.
 *
 * @param options Object Optional. If specified, this provides options
 * for this command. Supported properties are:
 *   - responseHandler: A function or object giving the handler to call
 *                       with the response to this command. The object passed
 *                       to the handler will have the type com.mi.rs.Response
 *                       and can be used to check if the command succeeded and
 *                       to access any returned data. See below for supported
 *                       handler types.
 *   - renderedHandler: If this command is to be executed on a streaming 
 *                       render loop then this handler will be called when
 *                       the first image that contains the results of this
 *                       command is about to be displayed. The object passes
 *                       to the handler will be the same as what is passed
 *                       to the #stream \c onData handler. See below for supported
 *                       handler types.
 * <p>A handler is either a function or a callback object of the form
 * \c "{method:String, context:Object}".
 * In the first form the function will be called in the context of the
 * global object meaning that \c this will refer to the global
 * object. The second form will call the function with the name given
 * by the \c method member in the context of the object given by the
 * \c context member. If the callback object is specified as
 * {method:"myMethod", context:someObject} the call made will be
 * someObject["myMethod"](arg).</p>
 * <p>For backwards compatibility \c options can be passed a handler directly
 * in which case it will be called as the responseHandler.</P 
 *
 * @param stateData com.mi.rs.StateData|com.mi.rs.RenderLoopStateData Optional.
 * The state data to use. If null or omitted the default state data will be
 * used as specified in the constructor.
 *
 * @param delayProcessing Boolean A hint that tells the service not to try to send the
 * command immediately. This hint is useful when adding a sequence
 * of commands in one go. Specifying this flag to true for all
 * commands except the last one added will ensure that the Service
 * don't start processing the events immediately, but holds
 * processing until the last command in the sequence has been added.
 **/
com.mi.rs.WebSocketStreamer.prototype.addCommand = function(cmd, options, stateData, delayProcessing)
{
    if (this.protocol_version < 2) {
        throw "Command execution not supported on the server."
    }

    // normalise and process options
    options = options || {};
    if(typeof options === "function") {
        options = {
            responseHandler: options
        }
    } else {
        if (options.context && options.method) {
            options = {
                responseHandler: options
            }
        }      
    }
    if (!options.stateData) {
        options.stateData = stateData;
    }
    if (options.delayProcessing === undefined) {
        options.delayProcessing = delayProcessing;
    }

//    alert("addCommand called with cmd: " + cmd + " options: " + (options != null) + " delayProcessing: " + delayProcessing);
    var queue;
    if (this.processing_queue !== undefined) {
        // state is already setup and we just add the command to the specified queue
        queue = this.processing_queue;
        // we're already executing so make sure we don't call it again
        delayProcessing = true;
    } else {
        // If no state data is defined, use the default state data. Also make a
        // rudimentary check to see that the stateData implements the StateData
        // interface
        if(!options.stateData)
            options.stateData = this.defaultStateData
        else if( (typeof options.stateData !== "object") || (options.stateData.stateCommands === undefined && options.stateData.renderLoopName === undefined) )
            throw new String("WebSocketStreamer.addCommand called but stateData was not of the correct type or didn't implement a StateData interface. type: " + (typeof options.stateData));

        // prep the command queue
        this.prepare_command_queue(options.stateData,false);
        queue = this.command_queue[this.command_queue.length - 1];
    }

    // Add the command to the current service callback.
    queue.commands.push(cmd);

    if (options.renderedHandler) {
        queue.renderHandlers.push(options.renderedHandler);
    }

    if(cmd.renderTarget instanceof com.mi.rs.ImageRenderTarget) {
        // is a render command, ensure we have a response handler for it
        // to update the render target
        options.responseHandler = {
            method: "handle_render_target",
            context: {
                callback: options.responseHandler,
                handle_render_target: com.mi.rs.WebSocketStreamer.handle_render_target, // need to have the function on the context
                service: this
            }
        }
    }
    if (options.responseHandler) {
        var response_handlers = queue.responseHandlers
        response_handlers.length = queue.commands.length;
        response_handlers[response_handlers.length-1] = options.responseHandler;
    }
    // If processing shouldn't be delayed then execute the command queue
    if(options.delayProcessing !== true)
    {
        this.execute(this.command_queue);
        delete this.command_queue;
    }

}


/**
 * @private
 * Calls a callback passing remaining arguments to the callback
 * \param callback Function|Object the callback to call
 */
com.mi.rs.WebSocketStreamer.do_call_callback = function(callback)
{
    if (callback) {
        if(typeof callback === "function")
            callback.apply(undefined,Array.prototype.slice.call(arguments, 1));
        else
        {
            if(typeof callback.context[callback.method] !== "function")
                throw new String("Failed to call response handler method \"" + callback.method + "\" on context " + callback.context + ". Method does not exist.");
            callback.context[callback.method].apply(callback.context,Array.prototype.slice.call(arguments, 1));        
        }
    }
}

/**
 * @private
 * Calls a callback passing remaining arguments to the callback
 * \param callback Function|Object the callback to call
 * \param error_handler function to call if error is thrown
 */
com.mi.rs.WebSocketStreamer.prototype.call_callback = function(callback, error_handler)
{
    var callback_args = [callback].concat(Array.prototype.slice.call(arguments, 2));
    if (com.mi.rs.WebSocketStreamer.catchHandlers)
    {
        try
        {
            com.mi.rs.WebSocketStreamer.do_call_callback.apply(this,callback_args);
        }
        catch(e)
        {
            //alert("Exception caught in process commands callback handler: " + e);
            if (typeof error_handler === "function") {
                error_handler.call(this,e);
            }
        }
    }
    else
    {
        com.mi.rs.WebSocketStreamer.do_call_callback.apply(this,callback_args);
    }
}

/**
 * @private
 * Response handler for sending images to render targets
 */
com.mi.rs.WebSocketStreamer.handle_render_target = function(response)
{
    var render_cmd = response.command;
    if (response.isErrorResponse) {
        // call user callback with the error, needs to be called with service as this
        com.mi.rs.WebSocketStreamer.prototype.call_callback.call(this.service,this.callback,this.service.on_response_error,response);
        return;
    }
    // response should be a binary
    if (!response.result.data instanceof Uint8Array || !response.result.mime_type || response.result.mime_type.constructor !== String) {
        com.mi.rs.WebSocketStreamer.prototype.call_callback.call(this.service,this.callback,this.service.on_response_error,new com.mi.rs.Response(render_cmd,{error:{code:-2, message:"Render command did not return a binary result."}}));
        return;
    } 
    // looks good
    var urlCreator = window.URL || window.webkitURL;
                       
    var render_target = render_cmd.renderTarget;
    // we store the last URL created on the render target so we can
    // revoke it when not needed
    if (render_target.lastUrl) {
        urlCreator.revokeObjectURL(render_target.lastUrl);
    }
    var blob = new Blob( [ response.result.data ], { type: response.result.mime_type } );
    render_target.lastUrl = urlCreator.createObjectURL( blob );
    render_target.sideLoadRenderURL(render_target.lastUrl);

    com.mi.rs.WebSocketStreamer.prototype.call_callback.call(this.service,this.callback,this.service.on_response_error,new com.mi.rs.Response(render_cmd,{result:{}}));
}

/**
 * <p>Adds a callback to the end of the callback queue. The callback
 * will be made as soon as a callback or command is added with
 * \p delayProcessing set to true. Callbacks will
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
 * user input into an optimized sequence of commands. The same
 * callback function can be added again as soon as it has been
 * called or cancelled.</p>
 *
 * <p>NOTE: When the callback is made the supplied CommandSequence
 * instance must be used to add the commands, not
 * WebSocketStreamer.addCommand().</p>
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
 * @param stateData com::mi::rs::StateData|com::mi::rs::RenderLoopStateData Optional. The state data to use. If null or omitted
 * the default state data will be used as specified in the constructor.
 *
 * @param delayProcessing Boolean Optional. This flag instructs the
 * service if it should delay processing of the added callback or not.
 * Defaults to false which is recommended in most cases.
 */
com.mi.rs.WebSocketStreamer.prototype.addCallback = function(callback, stateData, delayProcessing)
{
    if (this.protocol_version < 2) {
        throw "Command execution not supported on the server."
    }
    if(callback == null || callback == undefined)
        throw new String("WebSocketStreamer.addCallback called but callback was not defined or null.");

    if(typeof callback !== "function")
    {
        // check if it is a valid callback object
        if( (typeof callback.method !== "string") || (typeof callback.context !== "object"))
            throw new String("WebSocketStreamer.addCallback called but callback was not a function or callback object of the form {method:String, context:Object}.");
    }

    if (this.findCallback(callback)) {
        return;
    }

    // create a callback object to add to the command queue.
    if(!stateData)
        stateData = this.defaultStateData
    else if( (typeof stateData !== "object") || (stateData.stateCommands === undefined && stateData.renderLoopName === undefined) )
        throw new String("WebSocketStreamer.addCallback called but stateData was not of the correct type or didn't implement a StateData interface. type: " + (typeof stateData));

    this.prepare_command_queue(stateData,true);
    var queue_index = this.command_queue.length - 1;

    this.command_queue[queue_index].callbacks.push(callback);

    if(delayProcessing !== true)
    {
        this.execute(this.command_queue);
        delete this.command_queue;
    }
}

/**
 * Cancels a registered process commands callback. This call removes
 * the callback from the queue. Useful if the callback is no longer
 * needed, or if the callback needs to be moved to the end of the
 * queue. In the latter case, first cancelling and then adding the
 * callback makse sure that it is executed after any callbacks
 * already in the callback queue.
 * <p>Note that since the web socket service does not have a 
 * busy state cancelling callbacks is only possible if callbacks
 * are added in a delayed state.</p>
 *
 * @param callback Function The previously added callback function.
 *
 * @return Boolean true if the callback was cancelled, false if it was not
 *         in the queue.
 */
com.mi.rs.WebSocketStreamer.prototype.cancelCallback = function(callback)
{
    if (this.protocol_version < 2) {
        throw "Command execution not supported on the server."
    }
    if(callback == null || callback == undefined)
        throw new String("WebSocketStreamer.addCallback called but callback was not defined or null.");

    if(typeof callback !== "function")
    {
        // check if it is a valid callback object
        if( (typeof callback.method !== "string") || (typeof callback.context !== "object"))
            throw new String("WebSocketStreamer.addCallback called but callback was not a function or callback object of the form {method:String, context:Object}.");
    }
    var location = this.findCallback(callback);
    if (location) {
        this.command_queue[location[0]].splice(location[1],1);
        return true;
    }
    return false
}

/**
 * @private find the provided callback in the command queue. Returns undefined
 * if not found or a 2 element Array. The first is the index of the command object
 * in this.command_queue and the second is the index in callbacks of the callback. 
 * \param callback Object the callback to find
 */
com.mi.rs.WebSocketStreamer.prototype.findCallback = function(callback)
{
    if (this.command_queue === undefined) {
        return;
    }
    for (var i=0;i<this.command_queue.length;i++) {
        if (this.command_queue[i].callbacks) {
            var callbacks = this.command_queue[i].callbacks;
            for (var j=0;j<callbacks.length;j++) {
                var curr = callbacks[j];
                if(typeof callback === "function" && (curr === callback))
                    return [i,j];
                else if( (callback.method !== null) && (callback.method !== undefined) && (callback.context !== null) && (callback.context !== undefined) && (curr.method === callback.method) && (curr.context === callback.context) )
                    return [i,j];
            }
        }
    }
}

/**
 * @private
 * Prepares the command queue so the final entry is suitable
 * for adding commands to
 * @param stateData com::mi::rs::StateData|com::mi::rs::RenderLoopStateData the state we are prepping for
 * @param forCallback Boolean \c true if preparing for a callback, \c false if for a command
 */
com.mi.rs.WebSocketStreamer.prototype.prepare_command_queue = function(stateData, forCallback)
{
    function make_command_object() {
        return {
            stateData:stateData,
            commands: [],
            responseHandlers: [],
            renderHandlers: [],
            callbacks: forCallback ? [] : undefined
        };
    }
    // if no comamnd queue then make one.
    if (!this.command_queue) {
        this.command_queue = [ make_command_object() ];
        return;
    }
    var index = this.command_queue.length-1;
    
    // if swapped between addCommand and addCallback, make a new entry
    var curr_queue_for_callback = !!this.command_queue[index].callbacks;
    if (curr_queue_for_callback != forCallback) {
        this.command_queue.push(make_command_object());

    } 
    
    // if new state and current state are different then make a new entry
    if(this.command_queue[index].stateData !== stateData)
    {
        var needNewState = true;
        // if both stateData are on the same render loop they might be equivalent
        if (this.command_queue[index].stateData.renderLoopName !== undefined && 
            this.command_queue[index].stateData.renderLoopName === stateData.renderLoopName) {
            var currState = this.command_queue[index].stateData;

            // here we can either just use the current state, swap it for the new state
            // or push the new state
            if (currState.cancel >= stateData.cancel) {
                // current state will cancel faster than new one so can just keep it if
                // continueOnError is the same.
                needNewState = currState.continueOnError != stateData.continueOnError
            } else {
                // new state wants to cancel faster.
                // if continueOnError is the same then just replace current state with
                // the new one.
                if (currState.continueOnError == stateData.continueOnError) {
                    this.command_queue[index].stateData = stateData;
                    needNewState = false;
                }
            } 
        }
        if (needNewState) {
            this.command_queue.push(make_command_object());
        }
    }
} 
/**
 * @private
 * Executes the provided commands on the web socket connection
 * @param commandQueue Array The command queue to execute.
 */
com.mi.rs.WebSocketStreamer.prototype.execute = function(commandQueue)
{
    if (!commandQueue) {
        return;
    }
    if (!this.web_socket) {
        this.on_general_error('Web socket not connected.');
        return;
    }
    if (this.protocol_state != 'started') {
        this.on_general_error('Web socket not started.');
        return; 
    }

    for (var i=0;i<commandQueue.length;i++) {
        var execute_args;

        if (commandQueue[i].callbacks) {
            // call callbacks to get commands
            this.service = this;            
            this.stateData = commandQueue[i].stateData;
            this.processing_queue = commandQueue[i];
            
            for (var c=0;c<commandQueue[i].callbacks.length;c++) {
                this.call_callback(commandQueue[i].callbacks[c],this.on_callback_error,this);
            }
            delete this.service;
            delete this.stateData;
            delete this.processing_queue;
        }
        if (commandQueue[i].commands.length == 0) {
            continue;
        }
        if (commandQueue[i].stateData.renderLoopName) {
            execute_args = {
                commands: commandQueue[i].commands,
                render_loop_name: commandQueue[i].stateData.renderLoopName,
                continue_on_error: commandQueue[i].stateData.continueOnError,
                cancel: commandQueue[i].stateData.cancel,
            };
            if (commandQueue[i].renderHandlers.length) {
                var stream = this.streaming_loops[execute_args.render_loop_name];
                if (stream) {
                    execute_args.sequence_id = ++com.mi.rs.WebSocketStreamer.sequence_id;
                    stream.command_handlers.push({
                        sequence_id: execute_args.sequence_id,
                        handlers: commandQueue[i].renderHandlers
                    })
                }
            }
        } else {
            execute_args = {
                commands: commandQueue[i].stateData.stateCommands ? commandQueue[i].stateData.stateCommands.concat(commandQueue[i].commands) : commandQueue[i].commands,
                url: commandQueue[i].stateData.path,
                state_arguments: commandQueue[i].stateData.parameters
            };
        }

        function execute_response(response) {
            if (response.error) {
                // possible errors
                //if (onError) onError(response.error.message);
            } else {
                // state data commands will have results as well so we need to compensate for them
                var response_offset = this.stateData.stateCommands ? this.stateData.stateCommands.length : 0;
                for (var i=response_offset;i<response.result.length;++i) {
                    var cmd_idx = i - response_offset;
                    var callback = this.responseHandlers[cmd_idx];
                    if (callback) {
                        this.service.call_callback(callback,this.service.on_response_error,new com.mi.rs.Response(this.commands[cmd_idx], response.result[i]));
                    }
                }
            }
        }

        if (commandQueue[i].responseHandlers.length) {
            commandQueue[i].service = this;
            this.send_command('execute',execute_args,execute_response,commandQueue[i]);
        } else {
            this.send_command('execute',execute_args);
        }
        
        
    }
}

/**
 * Set debug mode for commands. When set commands and responses are sent in string
 * mode (where possible) for easier debugging over the websocket connection. 
 * @param enable Boolean Set to true to enable debug mode, false (the default) to disable.
 */
com.mi.rs.WebSocketStreamer.prototype.debug_commands = function(enable)
{
    if (this.protocol_version < 2) {
        throw "Command execution not supported on the server."
    }
    if (!this.web_socket) {
        this.on_general_error('Web socket not connected.');
        return;
    }
    if (this.protocol_state != 'started') {
        this.on_general_error('Web socket not started.');
        return; 
    }

    // send debug message
    var buffer = new ArrayBuffer(8);
    var message = new DataView(buffer);

    this.binary_commands = !enable;

    message.setUint32(0,com.mi.rs.WebSocketStreamer.MESSAGE_ID_PREFER_STRING,this.web_socket_littleendian);
    message.setUint32(4,!!enable ? 1 : 0,this.web_socket_littleendian);
    this.web_socket.send(message);
}

/**
 * Sets the max transfer rate for this stream. Manually setting a maximum rate will be enforced on
 * the server side so a stream will not generate more than the given amount of bandwidth. Automatic rate
 * control will attempt to fill the available bandwidth, but not flood the connection. Note that even if
 * a manual rate is set flood control will still be enabled so setting a max rate larger than the available
 * bandwidth will not overwhelm the connection. Rate control is implemented using frame dropping rather than adjusting
 * image compression settings.
 * @param maxRate Number The maximum rate in bytes per second. Set to 0 to use automatic rate
 * control (the default) or -1 to disable rate control entirely.
 * @param onResponse Function If supplied then this is called with the response to the set max rate request.
 * @param onError Function If supplied then this is called if there is an error setting the max rate.
 */
com.mi.rs.WebSocketStreamer.prototype.set_max_rate = function(maxRate, onResponse, onError)
{
    if (!this.web_socket) {
        if (onError) onError('Web socket not connected.');
        return;
    }
    if (this.protocol_state != 'started') {
        if (onError) onError('Web socket not started.');
        return; 
    }

    if (!maxRate) {
        maxRate = 0;
    }

    var args = {
        rate: maxRate
    }

    function set_max_rate_response(response) {
        if (response.error) {
            if (onError) onError(response.error.message);
        } else {
            if (onResponse) onResponse(response.result);
        }
    }

    this.send_command('set_transfer_rate',args,onResponse || onError ? set_max_rate_response : undefined);
}


/**
 * Sets the general error handler.
 * This is called by both response and callback error handlers by default.
 *
 * If the handler is not a function the general error handler will be set to the default handler.
 *
 * @param handler Function Handler function to deal with all errors.
 */
com.mi.rs.WebSocketStreamer.prototype.set_general_error_handler = function(handler)
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
com.mi.rs.WebSocketStreamer.prototype.get_general_error_handler = function()
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
com.mi.rs.WebSocketStreamer.prototype.set_response_error_handler = function(handler)
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
com.mi.rs.WebSocketStreamer.prototype.get_response_error_handler = function()
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
com.mi.rs.WebSocketStreamer.prototype.set_callback_error_handler = function(handler)
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
com.mi.rs.WebSocketStreamer.prototype.get_callback_error_handler = function()
{
    if (typeof this.m_callback_error_handler === "function")
    {
        return this.m_callback_error_handler;
    }
    return this.on_callback_general_error;
}

/**
 * @private Default general error function.
 */
com.mi.rs.WebSocketStreamer.prototype.on_default_general_error = function(error)
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
com.mi.rs.WebSocketStreamer.prototype.on_default_response_error = function(error)
{
    this.on_general_error("Error in response: " + error);
}

/**
 * @private Default callback error function.
 */
com.mi.rs.WebSocketStreamer.prototype.on_default_callback_error = function(error)
{
    this.on_general_error("Error in callback: " + error);
}

/**
 * @private Calls the general error function handler.
 */
com.mi.rs.WebSocketStreamer.prototype.on_general_error = function(error)
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
com.mi.rs.WebSocketStreamer.prototype.on_response_error = function(error)
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
com.mi.rs.WebSocketStreamer.prototype.on_callback_error = function(error)
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

/*
function testwriter()
{
    var w = new com.mi.rs.WebSocketMessageWriter(true);
    var numbers = [
        2,
        -4,
        1034,
        -2040,
        1232434,
        -4532500,
        239548594383949,
        233,
        233,
        239548594383949,
        -2395485943834,
        -1,
        0,
        3.1415,
        -1232.432254
    ];
    var j=0;
    w.pushTypedValue(numbers[j++],'Uint8');
    w.pushTypedValue(numbers[j++],'Sint8');
    w.pushTypedValue(numbers[j++],'Uint16');
    w.pushTypedValue(numbers[j++],'Sint16');
    w.pushTypedValue(numbers[j++],'Uint32');
    w.pushTypedValue(numbers[j++],'Sint32');
    w.pushTypedValue(numbers[j++],'Uint64');
    w.pushTypedValue(numbers[j++],'Uint64');
    w.pushTypedValue(numbers[j++],'Sint64');
    w.pushTypedValue(numbers[j++],'Sint64');
    w.pushTypedValue(numbers[j++],'Sint64');
    w.pushTypedValue(numbers[j++],'Sint64');
    w.pushTypedValue(numbers[j++],'Sint64');
    w.pushTypedValue(numbers[j++],'Float32');
    w.pushTypedValue(numbers[j++],'Float64');

    j=0;
    w.pushTypedValue(numbers[j++]);
    w.pushTypedValue(numbers[j++]);
    w.pushTypedValue(numbers[j++]);
    w.pushTypedValue(numbers[j++]);
    w.pushTypedValue(numbers[j++]);
    w.pushTypedValue(numbers[j++]);
    w.pushTypedValue(numbers[j++]);
    w.pushTypedValue(numbers[j++]);
    w.pushTypedValue(numbers[j++]);
    w.pushTypedValue(numbers[j++]);
    w.pushTypedValue(numbers[j++]);
    w.pushTypedValue(numbers[j++]);
    w.pushTypedValue(numbers[j++]);
    w.pushTypedValue(numbers[j++]);
    w.pushTypedValue(numbers[j++]);
    var strings = [
        'Bender is great!',
        'Foo © bar 𝌆 baz ☃ qux 🎿 𪘀 諭  🧟'
    ]
    for (j=0;j<strings.length;j++) {
        w.pushTypedValue(strings[j]);
    }

    var obj = {
        t: true,
        f: false,
        n: null,
        numbers: numbers,
        string_obj: {
            string1: strings[0],
            string2: strings[1]
        },
        vec: {
            x: 1.0,
            y:-2.0,
            z:1.5423
        }
    }
    w.pushTypedValue(obj);

    var data = w.finalise();

    var r = new com.mi.rs.WebSocketMessageReader(new DataView(data),0,true);

    var results = [];
    for (var i=0;i<numbers.length;++i) {
        results.push(r.getTypedValue());
    }
    
    function check(a,b,i) {
        if (i !== undefined) {
            if (a === b) {
                console.log(i + ': ' + a + ' ' + b + ' true');
            } else {
                console.warn(i + ': ' + a + ' ' + b + ' false');
            }
        } else {
            if (a === b) {
                console.log(a + ' ' + b + ' true');
            } else {
                console.warn(a + ' ' + b + ' false');
            }
        }
    }

    for (var i=0;i<numbers.length;++i) {
        check(numbers[i],results[i],i);
    }
    results = [];
    // second set
    for (var i=0;i<numbers.length;++i) {
        results.push(r.getTypedValue());
    }
    
    for (var i=0;i<numbers.length;++i) {
        check(numbers[i],results[i],i);
    }

    var result_strings = [];
    for (j=0;j<strings.length;j++) {
        result_strings.push(r.getTypedValue());
    }
    
    for (var i=0;i<strings.length;++i) {
        check(strings[i],result_strings[i],i);
    }

    // the object
    var new_obj = r.getTypedValue();
    check(obj.t,new_obj.t);
    check(obj.f,new_obj.f);
    check(obj.n,new_obj.n);

    for (var i=0;i<numbers.length;++i) {
        check(numbers[i],new_obj.numbers[i],i);
    }

    check(strings[0],new_obj.string_obj.string1);
    check(strings[1],new_obj.string_obj.string2);
    check(obj.vec.x,new_obj.vec.x);
    check(obj.vec.y,new_obj.vec.y);
    check(obj.vec.z,new_obj.vec.z);
}
*/

/**
 * @private Helper for writing binary messages
 * @ctor
 */
com.mi.rs.WebSocketMessageWriter = function(little_endian) {
    // initial buffer
    this.buffers = [];
    this.push_buffer(0);

    this.totalLength = 0;
    this.le = little_endian || true;
}


/**
 * @private
 * creates a new buffer that will hold at least \p size bytes
 * @param size the number of bytes we will add
 */
com.mi.rs.WebSocketMessageWriter.prototype.push_buffer = function(size)
{
    if (this.data) {
        this.finalise_data();
    }
    size = size || 0;
    this.buffers.push(
        {
            buffer: new ArrayBuffer(size < 1024 ? 1024 : size+1024)
        }
    );
    this.data = new DataView(this.buffers[this.buffers.length-1].buffer);
    this.offset = 0;
}

/**
 * @private
 * ensures this.data has enough room to hold \p size more bytes
 * @param size the number of bytes we will add
 */
com.mi.rs.WebSocketMessageWriter.prototype.validate_data = function(size)
{
    if (this.data && this.offset + size < this.data.byteLength) {
        return;
    }
    this.push_buffer(size);
}

/**
 * @private
 * finalises this.data and undefines it.
 */
com.mi.rs.WebSocketMessageWriter.prototype.finalise_data = function()
{
    if (!this.data) {
        return;
    }
    this.buffers[this.buffers.length-1].length = this.offset;
    this.totalLength += this.offset;

    this.offset = 0;
    this.data = undefined;
}

/**
 * finalises the writer and returns an ArrayBuffer containing the data
 */
com.mi.rs.WebSocketMessageWriter.prototype.finalise = function()
{
    this.finalise_data();
    var result = new Uint8Array(this.totalLength);
    var offset = 0;
    for (var i=0;i<this.buffers.length;i++) {
        result.set(new Uint8Array(this.buffers[i].buffer,0,this.buffers[i].length),offset);
        offset += this.buffers[i].length;
    }
    this.buffers = [];
    this.totalLength = 0;
    return result.buffer;

}

/**
 * pushes a uint8
 * @param val the value to push
 */
com.mi.rs.WebSocketMessageWriter.prototype.pushUint8 = function(val)
{
    this.validate_data(1);
    this.data.setUint8(this.offset,val);
    this.offset += 1;
}

/**
 * pushes a sint8
 * @param val the value to push
 */
com.mi.rs.WebSocketMessageWriter.prototype.pushSint8 = function(val)
{
    this.validate_data(1);
    this.data.setInt8(this.offset,val);
    this.offset += 1;
}

/**
 * pushes a uint16
 * @param val the value to push
 */
com.mi.rs.WebSocketMessageWriter.prototype.pushUint16 = function(val)
{
    this.validate_data(2);
    this.data.setUint16(this.offset,val,this.le);
    this.offset += 2;
}

/**
 * pushes a sint16
 * @param val the value to push
 */
com.mi.rs.WebSocketMessageWriter.prototype.pushSint16 = function(val)
{
    this.validate_data(2);
    this.data.setInt16(this.offset,val,this.le);
    this.offset += 2;
}

/**
 * pushes a uint32
 * @param val the value to push
 */
com.mi.rs.WebSocketMessageWriter.prototype.pushUint32 = function(val)
{
    this.validate_data(4);
    this.data.setUint32(this.offset,val,this.le);
    this.offset += 4;
}

/**
 * pushes a sint32
 * @param val the value to push
 */
com.mi.rs.WebSocketMessageWriter.prototype.pushSint32 = function(val)
{
    this.validate_data(4);
    this.data.setInt32(this.offset,val,this.le);
    this.offset += 4;
}

/**
 * pushes a uint64
 * @param val the value to push
 */
com.mi.rs.WebSocketMessageWriter.prototype.pushUint64 = function(val)
{
    // split 64-bit number into two 32-bit (4-byte) parts
    var low = val | 0; // bitwise ops convert to 32 bit 
    var high = val / com.mi.rs.WebSocketStreamer._2_to_32;
    if (this.le) {
        this.pushUint32(low);
        this.pushUint32(high);
    } else {
        this.pushUint32(high);
        this.pushUint32(low);
    }
}

/**
 * pushes a sint64
 * @param val the value to push
 */
com.mi.rs.WebSocketMessageWriter.prototype.pushSint64 = function(val)
{
    // split 64-bit number into two 32-bit (4-byte) parts
    var low;
    var high;

    if (val < 0) {
        // from https://github.com/dcodeIO/long.js
        // make positive and extract bits.
        // then negate by doing not().add(1)
        low = (-val) | 0; // bitwise ops convert to 32 bit 
        high = (-val / com.mi.rs.WebSocketStreamer._2_to_32) | 0;

        // not
        low = ~low;
        high = ~high;

        // add 1
        var a48 = high >>> 16;
        var a32 = high & 0xFFFF;
        var a16 = low >>> 16;
        var a00 = low & 0xFFFF;

        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 + 1;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48;
        c48 &= 0xFFFF;

        low = (c16 << 16) | c00;
        high = (c48 << 16) | c32;
    } else {
        low = val | 0; // bitwise ops convert to 32 bit 
        high = (val / com.mi.rs.WebSocketStreamer._2_to_32) | 0;        
    }

    if (this.le) {
        this.pushUint32(low);
        this.pushUint32(high);
    } else {
        this.pushUint32(high);
        this.pushUint32(low);
    }
}

/**
 * pushes a float32
 * @param val the value to push
 */
com.mi.rs.WebSocketMessageWriter.prototype.pushFloat32 = function(val)
{
    this.validate_data(4);
    this.data.setFloat32(this.offset,val,this.le);
    this.offset += 4;
}

/**
 * pushes a float64
 * @param val the value to push
 */
com.mi.rs.WebSocketMessageWriter.prototype.pushFloat64 = function(val)
{
    this.validate_data(8);
    this.data.setFloat64(this.offset,val,this.le);
    this.offset += 8;
}

/**
 * pushes a string
 * @param val the string to push
 */
com.mi.rs.WebSocketMessageWriter.prototype.pushString = function(val)
{
    var utf8_array = com.mi.util.utf8.encode(val);
    this.validate_data(1 + 4 + utf8_array.byteLength);
    // character size
    this.data.setUint8(this.offset++,1);
    this.data.setUint32(this.offset,utf8_array.byteLength,this.le);
    this.offset += 4;

    this.pushArrayBuffer(utf8_array.buffer);
}

/**
 * Pushes an ArrayBuffer as an array of uint8
 * @param value the ArrayBuffer to push
 */
com.mi.rs.WebSocketMessageWriter.prototype.pushArrayBuffer = function(value)
{
    var arr = new Uint8Array(value);
    this.validate_data(arr.byteLength);
    var set_arr = new Uint8Array(this.data.buffer,this.offset);
    set_arr.set(arr);
    this.offset += arr.byteLength;
    /*for (var i=0;i<arr.byteLength;i++) {
        this.data.setUint8(this.offset++,arr[i]);
    }*/
}

com.mi.rs.WebSocketMessageWriter.typenames = {
    "Boolean": 0x01,
    "Uint8":   0x02,
    "Sint8":   0x03,
    "Uint16":  0x04,
    "Sint16":  0x05,
    "Uint32":  0x06,
    "Sint32":  0x07,
    "Float32": 0x08,
    "Float64": 0x09,
    "String":  0x0a,
    "Map":     0x0b,
    "Array":   0x0c,
    "Null":    0x0d,
    "True":    0x0e,
    "False":   0x0f,
    "Void":    0x10,
    "Uint64":  0x11,
    "Sint64":  0x12,
    "Binary":  0x13,
    "Canvas":  0x14
}
com.mi.rs.WebSocketMessageWriter.bytes_per_component = {
    "Sint8":      1,
    "Sint32":     4,
    "Float32":    4,
    "Float32<2>": 4,
    "Float32<3>": 4,
    "Float32<4>": 4,
    "Rgb":        1,
    "Rgba":       1,
    "Rgbe":       1,
    "Rgbea":      1,
    "Rgb_16":     2,
    "Rgba_16":    2,
    "Rgb_fp":     4,
    "Color":      4
};

com.mi.rs.WebSocketMessageWriter.components_per_pixel = {
    "Sint8":      1,
    "Sint32":     1,
    "Float32":    1,
    "Float32<2>": 2,
    "Float32<3>": 3,
    "Float32<4>": 4,
    "Rgb":        3,
    "Rgba":       4,
    "Rgbe":       4,
    "Rgbea":      5,
    "Rgb_16":     3,
    "Rgba_16":    4,
    "Rgb_fp":     3,
    "Color":      4
};

/**
 * Pushes a typed value. \p type gives the typename to push as, if 
 * undefined then a type is derived from value. We can derive types for
 * booleans, numbers, strings, arrays, null and ArrayBuffer. Any other type
 * will derive as Map. 
 * \param value the value to push
 * \type the type to use
 */
com.mi.rs.WebSocketMessageWriter.prototype.pushTypedValue = function(value, type)
{
    var type_byte = 0x0;
    // coerce undefined values to null
    if (value === undefined || typeof value === 'function') {
        type = 'Null';
    }
    if (!type) {
        // derive type
        if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                if (value < 0) {
                    // negative
                    if (value < -2147483648) {
                        type_byte = com.mi.rs.WebSocketMessageWriter.typenames['Sint64'];
                    } else {
                        type_byte = com.mi.rs.WebSocketMessageWriter.typenames['Sint32'];
                    }
                } else {
                    // positive
                    if (value > 4294967295) {
                        type_byte = com.mi.rs.WebSocketMessageWriter.typenames['Uint64'];
                    } else {
                        type_byte = com.mi.rs.WebSocketMessageWriter.typenames['Uint32'];
                    }
                }
            } else {
                type_byte = com.mi.rs.WebSocketMessageWriter.typenames['Float64'];
            }
        } else if (value === true) {
            type_byte = com.mi.rs.WebSocketMessageWriter.typenames['True'];
        } else if (value === false) {
            type_byte = com.mi.rs.WebSocketMessageWriter.typenames['False'];
        } else if (value === null) {
            type_byte = com.mi.rs.WebSocketMessageWriter.typenames['Null'];
        } else if (value.constructor === String) {
            type_byte = com.mi.rs.WebSocketMessageWriter.typenames['String'];
        } else if (Array.isArray(value)) {
            type_byte = com.mi.rs.WebSocketMessageWriter.typenames['Array'];
        } else if (value instanceof ArrayBuffer) {
            type_byte = com.mi.rs.WebSocketMessageWriter.typenames['Binary'];
            value = {
                data: value
            };
        } else if (typeof value != 'object') {
            throw 'Invalid type';
        } else {
            type_byte = com.mi.rs.WebSocketMessageWriter.typenames['Map'];
        }
    } else {
        type_byte = com.mi.rs.WebSocketMessageWriter.typenames[type];
        if (type_byte === undefined) {
            throw 'Unknown type ' + type;
        }
    }

    this.pushUint8(type_byte);
    switch (type_byte) {
        case 0x00: return; // undefined
        case 0x01: this.pushUint8(!!value); return; // boolean
        case 0x02: this.pushUint8(value); return;
        case 0x03: this.pushSint8(value); return;
        case 0x04: this.pushUint16(value); return;
        case 0x05: this.pushSint16(value); return;
        case 0x06: this.pushUint32(value); return;
        case 0x07: this.pushSint32(value); return;
        case 0x08: this.pushFloat32(value); return;
        case 0x09: this.pushFloat64(value); return;
        case 0x0a: this.pushString(value); return;
        case 0x0b: { //map/object
            var keys = Object.keys(value);
            this.pushUint32(keys.length);
            var self = this;
            keys.forEach(function(key) {
                self.pushString(key);
                self.pushTypedValue(value[key]);
            });
            return;
        };
        case 0x0c: { // array
            this.pushUint32(value.length);
            for (var i=0;i<value.length;i++) {
                this.pushTypedValue(value[i]);
            }
            return;
        };
        case 0x0d: return; // null
        case 0x0e: return; // true
        case 0x0f: return; // false;
        case 0x10: return; // void
        case 0x11: this.pushUint64(value);return;
        case 0x12: this.pushSint64(value);return;
        case 0x13: {
            if (!value.data) {
                throw "Binary type does not have a data property"
            }
            if (value.mime_type) {
                this.pushString(value.mime_type);                
            } else {
                this.pushString('');
            }
            this.pushUint64(value.data.byteLength);
            if (value.data instanceof ArrayBuffer) { 
                this.pushArrayBuffer(value.data);
            } else {
                this.pushArrayBuffer(value.data.buffer);
            }
            return;
        };
        case 0x14: {
            if (value.num_layers === undefined || value.resolution_x === undefined || value.resolution_y === undefined ||
                value.pixel_format === undefined || !Array.isArray(value.layers)) {
                throw 'Supplied canvas does not appear to be a canvas'
            }
            if (com.mi.rs.WebSocketMessageWriter.bytes_per_component[value.pixel_format] === undefined) {
                throw 'Unsupported canvas pixel format ' + value.pixel_format;
            }
            this.pushUint32(value.num_layers);
            if (!value.num_layers) {
                return;
            }
            
            this.pushUint32(value.resolution_x);
            this.pushUint32(value.resolution_y);
            this.pushString(value.pixel_format);
            this.pushUint32(com.mi.rs.WebSocketMessageWriter.bytes_per_component[value.pixel_format]);
            this.pushUint32(com.mi.rs.WebSocketMessageWriter.components_per_pixel[value.pixel_format]);
            if (value.gamma !== undefined) {
                this.pushFloat32(value.gamma);
            } else {
                this.pushFloat32(2.2);
            }
            var expected_length = value.resolution_x * value.resolution_y * com.mi.rs.WebSocketMessageWriter.bytes_per_component[value.pixel_format] * com.mi.rs.WebSocketMessageWriter.components_per_pixel[value.pixel_format];
            for (var l=0;l<value.num_layers;l++) {
                if (value.layers[i].buffer.byteLength != expected_length) {
                    throw 'Canvas layer ' + i + ' incorrect size. Is ' + value.layers[i].buffer.byteLength + 'bytes, expected ' + expected_length;
                }
                this.pushArrayBuffer(value.layers[l].buffer);
            }
            return;
        };
    }
    throw 'unsupported typed value type ' + type_byte;
}

/**
 * @private Helper for reading binary messages
 * @ctor
 */
com.mi.rs.WebSocketMessageReader = function(data,initial_offset,little_endian) {
    this.data = data;
    this.offset = initial_offset || 0;
    this.le = little_endian || true;
}

/**
 * @private
 */
com.mi.rs.WebSocketMessageReader.prototype.getUint8 = function()
{
    var r= this.data.getUint8(this.offset,this.le);
    this.offset += 1;
    return r;
}

/**
 * @private
 */
com.mi.rs.WebSocketMessageReader.prototype.getSint8 = function()
{
    var r= this.data.getInt8(this.offset,this.le);
    this.offset += 1;
    return r;
}

/**
 * @private
 */
com.mi.rs.WebSocketMessageReader.prototype.getUint16 = function() 
{
    var r= this.data.getUint16(this.offset,this.le);
    this.offset += 2;
    return r;
}

/**
 * @private
 */
com.mi.rs.WebSocketMessageReader.prototype.getSint16 = function()
{
    var r= this.data.getInt16(this.offset,this.le);
    this.offset += 2;
    return r;
}

/**
 * @private
 */
com.mi.rs.WebSocketMessageReader.prototype.getUint32 = function()
{
    var r= this.data.getUint32(this.offset,this.le);
    this.offset += 4;
    return r;
}

/**
 * @private
 */
com.mi.rs.WebSocketMessageReader.prototype.getSint32 = function()
{
    var r= this.data.getInt32(this.offset,this.le);
    this.offset += 4;
    return r;
}

/**
 * @private
 */
com.mi.rs.WebSocketMessageReader.prototype.getSint64 = function() {
    // split 64-bit number into two 32-bit (4-byte) parts
    var low;
    var high;
    if (this.le) {
        low = this.getUint32();
        high = this.getUint32();
    } else {
        high = this.getUint32();
        low = this.getUint32();
    }
    high |= 0; // a trick to get signed

    // combine the two 32-bit values
    var combined = low + com.mi.rs.WebSocketStreamer._2_to_32*high;

    if (!Number.isSafeInteger(combined))
        console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');

    return combined;
}

/**
 * @private
 */
com.mi.rs.WebSocketMessageReader.prototype.getUint64 = function() {
    // split 64-bit number into two 32-bit (4-byte) parts
    var low;
    var high;
    if (this.le) {
        low = this.getUint32();
        high = this.getUint32();
    } else {
        high = this.getUint32();
        low = this.getUint32();
    }
    // combine the two 32-bit values
    var combined = low + com.mi.rs.WebSocketStreamer._2_to_32*high;

    if (!Number.isSafeInteger(combined))
        console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');

    return combined;
}

/**
 * @private
 */
com.mi.rs.WebSocketMessageReader.prototype.getFloat32 = function()
{
    var r= this.data.getFloat32(this.offset,this.le);
    this.offset += 4;
    return r;
}

/**
 * @private
 */
com.mi.rs.WebSocketMessageReader.prototype.getFloat64 = function()
{
    var r= this.data.getFloat64(this.offset,this.le);
    this.offset += 8;
    return r;
}

/**
 * @private
 */
com.mi.rs.WebSocketMessageReader.prototype.getString = function()
{
    var char_size = this.getUint8();
    var length = this.getUint32();
    var r = '';
    if (char_size == 1) {
        // utf8
        var string_bytes = new Uint8Array(this.data.buffer,this.data.byteOffset+this.offset,length);
        r = com.mi.util.utf8.decode(string_bytes);
        this.offset += length;
    } else if (char_size == 2) {
        for (var i=0;i<length;i++) {
            r += String.fromCharCode(this.getUint16());
        }
    } else {
        throw 'unsupported character size'
    }
    return r;
}

/**
 * @private
 */
com.mi.rs.WebSocketMessageReader.prototype.getUint8Array = function(length)
{
    var r = new Uint8Array(this.data.buffer,this.offset,length);
    this.offset += length;
    return r;
}

/**
 * @private
 */
com.mi.rs.WebSocketMessageReader.prototype.getUint8ClampedArray = function(length)
{
    var r = new Uint8ClampedArray(this.data.buffer,this.offset,length);
    this.offset += length;
    return r;
}

/**
 * @private
 */
com.mi.rs.WebSocketMessageReader.prototype.getTypedValue = function()
{
    var type = this.getUint8();
    switch (type) {
        case 0x00:  return undefined;
        case 0x01: return this.getUint8() ? true : false;
        case 0x02: return this.getUint8();
        case 0x03: return this.getSint8();
        case 0x04: return this.getUint16();
        case 0x05: return this.getSint16();
        case 0x06: return this.getUint32();
        case 0x07: return this.getSint32();
        case 0x08: return this.getFloat32();
        case 0x09: return this.getFloat64();
        case 0x0a: return this.getString();
        case 0x0b: {
            var count = this.getUint32();
            var r = {};
            for (var i=0;i<count;i++) {
                var key = this.getString();
                var value = this.getTypedValue();
                r[key] = value;
            }
            return r;
        };
        case 0x0c: {
            var count = this.getUint32();
            var r = [];
            for (var i=0;i<count;i++) {
                var value = this.getTypedValue();
                r.push(value);
            }
            return r;
        };
        case 0x0d: return null;
        case 0x0e: return true;
        case 0x0f: return false;
        case 0x10: return {}; // void
        case 0x11: return this.getUint64();
        case 0x12: return this.getSint64();
        case 0x13: {
            var binary = {};
            binary.mime_type = this.getString();
            var byte_count = this.getUint64();
            binary.data = this.getUint8Array(byte_count);
            return binary;
        };
        case 0x14: {
            var canvas = {};
            canvas.num_layers = this.getUint32();
            if (canvas.num_layers === 0) {
                return canvas;
            }
            canvas.resolution_x = this.getUint32();
            canvas.resolution_y = this.getUint32();
            canvas.pixel_format = this.getString();
            canvas.bytes_per_component = this.getUint32();
            canvas.components_per_pixel = this.getUint32();
            canvas.gamma = this.getFloat32();
            var canvas_size = canvas.bytes_per_component * canvas.components_per_pixel * canvas.resolution_x * canvas.resolution_y;
            canvas.layers = [];
            for (var l=0;l<canvas.num_layers;l++) {
                canvas.layers.push(this.getUint8Array(canvas_size));
            }
            return canvas;
        };
    }
    throw 'unsupported typed value type ' + type;
}

