/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/

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
export default class PropertyChangeEvent {
    constructor(type, target, newValue, oldValue, propertyName)
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
}