/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/

/**
 * @file ImageRenderTarget.js
 * This file contains the com.mi.rs.ImageRenderTarget class.
 */
 
/**
 * @class ImageRenderTarget
 * The target for images returned by the render command.
 * There are two modes with which an ImageRenderTarget
 * can be used:
 *  
 * <p>1. If an image is provided in the constructor, then the 
 * ImageRenderTarget will take ownership of the onload, onabort, and 
 * onerror events of the provided image. These events will be used 
 * by the service to load render URLs automatically and must not be 
 * set by the application as long as the ImageRenderTarget instance is 
 * is in use. Note that the com.mi.rs.event.RENDER_URL_EVENT event will
 * not be dispatched in this mode. The type of the image is browser 
 * dependent but an image created as an HTML img tag will work in all
 * supported browsers.</p>
 * 
 * <p>2. If no image is provided then the ImageRenderTarget will dispatch 
 * a com.mi.rs.event.RENDER_URL_EVENT when a render URL needs to be 
 * loaded. The application is responsible for loading this URL exactly 
 * once and call one of the methods renderURLLoadError, renderURLLoadAborted,
 * or renderURLLoadComplete when the URL has finished loading. The service 
 * will halt any further command processing until one of these functions 
 * are called.</p>
 * 
 * <p>This class is an event dispatcher. This means it implements the 
 * functions addEventListener and removeEventListener functions as 
 * documented in the class com.mi.util.EventDispatcher. The following
 * events can be dispatched by this class:</p>
 * 
 * <p><code>com.mi.rs.event.RENDER_URL_EVENT</code><br>
 * <code>com.mi.rs.event.IMAGE_LOADED_EVENT</code><br>
 * <code>com.mi.rs.event.IMAGE_ABORTED_EVENT</code><br>
 * <code>com.mi.rs.event.IMAGE_ERROR_EVENT</code><br></p>
 */
   
/**
 * @ctor
 * Creates an ImageRenderTarget object that can act as a target for 
 * render commands. 
 * @param image Image Optional image object that will display the rendered 
 * image. The exact type of this object will vary between browsers, but the 
 * object created by adding an &lt;img&gt; tag will work in all supported 
 * browsers.
 * @param useHiddenBuffer Boolean If true, and an image is supplied, then
 * the image will be loaded to an in memory Image buffer and only displayed
 * once loaded.
 */
com.mi.rs.ImageRenderTarget = function(image, useHiddenBuffer)
{
//    alert("ImageRenderTarget called. com.mi.rs.event.MouseEvent.MOUSE_DOWN: " + com.mi.rs.event.MOUSE_DOWN)

    // Creste the event dispatcher
    this.eventDispatcher = new com.mi.util.EventDispatcher();
	
	if (useHiddenBuffer !== true)
	{
		useHiddenBuffer = false;
	}
	
	this.useHiddenBuffer = useHiddenBuffer;

    this.sideLoaded = false;

    // The service that requested loading of the render URL. This is set to
    // null when no request is ongoing.
    this.service = null;
    
    if(image != null)
    {
        // An image has been passed, taking ownership. This image will be
        // used for automatic render url loading. The image should no 
        // longer be accessed directly.
        this.image = image;
		this.imageTag = image;
		
		if (useHiddenBuffer)
		{
			this.image = document.createElement("img");
			this.image.style.display = "none";
		}
        // FIXME: Check that image is of correct type by checking its 
        // interface (the type varies from browser to browser and IE7 
        // has a bug related the instanceof operator generating an error 
        // when trying to check the type)
        
        var thisProxy = this;
        var img = this.image;
        img.onload = function() {thisProxy.renderURLLoadComplete()};
        img.onabort = function() {thisProxy.renderURLLoadAborted()};
        img.onerror = function() {thisProxy.renderURLLoadError()};        
        
        if(img == null)
        {
            renderCommand.do_client_error_callback("Failed to send render command. Failed to acquire the target Image object.");
            this.m_is_busy = false;
            this.process_callbacks();
            return;
        }
        
    }
    else
    {
        this.image = null;    
    }        
    
//    alert("created: " + this);
}

/** @public Image 
 * The image instance that will display the rendered image, 
 * or null if external render URL loading is used. */
com.mi.rs.ImageRenderTarget.prototype.image;

/**
 * Returns a string describing this Object.
 * @return String A String describing this Object.
 */
com.mi.rs.ImageRenderTarget.prototype.toString = function()
{
    return "[Object ImageRenderTarget(" + (this.image != null ? this.image.id : "external URL loading") + ")]";
}

/** @private com.mi.util.EventDispatcher The event dispatcher used to 
 * back up the event dispatcher functionality. */
com.mi.rs.ImageRenderTarget.prototype.eventDispatcher;

