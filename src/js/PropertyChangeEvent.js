/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/

/**
 * @file PropertyChangeEvent.js
 * This file contains the PropertyChangeEvent class.
 */

/**
 * @class PropertyChangeEvent
 * The %PropertyChangeEvent is dispatched by objects that supports 
 * tracking property changes.
 */
	
/**
 * @ctor
 * Creates a %PropertyChangeEvent.
 * @param type String The type of the event. 
 * @param target The object that dispatched the event.
 */
const PropertyChangeEvent = function(type, target, newValue, oldValue, propertyName)
{
	if(typeof(type) !== "string")
        throw new String("Failed to create PropertyChangeEvent. Required parameter type was not a string.");

	if(typeof(target) !== "object")
        throw new String("Failed to create PropertyChangeEvent. Required parameter target was not an Object.");

    this.type = type;
    this.target = target;
    this.newValue = newValue;
    this.oldValue = oldValue;
    this.propertyName = propertyName;
}

/**
 * @public String
 * The type of the change event.
 */
PropertyChangeEvent.prototype.type;

/**
 * @public Object
 * The object that dispatched the event.
 */
PropertyChangeEvent.prototype.target;

/**
 * @public Object
 * The new value of the property.
 */
PropertyChangeEvent.prototype.newValue;

/**
 * @public Object
 * The old value of the property. May be null.
 */
PropertyChangeEvent.prototype.oldValue;

/**
 * @public String
 * The name of the property that changed. May be null.
 */
PropertyChangeEvent.prototype.propertyName;

/**
 * Prints a short string about this event for debugging purposes.
 */
PropertyChangeEvent.prototype.toString = function()
{
    return "[Object PropertyChangeEvent(" + this.type + ")]";
}


export default PropertyChangeEvent;