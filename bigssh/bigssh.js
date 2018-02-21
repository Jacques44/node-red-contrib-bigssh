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
        privateKey: undefined,
        privateKeyFile: this.credentials.privateKey,
        passphrase: this.credentials.passphrase
      }

      //
      // In order to make this an instance while the object is common, it must not have any access to this.
      // execute must be called in the context of the node using these credentials
      //
      this.execute = function(my_config) {

        // This dummy writable is used when the command does not need any data on its stdin
        // If any data is coming, this stream drops it and no "EPIPE error" is thrown
        var dummy = biglib.dummy_writable(my_config.noStdin);   

        // Choice was made to read the keyfile at each run in order to make it possible to correct a configuration
        // without restarting
        try {
          ssh_config.privateKey = require('fs').readFileSync(ssh_config.privateKeyFile);
        } catch (err) {
          throw new Error("Private Key: " + err.Message);
        }

        // Create 3 passthrough in order to return a full set of streams far before they are really connected to a valid ssh remote command
        //var stdin  = new stream.PassThrough({ objectMode: true }); // acts as a buffer while ssh is connecting

        // This to avoid "invalid chunk data" when payload is not a string
        var stdin = biglib.stringify_stream();

        var stdout = new stream.PassThrough({ objectMode: true });

        // Consider output as. This is used when the remote command sends data in another encoding than utf8
        if (my_config.format) child.stdout.setEncoding(format);

        // Magic library to mix a Writable and a Readable stream into a Transform
        var ret = require('event-stream').duplex(my_config.noStdin ? dummy : stdin, stdout);

        // Not a good idea at all ! If done, ssh is blocking its output at about 1 Mb of data!
        //if (my_config.noStdin) stdin.end();

        var stderr = new stream.PassThrough({ objectMode: true });

        // the others property is known by biglib and used to send extra streams to extra outputs
        ret.others = [ stderr ];

        // Here it is, the job is starting now
        var conn = new require('ssh2').Client();

        // this means "biglib"
        this.working("Connecting to " + ssh_config.host + "...");

        conn.on('ready', function() {

          var commandLine = my_config.commandLine + ' ' + biglib.argument_to_string(my_config.commandArgs.concat(my_config.commandArgs2||[]));

          // this means "biglib" instance. Substr is to avoid a text too long
          this.working("Executing " + commandLine.substr(0,20) + "...");

          conn.exec(commandLine, function(err, stream) {
            if (err) return ret.emit('error', err);

            this.working('Launched, waiting for data...');

            stream
              .on('close', function(code, signal) {  

                // Gives biglib extra informations using the "stats" function                        
                this.stats({ rc: code, signal: signal }); 
                ret.emit('my_finish');    

                conn.end();

              }.bind(this))
              .on('error', function(err) {
                ret.emit('error', err);

                conn.end();
              })

            // SSH stream is available, connect the bufstream
            stdin.pipe(stream).pipe(stdout);

            // Also connect the ssh stderr stream to the pre allocated stderr 
            stream.stderr.pipe(stderr);

          }.bind(this));      

        }.bind(this))
        .on('error', function(err) {
          ret.emit('error', err);
        })
        .connect(ssh_config)

        return ret;
      }

    }

    RED.nodes.registerType("SSH_Credentials", SSH_Node, {
      credentials: {
        username: { type: "text" },
        privateKey: { type: "text" },
        passphrase: { type: "password" }
      }
    });      

    // The options the spawner will understand
    var ssh_options = {
      "commandLine": "",
      "commandArgs": { value: "", validation: biglib.argument_to_array },     // Arguments from the configuration box
      "commandArgs2": { value: "", validation: biglib.argument_to_array },    // Payload as additional arguments if required
      "minWarning": 1,                                                        // The min return code the node will consider it is a warning
      "minError": 8,                                                          // The min return code the node will consider it is as an error
      "noStdin": false                                                        // Command does require an input (used to avoid EPIPE error)                                                   // Command does require an input (used to avoid EPIPE error)
    }    

    function BigSSH(config) {

      RED.nodes.createNode(this, config);
      this.myssh = config.myssh;

      var crednode = RED.nodes.getNode(config.myssh);

      // Custom progress function
      var progress = function(running) { return running ? "running for " + this.duration() : ("done with rc " + (this._runtime_control.rc != undefined ? this._runtime_control.rc : "?")) }

      // new instance of biglib for this configuration
      var bignode = new biglib({ 
        config: config, node: this,   // biglib needs to know the node configuration and the node itself (for statuses and sends)
        status: progress,             // define the kind of informations displayed while running
        parser_config: ssh_options,   // the parser configuration (ie the known options the parser will understand)
        parser: crednode.execute,     // the parser (ie the remote command)
        on_finish: biglib.min_finish, // custom "on_finish" handler. Used to capture the return code
        finish_event: 'my_finish',    // custom finish event to listen to. The end won't be the "close" event of the stream but the result of the custom "on_finish" handler
        generator: 'limiter'          // acts as a generator as it's not a real filter. If multiple payloads arrive, without this, will fork as many ssh as incoming messages!
      });

      // biglib changes the configuration to add some properties
      config = bignode.config();

      this.on('input', function(msg) {

        // Is payload an extra argument
        delete config.commandArgs2;
        if (config.payloadIsArg && msg.payload) {
          msg.config = msg.config || {};
          msg.config.commandArgs2 = msg.payload;

          // if not, the size_stream which streams to the command will throw EPIPE
          delete msg.payload;
        }

        bignode.main.call(bignode, msg);
      })
    }  

    RED.nodes.registerType("bigssh", BigSSH);

}
