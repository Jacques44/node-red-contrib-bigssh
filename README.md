# node-red-contrib-bigfile

"Big File" contrib for node-red. Original work by IBM doesn't fit my needs. With big files, multiple blocks are sent making parsing inconsistent. I also needed the file reader to use state of the art libraries
This node is able to manage big files by sending blocks or string  or lines

![alt tag](https://cloud.githubusercontent.com/assets/18165555/14589405/e3ae04e6-04e1-11e6-8591-5b8039a1e6b0.png)

![alt tag](https://cloud.githubusercontent.com/assets/18165555/14588392/dad963a6-04c8-11e6-8539-f9b4afc4cc32.png)

![alt tag](https://cloud.githubusercontent.com/assets/18165555/14588393/e0718708-04c8-11e6-888e-1489222be76e.png)

## Installation
```bash
npm install node-red-contrib-bigfile
```

## Principles for Big Nodes

###1 can handle big data or block mode

  That means, in block mode, not only "one message is a whole file" and able to manage start/end control messages

###2 send start/end messages as well as statuses

  That means it uses a second output to give control states (start/end/running and error) control messages

###3 tell visually what they are doing

  Visual status on the node tells it's ready/running (blue), all is ok and done (green) or in error (red)

## Usage

Big File is an input node for node-red to read big files and send them as blocks, lines or a unique string

It has options offered by fs: (https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options)

- encoding (any of Buffer encoding)
- start (inclusive, starts at 0)
- end (inclusive, starts at 0)
- highWaterMark (buffer size in 1024 bytes, default 64)

It has two options offered by byline: (https://www.npmjs.com/package/byline)

- data format (utf8, latin, hexdec, base64, ucs2 and ascii)
- keep empty lines

## Dependencies

[byline](https://www.npmjs.com/package/byline) simple line-by-line stream reader

[biglib](https://www.npmjs.com/package/node-red-biglib) library for building node-red flows that supports blocks, high volume

## Example flow files

Try pasting in the flow file below that shows the node behaviour 

  ```json
 [{"id":"a0ebc63c.5f1438","type":"bigfile reader","z":"916e30bf.6e91d","name":"output as blocks","filename":"","flow":"blocks","highWaterMark":"100","encoding":"utf8","format":"utf8","keepEmptyLines":false,"x":339.5,"y":294,"wires":[["b4138219.4bec8"],["b4138219.4bec8"]]},{"id":"848de4e6.7b7218","type":"inject","z":"916e30bf.6e91d","name":"GO","topic":"","payload":"temp.demo.bigfile","payloadType":"str","repeat":"","crontab":"","once":false,"x":152.5,"y":356,"wires":[["a0ebc63c.5f1438","de9664ed.216998","52975701.ad68a8"]]},{"id":"b0ccda.ff4f3328","type":"function","z":"916e30bf.6e91d","name":"random line generator","func":"function getRandomArbitrary(min, max) {\n  return Math.random() * (max - min) + min;\n}\n\nfor (n = 0; n < msg.payload; n++) {\n    var line = \"\";\n    for (i = 1; i < getRandomArbitrary(10,50); i++) {\n        line += String.fromCharCode(getRandomArbitrary('A'.charCodeAt(0), 'Z'.charCodeAt(0)))\n    }\n    msg_line = { payload: line }\n    \n    node.send(msg_line);\n}\n","outputs":"1","noerr":0,"x":387,"y":174,"wires":[["cbeb14da.3414e8"]]},{"id":"508ded1.faf7214","type":"inject","z":"916e30bf.6e91d","name":"10k lines generator","topic":"","payload":"10000","payloadType":"num","repeat":"","crontab":"","once":false,"x":188,"y":126,"wires":[["b0ccda.ff4f3328"]]},{"id":"cbeb14da.3414e8","type":"file","z":"916e30bf.6e91d","name":"","filename":"temp.demo.bigfile","appendNewline":true,"createDir":false,"overwriteFile":"false","x":589.5,"y":126,"wires":[]},{"id":"2f484802.d0b7b8","type":"debug","z":"916e30bf.6e91d","name":"got ... lines","active":true,"console":"false","complete":"payload","x":876.5,"y":422,"wires":[]},{"id":"52975701.ad68a8","type":"bigfile reader","z":"916e30bf.6e91d","name":"output as lines","filename":"","flow":"lines","encoding":"utf8","format":"utf8","keepEmptyLines":false,"x":327,"y":411,"wires":[["bf2ce649.40d318"],["bf2ce649.40d318"]]},{"id":"de9664ed.216998","type":"bigfile reader","z":"916e30bf.6e91d","name":"output as a buffer","filename":"","flow":"buffer","encoding":"utf8","format":"utf8","keepEmptyLines":false,"x":338,"y":354,"wires":[["a810695e.57ef98"],[]]},{"id":"bf2ce649.40d318","type":"function","z":"916e30bf.6e91d","name":"line counter","func":"if (msg.payload) {\n    global.lines++;\n}\nif (msg.control && msg.control.state == 'start') {\n    global.lines = 0;\n}\nif (msg.control && msg.control.state == 'end') {\n    node.send({ payload: \"Got \" + global.lines + \" lines\" })\n}\n","outputs":1,"noerr":0,"x":700.5,"y":422,"wires":[["2f484802.d0b7b8"]]},{"id":"6a24bcdf.95db44","type":"debug","z":"916e30bf.6e91d","name":"got a string","active":true,"console":"false","complete":"payload","x":877,"y":350,"wires":[]},{"id":"a810695e.57ef98","type":"function","z":"916e30bf.6e91d","name":"byte counter","func":"node.send({ payload: \"Got a \" + msg.payload.length + \" bytes string!\"})","outputs":1,"noerr":0,"x":645,"y":350,"wires":[["6a24bcdf.95db44"]]},{"id":"b4138219.4bec8","type":"function","z":"916e30bf.6e91d","name":"block counter","func":"if (msg.payload) {\n    global.blocks++;\n    global.size += msg.payload.length;\n}\nif (msg.control && msg.control.state == 'start') {\n    global.blocks = global.size = 0;\n}\nif (msg.control && msg.control.state == 'end') {\n    node.send({ payload: \"Got \" + global.blocks + \" blocks for a total of \" + global.size + \" bytes\" })\n}\n","outputs":1,"noerr":0,"x":634,"y":294,"wires":[["c066a7b1.3f9958"]]},{"id":"c066a7b1.3f9958","type":"debug","z":"916e30bf.6e91d","name":"got ... blocks + bytes","active":true,"console":"false","complete":"payload","x":847,"y":294,"wires":[]},{"id":"c15ea0fc.3ea16","type":"comment","z":"916e30bf.6e91d","name":"First of all, generate a random file","info":"","x":224.5,"y":88,"wires":[]},{"id":"ff5225f4.00add8","type":"comment","z":"916e30bf.6e91d","name":"bigfile usage demo pre-configured","info":"","x":235,"y":250,"wires":[]},{"id":"566e2be4.a991d4","type":"comment","z":"916e30bf.6e91d","name":"Big File node example of use","info":"","x":154,"y":32,"wires":[]},{"id":"7d8255ed.827dac","type":"bigfile reader","z":"916e30bf.6e91d","name":"","filename":"","flow":"blocks","encoding":"utf8","format":"utf8","keepEmptyLines":false,"x":534.5,"y":615,"wires":[[],[]]},{"id":"48919bc7.b76e64","type":"inject","z":"916e30bf.6e91d","name":"GO with an error","topic":"","payload":"","payloadType":"str","repeat":"","crontab":"","once":false,"x":172,"y":615,"wires":[["fc5f32ce.03a0d"]]},{"id":"fc5f32ce.03a0d","type":"function","z":"916e30bf.6e91d","name":"Non existing file","func":"msg.payload = \"/A/Probably/Non/Existing/File\"\nreturn msg;","outputs":1,"noerr":0,"x":368,"y":615,"wires":[["7d8255ed.827dac"]]},{"id":"6f5ee137.90a12","type":"inject","z":"916e30bf.6e91d","name":"GO controlled","topic":"","payload":"dummy","payloadType":"str","repeat":"","crontab":"","once":false,"x":165,"y":508,"wires":[["2849835c.d7b67c"]]},{"id":"b14557a9.4ebaa8","type":"bigfile reader","z":"916e30bf.6e91d","name":"initially as blocks","filename":"","flow":"blocks","encoding":"utf8","format":"utf8","keepEmptyLines":false,"x":511,"y":511,"wires":[["bf2ce649.40d318"],["bf2ce649.40d318"]]},{"id":"2849835c.d7b67c","type":"function","z":"916e30bf.6e91d","name":"control msg","func":"msg.config = { flow: \"lines\", filename: \"temp.demo.bigfile\" }\nreturn msg;","outputs":1,"noerr":0,"x":326,"y":528,"wires":[["b14557a9.4ebaa8"]]},{"id":"b1445c92.4ebba","type":"comment","z":"916e30bf.6e91d","name":"bigfile usage demo message configured","info":"","x":247,"y":472,"wires":[]},{"id":"ecd1a0fd.132e6","type":"comment","z":"916e30bf.6e91d","name":"error example","info":"","x":156,"y":575,"wires":[]},{"id":"a7382096.58c7e","type":"debug","z":"916e30bf.6e91d","name":"got ... lines","active":true,"console":"false","complete":"payload","x":911,"y":512,"wires":[]},{"id":"4726d706.b8d928","type":"function","z":"916e30bf.6e91d","name":"line counter","func":"if (msg.payload) {\n    global.lines++;\n}\nif (msg.control && msg.control.state == 'start') {\n    global.lines = 0;\n}\nif (msg.control && msg.control.state == 'end') {\n    node.send({ payload: \"Got \" + global.lines + \" lines\" })\n}\n","outputs":1,"noerr":0,"x":723,"y":511,"wires":[["a7382096.58c7e"]]}]
  ```

  ![alt tag](https://cloud.githubusercontent.com/assets/18165555/14589287/9c03d01a-04de-11e6-90dc-7a049079bb76.png)

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

Please report any issues or suggestions via the [Github Issues list for this repository](https://github.com/Jacques44/node-red-contrib-bigfile/issues).

For more information, feedback, or community support see the Node-Red Google groups forum at https://groups.google.com/forum/#!forum/node-red


