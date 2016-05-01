# node-red-contrib-bigexec

"Big Exec" is a Big Node for node-red. 

![alt tag](https://cloud.githubusercontent.com/assets/18165555/14589405/e3ae04e6-04e1-11e6-8591-5b8039a1e6b0.png)

![alt tag](https://cloud.githubusercontent.com/assets/18165555/14588392/dad963a6-04c8-11e6-8539-f9b4afc4cc32.png)

![alt tag](https://cloud.githubusercontent.com/assets/18165555/14588393/e0718708-04c8-11e6-888e-1489222be76e.png)

## Installation
```bash
npm install node-red-contrib-bigexec
```

## Principles for Big Nodes

###1 can handle big data or block mode

  That means, in block mode, not only "one message is a whole file" and able to manage start/end control messages

###2 send start/end messages as well as statuses

  That means it uses a second output to give control states (start/end/running and error) control messages

###3 tell visually what they are doing

  Visual status on the node tells it's ready/running (blue), all is ok and done (green) or in error (red)

## Usage



## Dependencies

[biglib](https://www.npmjs.com/package/node-red-biglib) library for building node-red flows that supports blocks, high volume

## Example flow files

Try pasting in the flow file below that shows the node behaviour 

  ```json

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

Please report any issues or suggestions via the [Github Issues list for this repository](https://github.com/Jacques44/node-red-contrib-bigexec/issues).

For more information, feedback, or community support see the Node-Red Google groups forum at https://groups.google.com/forum/#!forum/node-red


