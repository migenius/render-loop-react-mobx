/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/

/**
 * @file RenderCommand.js
 * This file defines the com.mi.rs.RenderCommand class.
 */
 
/**
 * @class RenderCommand
 * Renders an image. 
 *  
 * <p>The RenderCommand works together with an ImageRenderTarget 
 * object to render the scene and display the rendered image. Each
 * render command will render a single frame. To implement 
 * a client side render loop, simply add new RenderCommands to the 
 * service, either continously or when something has changed, like 
 * the camera transform. Note that render commands are very expensive 
 * so it is vital to use the process commands callbacks mechanism to 
 * make sure that no redundant render commands are added to the 
 * service.</p>
 * 
 * <p>Any number of render commands can be added at a single time, so
 * if multiple ImageRenderTarget instances needs to be updated it is 
 * perfectly ok to add multiple render commands without waiting for 
 * previous commands to complete. Note however that render commands,
 * like all other commands, will be serialized by the service.</p>
 */
   
/**
 * @ctor
 * Creates an %RenderCommand object. The RenderCommand will use the 
 * "render" command to render the scene.
 * @param renderTarget com::mi::rs::ImageRenderTarget The target that 
 * will display the rendered image.
 * @param sceneName String The name of the scene to render.
 * @param renderer String The name of the renderer to use. Defaults 
 * to null in which case the renderer specified in the scene options 
 * will be used.
 * @param renderContext String The name of the render context to use. 
 * Defaults to null.
 * @param renderContextTimeout Uint32 The timeout in seconds for 
 * the specified render context. Defaults to 0.
 * @param format String The image format to use. Defaults to "jpg".
 * @param quality String The quality of the image if applicable. 
 * Defaults to "90"
 * @param canvasContent String The content to render into the canvas. Defaults to 
 * "result".
 * @param canvasPixelType String The canvas pixel type. Defaults to 
 * "Rgba".
 * @param pixelType String The pixel type of the returned image. 
 * Defaults to "Rgba".
 */
com.mi.rs.RenderCommand = function(renderTarget, sceneName, renderer, renderContext, renderContextTimeout, format, quality, canvasContent, canvasPixelType, pixelType)
{
    // FIXME: check required parameters
    if(renderTarget == null)
        throw new String("Failed to create RenderCommand. Required parameter renderTarget missing.");

    if(!(renderTarget instanceof com.mi.rs.ImageRenderTarget))
        throw new String("Failed to create RenderCommand. Required parameter renderTarget of wrong type. Required type: \"com.mi.rs.ImageRenderTarget\"");
        
    if(sceneName == null)
        throw new String("Failed to create RenderCommand. Required parameter sceneName missing.");

	this.renderTarget = renderTarget;
	this.name = "render";
	this.params = new Object();
    
    this.params["scene_name"] = sceneName;
    
    if(format !== null)
        this.params["format"] = format;
    
    if(quality !== null)
        this.params["quality"] = quality;
    
    if(renderContext !== null)
        this.params["render_context_name"] = renderContext;
        
    if(renderContextTimeout !== null)
        this.params["render_context_timeout"] = renderContextTimeout;
        
    if(renderer !== null)
        this.params["renderer"] = renderer;
        
    if(canvasContent !== null)
        this.params["canvas_content"] = canvasContent;

    if(canvasPixelType !== null)
        this.params["canvas_pixel_type"] = canvasPixelType;
        
    if(pixelType !== null)
        this.params["pixel_type"] = pixelType;
        
//    alert("created: " + this);
        
}

/**
 * @public ImageRenderTarget
 * The render target.
 */
com.mi.rs.RenderCommand.prototype.renderTarget;

/**
 * @public String
 * [read-only] The name of the RenderCommand.
 */
com.mi.rs.RenderCommand.prototype.name;

/**
 * @public Object
 * [read-only] The %object containing RenderCommand arguments as param/value pairs.
 */
com.mi.rs.RenderCommand.prototype.params;

/**
 * @public Boolean
 * [read-only] Set to true if this render command is cancelled.
 */
com.mi.rs.RenderCommand.prototype.isCancelled;

/**
 * Returns a string describing this Object.
 * @return String A String describing this Object.
 */
com.mi.rs.RenderCommand.prototype.toString = function()
{
    return "[Object RenderCommand(scene: \"" + this.params.scene_name + "\")]";
}
