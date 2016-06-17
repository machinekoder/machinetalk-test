var EventEmitter = require('events').EventEmitter;
var zmq = require('zmq');
var protobufMessage = require('machinetalk-protobuf').message;
var Container = protobufMessage.Container;
var ContainerType = protobufMessage.ContainerType;

function socketMessageReceived(address, msg) {
    let rx = Container.decode(msg);
    console.log('received message:');
    console.log(rx.type);
}

var socket = zmq.socket('router');
socket.setsockopt(zmq.ZMQ_LINGER, 0);
socket.bind('tcp://127.0.0.1:12345');
socket.on('message', socketMessageReceived);

