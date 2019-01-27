/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/

/**
 * @file GenericRenderCommand.js
 * This file defines the com.mi.rs.GenericRenderCommand class.
 */
 
/**
 * @class GenericRenderCommand
 * Renders an image. 
 *  
 * <p>The GenericRenderCommand is a generic implementation of commands 
 * that can handle any RealityServr commands that returns an image. Render 
 * commands take an additional parameter
 * of the type com::mi::rs::ImageRenderTarget that is used together with
 * the service to load the image from the server. The ImageRenderTarget 
 * is exposed through the renderTarget parameter and this is what 
 * distinguishes render commands from regular Command objects. </p>
 *
 * <p>Any number of render commands can be added at a single time, so
 * if multiple ImageRenderTarget instances needs to be updated it is 
 * perfectly ok to add multiple render commands without waiting for 
 * previous commands to complete. Note however that render commands,
 * like all other commands, will be serialized by the service. Also
 * make sure that redundant render commands are not added to the 
 * service since this will degrade performance significantly.</p>
 */
   
/**
 * @ctor
 * Creates an %GenericRenderCommand object.
 * 
 * @param renderTarget com::mi::rs::ImageRenderTarget The target that 
 * will display the rendered image.
 * @param commandName String The name of the command to call. The command 
 * must return binary image data. See the RealityServer command 
 * documentation for more information on which render commands are available. 
 * @param commandParams Object An associative array of named parameters that 
 * will be passed as command arguments. See the RealityServer command 
 * documentation for more information. 
 */
com.mi.rs.GenericRenderCommand = function(renderTarget, commandName, commandParams)
{
    // FIXME: check required parameters
    if(renderTarget == null)
        throw new String("Failed to create GenericRenderCommand. Required parameter renderTarget missing.");

    if(!(renderTarget instanceof com.mi.rs.ImageRenderTarget))
        throw new String("Failed to create GenericRenderCommand. Required parameter renderTarget of wrong type. Required type: \"com.mi.rs.ImageRenderTarget\"");
        
	this.renderTarget = renderTarget;
	this.name = commandName;
	this.params = commandParams;
    this.isCancelled = false;
}

/**
 * @public ImageRenderTarget
 * The render target.
 */
com.mi.rs.GenericRenderCommand.prototype.renderTarget;

/**
 * @public String
 * The name of the command.
 */
com.mi.rs.GenericRenderCommand.prototype.name;

/**
 * @public Object
 * The %object containing the command arguments as param/value pairs.
 */
com.mi.rs.GenericRenderCommand.prototype.params;

/**
 * @public Boolean
 * Set to true if this render command is cancelled.
 */
com.mi.rs.GenericRenderCommand.prototype.isCancelled;

/**
 * Returns a string describing this Object.
 * @return String A String describing this Object.
 */
com.mi.rs.GenericRenderCommand.prototype.toString = function()
{
    return "[Object GenericRenderCommand(scene: \"" + this.params.scene_name + "\")]";
}

/** 
 * Creates a "render" command with the most common options. 
 * Additional parameters can be added to the params property after 
 * the render command has been created.
 */ 
com.mi.rs.GenericRenderCommand.createRenderCommand = function(renderTarget, sceneName, renderContextName, renderer, canvasName, format, renderContextTimeout)
{
    if(renderContextName == undefined)
        renderContextName = null;

    if(canvasName == undefined)
        canvasName = null;
        
    if(renderer == undefined)
        renderer = null;
        
    if(format == undefined)
        format = "jpg";

    if(renderContextTimeout == undefined)
        renderContextTimeout = 30;
        
    return new com.mi.rs.GenericRenderCommand(renderTarget, "render", {scene_name:sceneName, renderer:renderer, format:format, render_context_name:renderContextName, render_context_timeout:renderContextTimeout, canvas_name:canvasName});
}

/** 
 * Creates a "get_last_render" command with the most common options. 
 * Additional parameters can be added to the params property after 
 * the render command has been created.
 */ 
com.mi.rs.GenericRenderCommand.createGetLastRenderCommand = function(renderTarget, sceneName, renderContextName, format)
{
    if(format == undefined)
        format = "jpg";
        
    return new com.mi.rs.GenericRenderCommand(renderTarget, "get_last_render", {scene_name:sceneName, format:format, render_context_name:renderContextName});
}

/** 
 * Creates a "get_canvas" command with the most common options. 
 * Additional parameters can be added to the params property after 
 * the render command has been created.
 */ 
com.mi.rs.GenericRenderCommand.createGetCanvasCommand = function(renderTarget, sceneName, renderContextName, canvasName, format)
{
    if(format == undefined)
        format = "jpg";

    return new com.mi.rs.GenericRenderCommand(renderTarget, "get_canvas", {scene_name:sceneName, format:format, render_context_name:renderContextName, canvas_name:canvasName});
}
