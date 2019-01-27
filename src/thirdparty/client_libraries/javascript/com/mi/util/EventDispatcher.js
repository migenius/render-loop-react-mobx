/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/

//alert("com/mi/util/EventDispatcher.js loaded!");

/**
 * @file EventDispatcher.js
 * This file contains the EventDispatcher class.
 */

com = (window.com != undefined ? window.com : {});

com.mi = (com.mi != undefined ? com.mi : {});
 
com.mi.util = (com.mi.util != undefined ? com.mi.util : {});

/**
 * @class EventDispatcher
 * The %EventDispatcher is used dispatch %events to registered %event 
 * listeners.
 */
	
/**
 * @ctor
 * Creates an %EventDispatcher
 */
com.mi.util.EventDispatcher = function()
{
	this.listeners = {};
}

/**
 * Adds a listener for the given event type.
 * If the listener is already registered to listen to %event 
 * <code>type</code>, it is not registered again.
 *
 * @param type String The name of the %event to listen to.
 * @param listener Object The listener will be called when 
 * the event of the given type is dispatched. The event listener
 * is either a plain function or a callback object of the form 
 * {method:String, context:Object}. In the first form the function
 * will be called directly. When using a callback object the event 
 * handler function will be called by name on the provided context 
 * object. For instance if the callback object is specified as 
 * {method:"myMethod", context:someObject} the call made will be 
 * someObject["myMethod"](event). This makes sure that the this 
 * pointer of the callback method will be set to the provided context
 * object. 
 */
com.mi.util.EventDispatcher.prototype.addEventListener = function(type, listener)
{
	if (typeof(type) !== "string")
		throw "WrongType parameter 1 needs to be a String for EventDispatcher.addEventListener";

    if(listener === null || listener === undefined)
        throw new String("EventDispatcher.addEventListener called with a null or undefined listener.");
    
    if( (typeof listener !== "function") && ( (typeof listener.method !== "string") || (typeof listener.context !== "object")))
        throw new String("EventDispatcher.addEventListener called with listener of unsupported type. Must be a function or callback object of the form {method:String, context:Object}.");
		
	if (this.listeners[type] == undefined)
		this.listeners[type] = [];
		
	var listeners = this.listeners[type];
    
    var index = this.getListenerIndex(listeners, listener);
	
    if(index < 0)
	{
		listeners.push(listener);
	}
}

/**
 * Removes the provided event listener. 
 * @param type String The type of the %event to stop listening for.
 * @param listener Object The listener function or callback object to 
 * remove. If the listener was added as a plain function then the exact
 * same function must be provided. In the case of a callback object the 
 * method name string and context object must be the same, but the  
 * callback object itself can be a different object.
 */
com.mi.util.EventDispatcher.prototype.removeEventListener = function(type, listener)
{
	if (typeof(type) !== "string")
		throw "WrongType parameter 1 needs to be a String for EventDispatcher.addEventListener";

    if(listener === null || listener === undefined)
        throw new String("EventDispatcher.addEventListener called with a null or undefined listener.");
    
    if( (typeof listener !== "function") && ( (typeof listener.method !== "string") || (typeof listener.context !== "object")))
        throw new String("EventDispatcher.addEventListener called with listener of unsupported type. Must be a function or callback object of the form {method:String, context:Object}.");
		
	if (this.listeners[type] == undefined)
		this.listeners[type] = [];
		
	var listeners = this.listeners[type];
    
    var index = this.getListenerIndex(listeners, listener);
	
    if(index >= 0)
	{
        listeners.splice(index, 1);
	}
}

/**
 * Dispatches the provided event object. Any Object can be used as an 
 * event object provided it has the following two properties defined:  
 * <p>
 * type: A string that defines the type of the dispatched event.<br> 
 * target: The object that dispatched the event.
 * <p>
 * Apart from these two properties the event can contain any data.
 *
 * @param event Object The event object that is dispatched with all 
 * the data relating to the %event.
 */
com.mi.util.EventDispatcher.prototype.dispatchEvent = function(event)
{
	if(typeof(event.type) !== "string")
        throw new String("Failed to dispatch event. Event object did not have required property \"type\" or the value was not a string.");

	if(event.target === undefined)
        throw new String("Failed to dispatch event. Event object did not have required property \"target\".");
        
	var type = event.type;
	if(this.listeners[type] == undefined)
		return;
	
	var listeners = this.listeners[type];
	var len = listeners.length;
	for(var i=0; i<len; i++)
	{
        try
        {
            var callback = listeners[i];
            if(typeof callback === "function")
                callback(event);
            else
            {
                if(typeof callback.context[callback.method] !== "function")
                    throw new String("Failed to call response handler method \"" + callback.method + "\" on context " + callback.context + ". Method does not exist.");
                callback.context[callback.method](event);
            }
        }
        catch(e)
        {
            alert("Exception thrown in event handler. " + e);
        }
	}
}

/**
 * Destroys all the internal references to listeners. 
 */
com.mi.util.EventDispatcher.prototype.destroy = function()
{
	for(var event_name in this.listeners)
	{
		// Delete each array of event listeners.
		this.listeners[event_name].splice();
		delete this.listeners[event_name];
	}
	this.listeners = null;
}

/**
 * Returns a string describing this Object.
 * @return String A String describing this Object.
 */
com.mi.util.EventDispatcher.prototype.toString = function()
{
    return "[Object EventDispatcher]";
}

/**
 * @private Gets the index of the listener in the array of listeners 
 * for a given type.
 */
com.mi.util.EventDispatcher.prototype.getListenerIndex = function(listeners, listener)
{
	var len = listeners.length;
	for(var i=0; i<len; i++)
	{
        var callback = listeners[i]
    
        // Either callback is a function in which case it should be 
        // equal to the stored callback, or it is a callback object.
        if(typeof callback === "function" && (listener === callback))
            return i;
        else if( (callback.method !== null) && (callback.method !== undefined) && (callback.context !== null) && (callback.context !== undefined) && (listener.method === callback.method) && (listener.context === callback.context) )
            return i;
	}
    
    return -1;
}
