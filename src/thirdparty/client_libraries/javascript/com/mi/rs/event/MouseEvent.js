/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/

//alert("com/mi/rs/event/MouseEvent.js loaded!");

/**
 * @file MouseEvent.js
 * This file contains the MouseEvent class.
 */

com = (window.com != undefined ? window.com : {});

com.mi = (com.mi != undefined ? com.mi : {});
 
com.mi.rs = (com.mi.rs != undefined ? com.mi.rs : {});

com.mi.rs.event = (com.mi.rs.event != undefined ? com.mi.rs.event : {});

/**
 * @class MouseEvent
 * The %MouseEvent is dispatched by objects that respond to mouse events.
 */
	
/**
 * @ctor
 * Creates a %MouseEvent.
 * @param type String The type of the event. 
 * @param target Object The object that dispatched the event.
 * @param screenX Number
 * @param screenY Number
 * @param pageX Number
 * @param pageY Number
 */
com.mi.rs.event.MouseEvent = function(type, target, screenX, screenY, pageX, pageY)
{
	if(typeof(type) !== "string")
        throw new String("Failed to create MouseEvent. Required parameter type was not a string.");

	if(typeof(target) !== "object")
        throw new String("Failed to create MouseEvent. Required parameter target was not an Object.");

    this.type = type;
    this.target = target;
    this.screenX = screenX;
    this.screenY = screenY;
    this.pageX = pageX;
    this.pageY = pageY;
}

/**
 * @public String
 * The type of the mouse event.
 */
com.mi.rs.event.MouseEvent.prototype.type;

/**
 * @global String
 * The type of the MouseEvent issued on mouse down.
 */
com.mi.rs.event.MOUSE_DOWN = "mouse_down";

/**
 * @global String
 * The type of the mouse event issued on mouse up.
 */
com.mi.rs.event.MOUSE_UP = "mouse_up";

/**
 * @global String
 * The type of the mouse event issued on mouse move.
 */
com.mi.rs.event.MOUSE_MOVE = "mouse_move";

/**
 * @public Object
 * The object that dispatched the event.
 */
com.mi.rs.event.MouseEvent.prototype.target;

/**
 * @public Number
 * The x coordinate relative to the upper left corner of the screen.
 */
com.mi.rs.event.MouseEvent.prototype.screenX;

/**
 * @public Number
 * The y coordinate relative to the upper left corner of the screen.
 */
com.mi.rs.event.MouseEvent.prototype.screenY;

/**
 * @public Number
 * The x coordinate relative to the upper left corner of the page.
 */
com.mi.rs.event.MouseEvent.prototype.pageX;

/**
 * @public Number
 * The y coordinate relative to the upper left corner of the screen.
 */
com.mi.rs.event.MouseEvent.prototype.pageY;

/**
 * Prints a short string about this event for debugging purposes.
 */
com.mi.rs.event.MouseEvent.prototype.toString = function()
{
    return "[Object MouseEvent(" + this.type + ")]";
}

/**
 * @static com::mi::rs::event::MouseEvent
 * Helper method that convert JavaScript mouse events into 
 * com.mi.rs.event.MouseEvent.
 * @param e Object
 * @param type Object
 * @param target Object
 * @return MouseEvent
 */
com.mi.rs.event.MouseEvent.convertMouseEvent = function(e, type, target)
{
    if (!e) var e = window.event;
    
    var pageX = 0;
    var pageY = 0;
    var screenX = 0;
    var screenY = 0;

    if((e.touches != undefined) && (e.touches[0] != undefined))
    {
        // Handle Android and iPhone touch events (first touch only)
        pageX = e.touches[0].pageX;
        pageY = e.touches[0].pageY;
        screenX = e.touches[0].screenX;
        screenY = e.touches[0].screenY;
    }
    else if(e.pageX != undefined)
    {
        pageX = e.pageX;
        pageY = e.pageY;
    }
    else if(e.clientX != undefined)
    {
        pageX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    return new com.mi.rs.event.MouseEvent(type, target, e.screenX, e.screenY, pageX, pageY)
}

