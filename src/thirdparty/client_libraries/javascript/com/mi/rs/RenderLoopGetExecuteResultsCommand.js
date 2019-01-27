/******************************************************************************
 * Copyright 2010-2018 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/

/**
 * @private
 * @file RenderLoopGetExecuteResultsCommand.js
 * This file defines the com.mi.rs.RenderLoopGetExecuteResultsCommand class.
 */

com = (window.com != undefined ? window.com : {});

com.mi = (com.mi != undefined ? com.mi : {});

com.mi.rs = (com.mi.rs != undefined ? com.mi.rs : {}); 
 
/**
 * @private
 * @class RenderLoopGetExecuteResultsCommand
 * A batch command is a special
 * command that can have any number of sub-commands. The batch command 
 * is processed as a single command and gets only a single reply
 * from the server. The sub-commands can't have individual response 
 * handlers, but the Response class has helper methods that 
 * makes it easier to process the sub-command results of a batch 
 * command.
 * 
 * Batch commands can be nested, meaning that a batch command can
 * have sub-commands that are in turn batch commands and so on. 
 * Batch commands can not contain commands that return binary data 
 * such as the "render" command.
 */
   
/**
 * @ctor
 * Creates a %RenderLoopGetExecuteResultsCommand object.
 * @param execute_command the original execute command
 */
com.mi.rs.RenderLoopGetExecuteResultsCommand = function(execute_command)
{
	this.name = "render_loop_get_execute_results";
	this.execute_command = execute_command;
	this.params = {render_loop_name: execute_command.renderLoopName, id:execute_command.result_id};
	this.commands = execute_command.addedCommands;
    this.isCancelled = false;

    // dummy values to make us look like a batch command
    this.addCommand = true;
    this.continueOnError = true;
}

/**
 * @public String
 * [read-only] The name of the RealityServer RenderLoopGetExecuteResultsCommand.
 */
com.mi.rs.RenderLoopGetExecuteResultsCommand.prototype.name;

/**
 * @public Object
 * [read-only] RenderLoopGetExecuteResultsCommand parameters specified as an associative array.
 */
com.mi.rs.RenderLoopGetExecuteResultsCommand.prototype.params;

/**
 * @public Boolean
 * [read-only] This property is set to true if the
 * RenderLoopGetExecuteResultsCommand has been cancelled, in which case it will simply be 
 * skipped by the service.
 * <p>
 * Note that commands can't generally be calcelled and that 
 * commands most often will be processed immediately after adding
 * them in a process commands callback at which point this property
 * won't have any effect. There are however special types of 
 * commands for which this mechanism can be useful, for instance to
 * avoid an obsolete render command to be processed.
 */
com.mi.rs.RenderLoopGetExecuteResultsCommand.prototype.isCancelled;

/**
 * @public Boolean
 * [read-only] Dummy property to make use look like a batch command
 */
com.mi.rs.RenderLoopGetExecuteResultsCommand.prototype.addCommand;

/**
 * @public Boolean
 * [read-only] Dummy property to make use look like a batch command
 */
com.mi.rs.RenderLoopGetExecuteResultsCommand.prototype.continueOnError;

/**
 * @public Array
 * [read-only] Contains the commands originally requested
 */
com.mi.rs.RenderLoopGetExecuteResultsCommand.prototype.commands;


/**
 * @private
 * polls the server for results
 */
com.mi.rs.RenderLoopGetExecuteResultsCommand.prototype.poll = function()
{
	this.execute_command.service.addCallback({method:'pollResults',context:this});
}

/**
 * @private
 * Poll the server for responses to this command
 */
com.mi.rs.RenderLoopGetExecuteResultsCommand.prototype.pollResults = function(seq)
{
	seq.addCommand(this,{method:'pollResultsCallback',context:this});
}

/**
 * @private
 * Process poll results
 */
com.mi.rs.RenderLoopGetExecuteResultsCommand.prototype.pollResultsCallback = function(resp)
{
	if (this.execute_command.abortPolling) {
		return;
	}
	if (resp.result) {
        this.execute_command.callUserCallback(resp);
    } else {
        // command not completed executing yet
        setTimeout(com.mi.rs.RenderLoopGetExecuteResultsCommand.prototype.poll.bind(this), this.execute_command.pollDelay); // try again
    }
}

/**
 * Returns a string describing this Object.
 * @return String A String describing this Object.
 */
com.mi.rs.RenderLoopGetExecuteResultsCommand.prototype.toString = function()
{
    return "[Object RenderLoopGetExecuteResultsCommand(\"" + this.name + "\")]";
}