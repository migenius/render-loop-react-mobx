/******************************************************************************
 * Copyright 2010-2018 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/

/**
 * @file CommandSequence.js
 * This file defines the com.mi.rs.CommandSequence class.
 */

com = (window.com != undefined ? window.com : {});

com.mi = (com.mi != undefined ? com.mi : {});

com.mi.rs = (com.mi.rs != undefined ? com.mi.rs : {});
 
 /**
 * @class CommandSequence
 * The %CommandSequence class accepts a sequence of commands to be 
 * processed by the service. This is the type of the object passed 
 * in process command callbacks and it should typically not be 
 * instantiated directly.
 */
   
/**
 * @ctor
 * Creates an %CommandSequence object.
 * @param service com.mi.rs.RSService The service instance that created 
 * this object.
 * @param stateData com.mi.rs.StateData The stateData to use for commands added to this 
 * command sequence.
 */
com.mi.rs.CommandSequence = function(service, stateData)
{
    if( (typeof stateData !== "object") || (stateData.stateCommands === undefined) )
        throw new String("Internal Error. Failed to create CommandSequence instance. stateData not of the correct type. type: " + (typeof stateData));

    this.service = service;
    this.stateData = stateData;
    this.commands = new Array();
    this.contains_response_handlers = false;
    this.contains_render_commands = false;
}

/** @public com::mi::rs::RSService 
    The service that created this CommandSequence. */
com.mi.rs.CommandSequence.prototype.service;

/** @public com::mi::rs::StateData 
 * The state data used for commands added to this 
 * command sequence. */
com.mi.rs.CommandSequence.prototype.stateData;

/** @private Array The array containing OutgoinCommand objects.*/
com.mi.rs.CommandSequence.prototype.commands;

/** @private Boolean True if the sequence contains one or more render commands.*/
com.mi.rs.CommandSequence.prototype.contains_render_commands;

/** @private Boolean True if the sequence contains one or more commands 
 * with response handlers.*/
com.mi.rs.CommandSequence.prototype.contains_response_handlers;

/**
 * Returns a string describing this Object.
 * @return String A String describing this Object.
 */
com.mi.rs.CommandSequence.prototype.toString = function()
{
    return "[Object CommandSequence(\"" + this.commands.length + "\")]";
}

/**
 * @private Removes all the cancelled commands from the command sequence.
 */
com.mi.rs.CommandSequence.prototype.remove_cancelled_commands = function()
{
    var s = new Array();
    var len = this.commands.length;
    for(var i=0; i<len; i++)
    {
        var item = this.commands[i];
        if(item.isCancelled !== true)
            s.push(item);
    }
    
    this.commands = s;
}

/**
 * @private Copies the contents from the argument into this sequence. 
 * Note that anything in this sequence will be overwritten.
 * @param seq com.mi.rs.CommandSequence The command sequence to copy data 
 * from.
 */
com.mi.rs.CommandSequence.prototype.copy_from = function(seq)
{
    this.service = seq.service;
    this.commands = seq.commands;
    this.contains_response_handlers = seq.contains_response_handlers;
    this.contains_render_commands = seq.contains_render_commands;
    this.stateData = seq.stateData;
}

/**
 * @public
 * Adds a command to this command sequence.
 *
 * @param cmd com.mi.rs.Command The command to add.
 * @param responseHandler Object|Function Optional. If specified, this is 
 * a callback that will be called when the command has been 
 * processed. The response handler is either a function or 
 * a callback object of the form {method:String, context:Object}.
 * In the first form the function will be called in the context of the 
 * global object meaning that the this pointer will refer to the global
 * object. The second form will call the function with the name given 
 * by the "method" member in the context of the object given by the 
 * "context" member. If the callback object is specified as 
 * {method:"myMethod", context:someObject} the call made will be 
 * someObject["myMethod"](response). The object passed in the callback 
 * have the type com.mi.rs.Response and can be used to check if the 
 * command succeeded and to access any returned data.
 */
com.mi.rs.CommandSequence.prototype.addCommand = function(cmd, responseHandler)
{
//    alert("CommandSequence.addCommand() called! cmd: " + cmd + " responsehandler: " + (responseHandler != null) + " cmd.renderTarget: " + (cmd.renderTarget != null));
    this.commands.push(new com.mi.rs.OutgoingCommand(cmd, responseHandler, this.service))
  
//    alert("cmd.renderTarget: " + cmd.renderTarget);
  
    if(this.service.is_render_command(cmd))
        this.contains_render_commands = true;

//    alert("this.contains_render_commands: " + this.contains_render_commands);
        
    if(responseHandler !== null)    
        this.contains_response_handlers = true;
}

/**
 * @private Internal helper method. Returns a sub sequence as a 
 * CommandSequence object that is safe to send in a single HTTP request.
 * @return ICommandSequence A sub command sequence that is safe to send.
 */
com.mi.rs.CommandSequence.prototype.get_safe_subsequence = function()
{
    var safe_seq = new com.mi.rs.CommandSequence(this.service, this.stateData);
    
    var len = this.commands.length;

    if(len === 0)
        return safe_seq;
    
    // Keeps track of if any commands using callbacks has been added to 
    // the safe_seq.
    var has_callbacks = false;
    
    // Keeps track of if a render command has been added to safe_seq.
    var has_render_command = false;
    
    // Keeps track of roughly how long the command queue will be.
    // Adds 36 for the extra ?json_rpc_request=%5B%5D&rid=1234567 the surrounds the request.
    var command_length = this.service.baseURL.length + 36;
    
    // Go through commands an decide which are safe in a single request
    for(var i=0; i<len; i++)
    {
        var cmd /* OutgoingCommand */ = this.commands[i];
        var cmd_length = 1;
        var jobj = cmd.json_object();
        try
        {
            var str = escape(JSON.stringify(jobj));
            // + 3 for the escaped comma separating each array element.
            cmd_length = str.length + 3;
        }
        catch(e)
        {
            
        }

//        alert("i: " + i + " cmd: " + cmd + " has_callbacks: " + has_callbacks + " has_render_command: " + has_render_command);
        
        if(this.service.is_render_command(cmd.cmd))
        {
            // Two cases: 
            if (has_callbacks === true || command_length + cmd_length > 2000)
            {
                // Case 1: There are callbacks, so not safe to include 
                // the render command. 
//                alert("detected render command with callbacks already added. Not including the render command.");
                break;
            }
            
            // Case 2: There are no callbacks, so we can add the render 
            // command to the safe sequence and then break.
//            alert("detected render command with no callbacks already added. Including the render command.");
            has_render_command = true;
            if(cmd.callback != null)
                has_callbacks = true;
            
            // We must increase i otherwise the render command will not be 
            // included.
            i++;
            break;
        }
        
        command_length += cmd_length;
        
        if(cmd.callback != null)
            has_callbacks = true;
    }
    
    // i now equals the number of commands that are safe to send. Splice the 
    // array into a safe part (return) and a non-safe part (keep).
    var safe_cmds /*Array*/ =  this.commands.splice(0,i)
    
    safe_seq.commands = safe_cmds;
    safe_seq.contains_render_commands = has_render_command;
    safe_seq.contains_response_handlers = has_callbacks;
    
//    alert("get_safe_subsequence: spliced " + i + " safe commands and left " + this.commands.length + " commands.");
 
    return safe_seq;
}