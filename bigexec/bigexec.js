/**
 * Copyright 2013, 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Original and good work by IBM
 * "Big Nodes" mods by Jacques W
 *
 * /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
 *
 *  Big Nodes principles:
 *
 *  #1 can handle big data
 *  #2 send start/end messages
 *  #3 tell what they are doing
 *
 *  Any issues? https://github.com/Jacques44
 *
 * /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
 *
 **/

module.exports = function(RED) {

    "use strict";

    var biglib = require('node-red-biglib');
    var sq = require('shell-quote');

    var argument_to_array = function(arg) {

      if (Array.isArray(arg)) return arg;
      if (typeof arg == 'object') {
        var ret = [];
        Object.keys(arg).forEach(function(k) {
          ret.push(k);
          ret.push(typeof arg[k] == 'object' ? JSON.stringify(arg[k]) : arg[k].toString());
        })
        return ret;
      }
      return sq.parse((arg||"").toString());
    }

    // Definition of which options are known for spawning a command (ie node configutation to BigExec.spawn function)
    var spawn_options = {
      "command": "",                                                  // Command to execute
      "commandArgs": { value: "", validation: argument_to_array },    // Arguments from the configuration box
      "commandArgs2": { value: "", validation: argument_to_array },   // Payload as additional arguments if required
      "minWarning": 1,                                                // The min return code the node will consider it is a warning
      "minError": 8,                                                  // The min return code the node will consider it is as an error
      "cwd": "",                                                      // The working directory
      "env": [],                // not implemented yet
      "shell": false,                                                 // Use a shell
      "noStdin": false                                                // Command does require an input (used to avoid EPIPE error)
    }    

    function BigExec(config) {

      RED.nodes.createNode(this, config);

      // Arguments from configuration box are broken into a suitable array
      //config.commandArgs = argument_to_array(config.commandArgs);

      var spawn = function(my_config) {

        var spawn_config = {
          cwd: my_config.cwd,
          env: my_config.env,
          shell: my_config.shell
        }

        // This dummy writable is used when the command does not need any data on its stdin
        // If any data is coming, this stream drops it and no "EPIPE error" is thrown
        var dummy;
        if (my_config.noStdin) {
          // Build a dummy stream that discards input message
          dummy = new require('stream').Writable();
          dummy._write = function(data, encoding, done) { done() }
        }

        console.log("Command line: " + my_config.command);
        console.log("Arguments: ", (my_config.commandArgs.concat(my_config.commandArgs2||[])).join(', '))
        console.log(spawn_config);

        // Here it is, the job is starting now
        var child = new require('child_process').spawn(my_config.command, my_config.commandArgs.concat(my_config.commandArgs2||[]), spawn_config);

        var ret = require('event-stream').duplex(my_config.noStdin ? dummy : child.stdin, child.stdout);
        ret.others = [ child.stderr ]; 

        child
          .on('exit', function(code, signal) {  
            // Gives biglib extra informations using the "stats" function                        
            this.stats({ rc: code, signal: signal });    
            ret.emit('my_finish');    
            console.log("Emitting...");     
          }.bind(this))
          .on('error', function(err) {
            ret.emit('error', err);
          })        
      
        return ret;
      }

      // Custom on_finish callback used to correct the node status relative to the command return code
      var my_finish = function(stats) {  
        console.log("my_finish with code = " + stats.rc);
        if (config.minError && stats.rc >= config.minError) this.set_error(new Error("Return code " + stats.rc)); 
        else if (config.minWarning && stats.rc >= config.minWarning) this.set_warning();                
      };

      // new instance of biglib for this configuration
      var bignode = new biglib({ 
        config: config, node: this,   // biglib needs to know the node configuration and the node itself (for statuses and sends)
        status: 'filesize',           // define the kind of informations displayed while running
        parser_config: spawn_options, // the parser configuration (ie the known options the parser will understand)
        parser: spawn,                // the parser (ie the remote command)
        on_finish: my_finish,         // custom on_finish handler
        finish_event: 'my_finish'     // custom finish event to listen to
      });

      // biglib changes the configuration to add some properties
      config = bignode.config();

      this.on('input', function(msg) {

        // Is payload an extra argument
        delete config.commandArgs2;
        if (config.payloadIsArg && msg.payload) {
          msg.config = msg.config || {};
          msg.config.commandArgs2 = msg.payload;
        }

        bignode.main.call(bignode, msg);
      })
    }  

    RED.nodes.registerType("bigexec", BigExec);

}
