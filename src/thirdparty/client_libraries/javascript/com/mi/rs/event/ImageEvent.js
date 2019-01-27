/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/

//alert("com/mi/rs/event/ImageEvent.js loaded!");

/**
 * @file ImageEvent.js
 * This file contains the ImageEvent class.
 */

com = (window.com != undefined ? window.com : {});

com.mi = (com.mi != undefined ? com.mi : {});
 
com.mi.rs = (com.mi.rs != undefined ? com.mi.rs : {});

com.mi.rs.event = (com.mi.rs.event != undefined ? com.mi.rs.event : {});

/**
 * @class ImageEvent
 * The %ImageEvent is dispatched by the ImageRenderTarget when the an image
 * has been loaded.
 */
	
/**
 * @ctor
 * Creates a %ImageEvent.
 * @param type String The type of the event. 
 * @param target The object that dispatched the event.
 */
com.mi.rs.event.ImageEvent = function(type, target)
{
	if(typeof(type) !== "string")
        throw new String("Failed to create ImageEvent. Required parameter type was not a string.");

	if(typeof(target) !== "object")
        throw new String("Failed to create ImageEvent. Required parameter target was not an Object.");

    this.type = type;
    this.target = target;
}

/**
 * @public String
 * The type of the event.
 */
com.mi.rs.event.ImageEvent.prototype.type;

/**
 * @global String
 * The type of the ImageEvent corresponding to onload.
 */
com.mi.rs.event.IMAGE_LOADED_EVENT = "image_loaded";

/**
 * @global String
 * The type of the ImageEvent corresponding to onabort.
 */
com.mi.rs.event.IMAGE_ABORTED_EVENT = "image_aborted";

/**
 * @global String
 * The type of the ImageEvent corresponding to onload.
 */
com.mi.rs.event.IMAGE_ERROR_EVENT = "image_error";

/**
 * @public Object
 * The object that dispatched the event.
 */
com.mi.rs.event.ImageEvent.prototype.target;

/**
 * Prints a short string about this event for debugging purposes.
 */
com.mi.rs.event.ImageEvent.prototype.toString = function()
{
    return "[Object ImageEvent(" + this.type + ")]";
}

