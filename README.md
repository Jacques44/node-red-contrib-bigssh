# node-red-contrib-bigssh

## Installation
```bash
npm install node-red-contrib-bigssh
```

## Principles for Big Nodes

Big nodes are a family of node-red nodes built to handle huge data. They all rely on biglib library
Here are the 3 rules for big nodes:

###1 can handle big data block by block

  That means, with all the big node family, can handle big amount of data working block by block using control messages

###2 send start/end messages as well as statuses

  That means, as all big nodes, it uses another output to send control messages (start/end/running and error states)

###3 tell visually what they are doing

  Visual status on the node tells if it's ready/running (blue), if all is ok and done (green) or if there is any error (red)
  The control output can be used with big status to see what's going on

## Usage

Big SSH is an input node for node-red to execute command over ssh to a remote host
Command can be set as a property of the node. Payload can be used to add arguments to the command and now, the command can be a javascript template string and payload the variables

You've first to set the authentication part which rely on a third party library. You've to test it as ssh always ask for some interactive answer at first try
You'need then to set the command, choose how payload are used.
Don't forget that you should give the full path of the command as environment is never set once connected on the remote

## Dependencies

[byline](https://www.npmjs.com/package/byline) simple line-by-line stream reader

[biglib](https://www.npmjs.com/package/node-red-biglib) library for building node-red flows that supports blocks, high volume

[ssh2](https://www.npmjs.com/package/ssh2) third pary library for executing remote command using ssh

## Example flow files

Try pasting in the flow file below that shows the node behaviour. Don't forget to set the credentials :-)

  ```json
  [{"id":"d3b7983c.c97908","type":"bigssh","z":"5f1eb5c5.4b8a5c","name":"","commandLine":"echo \"Welcome ${payload.me} to $(whoami)@$(hostname)\"","commandArgs":"","minError":1,"minWarning":1,"noStdin":false,"format":"","payloadIsArg":true,"myssh":"29df19bc.46db36","x":370,"y":200,"wires":[["477828b0.0ecb68"],["c3649904.a68108"],["743d5a09.a72bd4"]]},{"id":"c3649904.a68108","type":"bigstatus","z":"5f1eb5c5.4b8a5c","name":"","locale":"fr","show_date":true,"show_duration":false,"x":730,"y":200,"wires":[[]]},{"id":"477828b0.0ecb68","type":"bigline","z":"5f1eb5c5.4b8a5c","name":"stdout","filename":"","format":"utf8","keepEmptyLines":false,"x":570,"y":140,"wires":[["614e8cdf.3d7ea4"],[]]},{"id":"614e8cdf.3d7ea4","type":"debug","z":"5f1eb5c5.4b8a5c","name":"stdout","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":710,"y":140,"wires":[]},{"id":"743d5a09.a72bd4","type":"bigline","z":"5f1eb5c5.4b8a5c","name":"stderr","filename":"","format":"utf8","keepEmptyLines":false,"x":570,"y":260,"wires":[["33a59bcb.34ee64"],[]]},{"id":"33a59bcb.34ee64","type":"debug","z":"5f1eb5c5.4b8a5c","name":"stderr","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":710,"y":260,"wires":[]},{"id":"7a7fdea4.2ec13","type":"inject","z":"5f1eb5c5.4b8a5c","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"{\"me\":\"Mr J\"}","payloadType":"json","x":170,"y":200,"wires":[["d3b7983c.c97908"]]},{"id":"29df19bc.46db36","type":"SSH_Credentials","host":"127.0.0.1","port":"22","userlabel":"dummy@127.0.0.1"}]
  ```

## Author

  - Jacques W

## License

This code is Open Source under an Apache 2 License.

You may not use this code except in compliance with the License. You may obtain an original copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. Please see the
License for the specific language governing permissions and limitations under the License.

## Feedback and Support

Please report any issues or suggestions via the [Github Issues list for this repository](https://github.com/Jacques44/node-red-contrib-bigssh/issues).

For more information, feedback, or community support see the Node-Red Google groups forum at https://groups.google.com/forum/#!forum/node-red


