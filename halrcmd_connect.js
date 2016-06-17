var EventEmitter = require('events').EventEmitter;
var zmq = require('zmq');
var protobufMessage = require('machinetalk-protobuf').message;
var Container = protobufMessage.Container;
var ContainerType = protobufMessage.ContainerType;

function socketMessageReceived(msg) {
    let rx = Container.decode(msg);
    console.log('received message:');
    console.log(rx);
}

function socketConnected(fd, ep) {
    console.log('connected');
}

let socket = zmq.socket('dealer');
socket.on('message', socketMessageReceived);
socket.on('connect', socketConnected);
socket.monitor(500, 0);
socket.connect('tcp://127.0.0.1:12345');
let msg = {type: ContainerType.MT_PING};
let encoded = Container.encode(msg);
let sendBuffer = encoded.buffer.slice(0, encoded.limit);
socket.send(sendBuffer);
