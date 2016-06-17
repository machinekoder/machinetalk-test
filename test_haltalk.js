const sd = require('./service-discovery');
const assert = require('chai').assert;
const url = require('url');

const zmq = require('zmq');
const protobufMessage = require('machinetalk-protobuf').message;
const Container = protobufMessage.Container;
const ContainerType = protobufMessage.ContainerType;
const EventEmitter = require('events').EventEmitter;

function getServices(type, filters)
{
    let services = sd.services.filter(x => {
        let match = !type || (type === x.service);
        for (let item in filters) {
            match &= (x[item] === filters[item]);
        }
        return match;
    });
    return services;
}

function getServiceDsn(type)
{
    let service = getServices(type, [])[0];
    if (service !== undefined) {
        let dsn = url.parse(service.dsn);
        dsn.hostname = service.address;
        dsn.host = undefined;
        return dsn.format();
    }
    return null;
}

let services = {};

describe('Discover services', function() {
    it('should discover "halrcmd" and "halrcomp"', function(done) {
        setTimeout(function() {
            let dsn;
            dsn = getServiceDsn('halrcmd');
            assert.isNotNull(dsn, 'halrcmd not discovered');
            services.halrcmd = dsn;
            dsn = getServiceDsn('halrcomp');
            assert.isNotNull(dsn, 'halrcomp not discovered');
            services.halrcomp = dsn;
            done();
        }, 500);
    });
});

describe('Test Halrcmd', function() {
    let socket;
    before('open connection', function(done) {
        socket = zmq.socket('dealer');
        socket.monitor(500, 0);
        socket.on('connect', function(fd, ep) {
            console.log('Connected.');
            done();
        });
        console.log('Connecting to ' + services.halrcmd + '...');
        socket.connect(services.halrcmd);
    });

    it('Test MT_PING', function(done) {
        socket.on('message', function(msg) {
            let rx = Container.decode(msg);
            assert(rx.type === ContainerType.MT_PING_ACKNOWLEDGE, 'Wrong answer received');
            done();
        });
        let msg = {type: ContainerType.MT_PING};
        let encoded = Container.encode(msg);
        let sendBuffer = encoded.buffer.slice(0, encoded.limit);
        console.log('Sending message \n' + JSON.stringify(msg));
        socket.send(sendBuffer);
    });

    it('Test MT_HALRCOMMAND_DESCRIBE', function(done) {
        socket.on('message', function(msg) {
            let rx = Container.decode(msg);
            assert(rx.type === ContainerType.MT_HALRCOMMAND_DESCRIPTION, 'Wrong answer received');
            done();
        });
        let msg = {type: ContainerType.MT_HALRCOMMAND_DESCRIBE};
        let encoded = Container.encode(msg);
        let sendBuffer = encoded.buffer.slice(0, encoded.limit);
        console.log('Sending message \n' + JSON.stringify(msg));
        socket.send(sendBuffer);
    });

    after('close connection', function() {
        socket.close();
    });
});
