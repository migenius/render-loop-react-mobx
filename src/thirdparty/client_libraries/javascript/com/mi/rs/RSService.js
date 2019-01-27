/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/

/**
 * @file RSService.js
 * This file is the entry point of the NWS service client. Other files are
 * loaded by this file automatically. This file will define two global
 * variables if they are not already defined: <p>
 * <b>com</b> - The "com" namespace object. This is an Object instance that
 * is used to emulate the com namespace. Will be created if it doesn't
 * already exist. <br>
 * <b>rsClientLibraryPath</b> - Contains the path to the folder containing
 * the RealityServer JavaScript Client Library files. The path is relative
 * to the html page that loads this file and must be under the content
 * root folder. Additional files will be loaded by this file automatically
 * from this location.
 *
 * <p> This file will also create the name space objects <b>com.mi</b> and
 * <b>com.mi.rs</b>.<p>
 *
 * This file will define the com.mi.rs.RSService class which is the main
 * class to use for calling RealityServer web service commands. This file
 * will also define the class com.mi.rs.CommandSequence which is passed as
 * argument in the callbacks called by the service to process commands.
 */

 /**
  * NOTE! In regards to binding functions and addCallback!
  *
  * The addCallback function makes use of its own binding functionality to check
  * if a callback has already been added to the queue. If an external libraries
  * bind function is used, callbacks can end up in the queue multiple times!
  *
  * See addCallback docs for more details.
  */

//alert("RSService.js loaded!! rsClientLibraryPath: " + (window.rsClientLibraryPath == undefined ? "undefined" : window.rsClientLibraryPath));

/**
 * @namespace com The %com namespace
 */
com = (window.com != undefined ? window.com : {});

/**
 * @namespace com::mi The %mi namespace
 */
com.mi = (com.mi != undefined ? com.mi : {});

/**
 * @namespace com::mi::rs The %rs namespace.
 */
com.mi.rs = (com.mi.rs != undefined ? com.mi.rs : {});

/**
 * @namespace com::mi::util The %util namespace
 */

/**
 * @namespace com::mi::rs::types The %types namespace.
 */

/**
 * @namespace com::mi::rs::event The %event namespace.
 */

/**
 * @public String
 * The path to the folder containing the JavaScript Client Library files.
 * Defaults to "./".
 */
rsClientLibraryPath = (window.rsClientLibraryPath != undefined ? window.rsClientLibraryPath : "./");

/**
 * @private A map containing all the loaded files.
 */
com.mi.rs.loaded_files = {};

/**
 * @global void
 * Loads the given Client Library JavaScript file.
 * If the file has already been loaded before, this action is ignored.
 * @param path String The file path of the JavaScript file relative to
 *        rsClientLibraryPath
 */
com.mi.rs.loadLibraryFile = function(path)
{
    var file = rsClientLibraryPath + path;

    if(com.mi.rs.loaded_files[path] == undefined || com.mi.rs.loaded_files[path] == false)
    {
        com.mi.rs.loaded_files[path] = true;
        document.write('<script src="', file, '" type="text/javascript"><\/script>');
    }
}


// Load other files required by the com.mi.rs.Service class.
com.mi.rs.loadLibraryFile("default/json.js");
com.mi.rs.loadLibraryFile("com/mi/util/Util.js");
com.mi.rs.loadLibraryFile("com/mi/util/EventDispatcher.js");
com.mi.rs.loadLibraryFile("com/mi/util/Utf8.js");
com.mi.rs.loadLibraryFile("com/mi/rs/event/MouseEvent.js");
com.mi.rs.loadLibraryFile("com/mi/rs/event/RenderURLEvent.js");
com.mi.rs.loadLibraryFile("com/mi/rs/event/ImageEvent.js");
com.mi.rs.loadLibraryFile("com/mi/rs/Response.js");
com.mi.rs.loadLibraryFile("com/mi/rs/Command.js");
com.mi.rs.loadLibraryFile("com/mi/rs/RenderCommand.js");
com.mi.rs.loadLibraryFile("com/mi/rs/GenericRenderCommand.js");
com.mi.rs.loadLibraryFile("com/mi/rs/BatchCommand.js");
com.mi.rs.loadLibraryFile("com/mi/rs/RenderLoopExecuteCommand.js");
com.mi.rs.loadLibraryFile("com/mi/rs/RenderLoopGetExecuteResultsCommand.js");
com.mi.rs.loadLibraryFile("com/mi/rs/ImageRenderTarget.js");
com.mi.rs.loadLibraryFile("com/mi/rs/StateData.js");
com.mi.rs.loadLibraryFile("com/mi/rs/RenderLoopStateData.js");
com.mi.rs.loadLibraryFile("com/mi/rs/CommandSequence.js");
com.mi.rs.loadLibraryFile("com/mi/rs/WebSocketStreamer.js");
com.mi.rs.loadLibraryFile("com/mi/rs/types/Matrix4x4.js");
com.mi.rs.loadLibraryFile("com/mi/rs/types/Vector4.js");
com.mi.rs.loadLibraryFile("com/mi/rs/RSServiceImpl.js");
