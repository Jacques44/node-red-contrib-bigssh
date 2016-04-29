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
    var stream = require('stream');

    function SSH_Node(n) {

      RED.nodes.createNode(this, n);

      this.host = n.host;
      this.port = n.port;
      this.label = '';
      this.userlabel = n.userlabel;

      var ssh_config = {
        host: this.host,
        port: this.port,
        username: this.credentials.username,
        privateKey: function() {
          try {
            return require('fs').readFileSync(this.credentials.privateKey)
          } catch (err) { 
            //throw new Error("Unable to read private key file: " + err.Message )
          }
        }.bind(this)()
      }

      //
      // In order to make this an instance while the object is common, it must not have any access to this.
      // execute must be called in the context of the node using these credentials
      //
      this.execute = function(my_config) {

        var stdin  = new stream.PassThrough({ objectMode: true }); // acts as a buffer while ssh is connecting
        var stdout = new stream.PassThrough({ objectMode: true });
        var ret = require('event-stream').duplex(stdin, stdout);

        var stderr = new stream.PassThrough({ objectMode: true });
        ret.others = [ stderr ];

        var conn = new require('ssh2').Client();
        this.working("Connecting to " + ssh_config.host + "...");

        conn.on('ready', function() {

          var commandLine = my_config.commandLine + ' ' + ((my_config.commandArgs || []).map(function(x) { return x.replace(' ', '\\ ') })).join(' ');
          this.working("Executing " + commandLine.substr(0,10) + "...");

          conn.exec(commandLine, function(err, stream) {
            if (err) return ret.emit('error', err);

            this.working('Launched, waiting for data...');

            stream
              .on('close', function(code, signal) {                          
                this.stats({ rc: code, signal: signal });              
              }.bind(this))
              .on('error', function(err) {
                console.log("On ERROR bigssh conn.exec");
                ret.emit('error', err);
              })

            // SSH stream is available, connect the bufstream
            stdin.pipe(stream).pipe(stdout);

            // Also connect the ssh stderr stream to the pre allocated stderr 
            stream.stderr.pipe(stderr);

          }.bind(this));      

        }.bind(this))
        .on('error', function(err) {
          console.log("On ERROR bigssh conn");
          ret.emit('error', err);
        })
        .connect(ssh_config)

        return ret;
      }

    }

    RED.nodes.registerType("SSH_Credentials", SSH_Node, {
      credentials: {
        username: { type: "text" },
        privateKey: { type: "text" }
      }
    });      

    const ssh_options = {
      "commandLine": "",
      "commandArgs": [],
      "minError": 1  
    }    

    function BigSSH(config) {

      RED.nodes.createNode(this, config);
      this.myssh = config.myssh;

      var crednode = RED.nodes.getNode(config.myssh);

      var my_finish = function(stats) {        
        if (stats.rc >= config.minError) this.set_error(new Error("Return code " + stats.rc));        
      };

      // new instance of biglib for this configuration
      var bignode = new biglib({ 
        config: config, node: this, 
        status: 'filesize', 
        parser_config: ssh_options, 
        parser: crednode.execute, 
        generator: 'remote',
        on_finish: my_finish
      });

      // biglib changes the configuration to add some properties
      config = bignode.config();

      this.on('input', bignode.main.bind(bignode));
    }  

    RED.nodes.registerType("bigssh", BigSSH);

}
