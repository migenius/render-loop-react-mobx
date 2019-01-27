/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/

/**
 * @file RenderLoopExecuteCommand.js
 * This file defines the com.mi.rs.RenderLoopExecuteCommand class.
 */

com = (window.com != undefined ? window.com : {});

com.mi = (com.mi != undefined ? com.mi : {});

com.mi.rs = (com.mi.rs != undefined ? com.mi.rs : {}); 
 
/**
 * @class RenderLoopExecuteCommand
 * The render_loop_execute command is a special command that operates
 * in a similar way to the batch command. It takes a number of
 * sub-commands and these commands are executed between render calls on
 * the given render loop. This ensures there are no overlapping
 * transactions so there is no possibility of changes being lost.
 *
 * Similar to the batch command render_loop_execute is  
 * is processed as a single command and gets only a single reply
 * from the server. The sub-commands can't have individual response 
 * handlers, but the Response class has helper methods that 
 * makes it easier to process the sub-command results of a batch 
 * command. As the commands are not processed synchronously by the
 * server however responses are not immediately available. Using
 * this command will trigger a polling loop to retrieve results
 * if a response callback is registered when the command is added. 
 * If necessary this loop can be aborted by calling abortResponsePolling
 * on the command class instance.
 */
   
/**
 * @ctor
 * Creates a %RenderLoopExecuteCommand object.
 * @param renderLoopName String the name of the render loop to execute on
 * @param cancel Number Controls whether rendering should be cancelled to
 *   execute the commands sooner. Pass 0 to cancel, and if possible
 *   continues rendering without restarting progression. Pass 1 to
 *   cancel faster at the expense of always needing to restart. Any
 *   other value will not cancel rendering.
 * @param continueOnError Boolean Controls error handling when an error occurs. 
 *   If true then sub-commands will continue to be processed, if false 
 *   processing will end at the first error and any subsequent commands 
 *   will be aborted and get error resposes. Defaults to true.
 * @param pollDelay Number Results from a render loop execute need to be polled
 *   for. This value specifies the delay between each poll call in 
 *   milliseconds. Defaults to 1000.
 */
com.mi.rs.RenderLoopExecuteCommand = function(renderLoopName, cancel, continueOnError, pollDelay)
{
	this.name = "render_loop_execute";
    if (cancel !== 0 && cancel !== 1) {
        cancel = -1;
    }
    this.continueOnError = continueOnError;

    if(this.continueOnError === null || this.continueOnError === undefined)
        this.continueOnError = true;

    this.pollDelay = pollDelay || 1000;


    this.renderLoopName = renderLoopName;
	this.params = {render_loop_name:renderLoopName, cancel: cancel, continue_on_error:this.continueOnError, commands:[]};
    this.isCancelled = false;
    this.addedCommands = new Array();
    this.abortPolling = false;
}

/**
 * @public String
 * [read-only] The name of the RealityServer RenderLoopExecuteCommand.
 */
com.mi.rs.RenderLoopExecuteCommand.prototype.name;

/**
 * @public Object
 * [read-only] RenderLoopExecuteCommand parameters specified as an associative array.
 */
com.mi.rs.RenderLoopExecuteCommand.prototype.params;

/**
 * @public Boolean
 * [read-only] This property is set to true if the
 * RenderLoopExecuteCommand has been cancelled, in which case it will simply be 
 * skipped by the service.
 * <p>
 * Note that commands can't generally be calcelled and that 
 * commands most often will be processed immediately after adding
 * them in a process commands callback at which point this property
 * won't have any effect. There are however special types of 
 * commands for which this mechanism can be useful, for instance to
 * avoid an obsolete render command to be processed.
 */
com.mi.rs.RenderLoopExecuteCommand.prototype.isCancelled;

/**
 * @public Boolean
 * If true the command will continue processing
 * sub-commands even 
 * when a sub-command experience an error. If false, execution will stop
 * at the first error and any subsequent commands will get error 
 * responses.
 */
com.mi.rs.RenderLoopExecuteCommand.prototype.continueOnError;

/**
 * Returns a string describing this Object.
 * @return String A String describing this Object.
 */
com.mi.rs.RenderLoopExecuteCommand.prototype.toString = function()
{
    return "[Object RenderLoopExecuteCommand(\"" + this.name + "\")]";
}

/**
 * Adds a command to the batch. Batch sub-commands will be processed
 * in the same order they are added and their responses can be 
 * accessed from the Response object passed to a response handler 
 * of the batch command itself.
 */
com.mi.rs.RenderLoopExecuteCommand.prototype.addCommand = function(cmd)
{
    this.addedCommands.push(cmd);
    this.params.commands.push({name:cmd.name, params:cmd.params});
}

/**
 * Aborts polling for responses. Any callback associated with this command
 * will not be called.
 */
com.mi.rs.RenderLoopExecuteCommand.prototype.abortResponsePolling = function()
{
    this.abortPolling = true;
    if (this.getResultCommand) {
        this.getResultCommand.abortPolling();
    }
}

/* @private The next command id. */
com.mi.rs.RenderLoopExecuteCommand.next_command_id = 0;

/**
 * @private
 * Internal function to return a command specific callback to be
 * called when the command completes.
 * @param user_callback the user callback provided to the service
 * @return a function to be called as the response handler.
 */
com.mi.rs.RenderLoopExecuteCommand.prototype.commandCallbackFactory = function(user_callback, service)
{

    if (user_callback) {
        // Commands can be wrapped in outgoing commands twice due to how the services operate.
        // so check if we're already wrapped otherwise we'll end up in an infinite calling loop.
        if (this.user_callback === undefined) {
            // user wants results so register a callback to poll for results

            // first set an ID to retrieve results from
            this.result_id = (com.mi.rs.RenderLoopExecuteCommand.next_command_id++).toString();
            this.params.id = this.result_id;

            this.user_callback = user_callback;

            this.service = service;
        }
        return { method:'commandCallback', context:this};
    }
    return undefined;    
}

/**
 * @private
 * calls the user callback if it exsts
 */
com.mi.rs.RenderLoopExecuteCommand.prototype.callUserCallback = function(resp)
{
    if (!this.user_callback) {
        return;
    }
    if(typeof this.user_callback === "function")
        this.user_callback(resp);
    else
    {
        if(typeof this.user_callback.context[this.user_callback.method] !== "function")
            throw new String("Failed to call response handler method \"" + this.user_callback.method + "\" on context " + this.user_callback.context + ". Method does not exist.");
        this.user_callback.context[this.user_callback.method](resp);
    }
}

/**
 * @private
 * Service response callback. Here we trigger the polling loop to retrive results 
 */
com.mi.rs.RenderLoopExecuteCommand.prototype.commandCallback = function(resp)
{
    if (!this.user_callback) {
        return;
    }
    if (resp.isErrorResponse) {
        this.callUserCallback(resp);
        return;
    }
    if (!this.abortPolling) {
        // start polling for results.
        this.getResultCommand = new com.mi.rs.RenderLoopGetExecuteResultsCommand(this);
        this.getResultCommand.poll();
    }
}
