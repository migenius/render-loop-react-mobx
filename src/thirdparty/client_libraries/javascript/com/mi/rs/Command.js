/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/

/**
 * @file Command.js
 * This file defines the com.mi.rs.Command class.
 */

/**
 * @class Command
 * The %Command class that wraps the information needed to execute a 
 * command.
 */
   
/**
 * @ctor
 * Creates a %Command object.
 * @param name String The name of the NWS command.
 * @param params Object An associative array containing the command 
 * parameters.
 */
com.mi.rs.Command = function(name, params)
{
	this.name = name;
	this.params = params;
    this.isCancelled = false;
}

/**
 * @public String
 * [read-only] The name of the RealityServer command.
 */
com.mi.rs.Command.prototype.name;

/**
 * @public Object
 * [read-only] Command parameters specified as an associative array.
 */
com.mi.rs.Command.prototype.params;

/**
 * @public Boolean
 * [read-only] This property is set to true if the
 * command has been cancelled, in which case it will simply be 
 * skipped by the service.
 * <p>
 * This property is set to true by the implementing class if the
 * command has been cancelled, in which case it will simply be 
 * skipped by the service. Note that commands are normally processed
 * immediately after being added by a process commands callback at 
 * which point this property does not have any effect. Most command 
 * implementations should just return false, but there are special 
 * cases, like render commands or other commands that return 
 * binary data, where this mechanism can be of use. 
 */
com.mi.rs.Command.prototype.isCancelled;

/**
 * Returns a string describing this Object.
 * @return String A String describing this Object.
 */
com.mi.rs.Command.prototype.toString = function()
{
    return "[Object Command(\"" + this.name + "\")]";
}