/**
 * Adds a listener for the given event type.
 * If the listener is already registered to listen to %event 
 * <code>type</code>, it is not registered again.
 *
 * The callback function will need to have the following signiature:
 * function callback(event, context).
 * 
 * @param type String The name of the %event to listen to.
 * @param listener Function The reference to the listener function.
 * @param context Object The optional user-supplied context object. Useful 
 * for instance to hold a reference to the object that registered the 
 * callback.
 */
com.mi.rs.ImageRenderTarget.prototype.addEventListener = function(type, listener, context)
{
    this.eventDispatcher.addEventListener(type, listener, context);
}

/**
 * Removes the provided event listener. 
 * @param type String The type of the %event to stop listening for.
 * @param listener Function The listener function to remove.
 */
com.mi.rs.ImageRenderTarget.prototype.removeEventListener = function(type, listener)
{
    this.eventDispatcher.removeEventListener(type, listener);
}

/** @private com.mi.util.ServiceHTTP 
 * The service that requested loading of a render URL. This is null if no 
 * load request is ongoing. Only one request to load render URLs can be 
 * active at a given time. */
com.mi.rs.ImageRenderTarget.prototype.service;

/**
 * @private 
 * Called by the service core when a render URL needs to be loaded. 
 * @param url String The render URL to load.
 * @param service ServiceHTTP The service that is issuing the load request.
 */
com.mi.rs.ImageRenderTarget.prototype.loadRenderURL = function(url, service)
{
    if(this.service != null)
    {
        alert("ImageRenderTarget: Failed to load render URL. URL loading already in progress.");
        this.renderURLLoadAborted();
        return;
    }
    
    this.service = service;
        
    // Load URL, either internally if this.image is set, or externally 
    // by dispatching a RenderURLEvent.
    if(this.image == null)
        this.eventDispatcher.dispatchEvent(new com.mi.rs.event.RenderURLEvent(com.mi.rs.event.RENDER_URL_EVENT, this, url));
    else
        this.image.src = url;
}

/** @private Boolean
 * Whether the current load is coming from a side load
*/
com.mi.rs.ImageRenderTarget.prototype.sideLoaded;

/**
 * @private 
 * Called when a render URL needs to be loaded from outside of the service. 
 * @param url String The render URL to load.
 */
com.mi.rs.ImageRenderTarget.prototype.sideLoadRenderURL = function(url)
{
    this.sideLoaded = true;
    this.loadRenderURL(url);
}

/**
 * @public 
 * Must be called when an external render URL has loaded successfully. 
 * Event processing is halted until one of the methods renderURLLoadError, 
 * renderURLLoadAborted, or renderURLLoadComplete methods have been called. 
 */
com.mi.rs.ImageRenderTarget.prototype.renderURLLoadComplete = function()
{
    if (this.sideLoaded) {
        this.sideLoaded = false;
    } else {
        if(this.service == null)
            throw new String("ImageRenderTarget.onImageLoaded called but no service is set.");

        var service = this.service;
        this.service = null;
        service.on_image_loaded();
    }
	
	if (this.useHiddenBuffer)
	{
		this.imageTag.src = this.image.src;
	}
	
    this.eventDispatcher.dispatchEvent(new com.mi.rs.event.ImageEvent(com.mi.rs.event.IMAGE_LOADED_EVENT, this));
}

/**
 * @public 
 * Must be called when an external render URL has been aborted. 
 * Event processing is halted until one of the methods renderURLLoadError, 
 * renderURLLoadAborted, or renderURLLoadComplete methods have been called. 
 */
com.mi.rs.ImageRenderTarget.prototype.renderURLLoadAborted = function()
{
    if (this.sideLoaded) {
        this.sideLoaded = false;
    } else {
        if(this.service == null)
            throw new String("ImageRenderTarget.onImageAborted called but no service is set.");
        
        var service = this.service;
        this.service = null;
        service.on_image_error();
    }
    
    this.eventDispatcher.dispatchEvent(new com.mi.rs.event.ImageEvent(com.mi.rs.event.IMAGE_ABORTED_EVENT, this));
}

/**
 * @public 
 * Must be called when an external render URL has experienced an error. 
 * Event processing is halted until one of the methods renderURLLoadError, 
 * renderURLLoadAborted, or renderURLLoadComplete methods have been called. 
 */
com.mi.rs.ImageRenderTarget.prototype.renderURLLoadError = function()
{
    if (this.sideLoaded) {
        this.sideLoaded = false;
    } else {
        if(this.service == null)
            throw new String("ImageRenderTarget.onImageError called but no service is set.");

        var service = this.service;
        this.service = null;
        service.on_image_error();
    }
        
    this.eventDispatcher.dispatchEvent(new com.mi.rs.event.ImageEvent(com.mi.rs.event.IMAGE_ERROR_EVENT, this));
}
