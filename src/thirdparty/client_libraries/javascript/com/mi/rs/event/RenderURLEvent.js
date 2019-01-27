/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/

//alert("com/mi/rs/event/RenderURLEvent.js loaded!");

/**
 * @file RenderURLEvent.js
 * This file contains the RenderURLEvent class.
 */

com = (window.com != undefined ? window.com : {});

com.mi = (com.mi != undefined ? com.mi : {});
 
com.mi.rs = (com.mi.rs != undefined ? com.mi.rs : {});

com.mi.rs.event = (com.mi.rs.event != undefined ? com.mi.rs.event : {});

/**
 * @class RenderURLEvent
 * The %RenderURLEvent is dispatched by objects that respond to mouse events.
 */
	
/**
 * @ctor
 * Creates a %RenderURLEvent.
 * @param type String The type of the event. 
 * @param target Object The object that dispatched the event.
 * @param url String
 */
com.mi.rs.event.RenderURLEvent = function(type, target, url)
{
	if(typeof(type) !== "string")
        throw new String("Failed to create RenderURLEvent. Required parameter type was not a string.");

	if(typeof(target) !== "object")
        throw new String("Failed to create RenderURLEvent. Required parameter target was not an Object.");

    this.type = type;
    this.target = target;
    this.renderURL = url;
}

/**
 * @global String
 * The type of the RenderURLEvent dispatched when a render URL needs to 
 * be loaded.
 */
com.mi.rs.event.RENDER_URL_EVENT = "render_url_event";

/**
 * @public String
 * The type of the event.
 */
com.mi.rs.event.RenderURLEvent.prototype.type;

/**
 * @public Object
 * The object that dispatched the event.
 */
com.mi.rs.event.RenderURLEvent.prototype.target;

/**
 * @public String
 * The render url to load.
 */
com.mi.rs.event.RenderURLEvent.prototype.renderURL;

/**
 * Prints a short string about this event for debugging purposes.
 */
com.mi.rs.event.RenderURLEvent.prototype.toString = function()
{
    return "[Object RenderURLEvent]";
}

