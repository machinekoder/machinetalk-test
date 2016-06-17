const dbus = require('dbus-native');
const avahi = require('avahi-dbus');

let bus =  dbus.systemBus();
let dndSd = new avahi.Daemon(bus);
let services = [];

function dnsServiceResolved(err, interface, protocol, name, type, domain, host, aprotocol, address, port, txt, flags) {
    if (err) {
        console.log("Resolve error: " + err);
        return;
    }

    let service = {name, host, address, port};
    for (let item of txt) {
        let textItem = Buffer(item.data).toString('utf8');
        let [key, value] = textItem.split('=');
        service[key] = value;
    }
    services.push(service);
}

function newDnsItem(interface, protocol, name, type, domain, flags)
{
    dndSd.ResolveService(interface, protocol, name, type, domain, avahi.PROTO_UNSPEC, 0, dnsServiceResolved);
}

function removeDnsItem (interface, protocol, name, type, domain, flags)
{
    for (let i = (services.length - 1); i >= 0; i--) {
        if (services[i].name === name) {
            services.splice(i, 1);
        }
    }
}

dndSd.ServiceBrowserNew(avahi.IF_UNSPEC, avahi.PROTO_INET, '_machinekit._tcp', 'local', 0, (err, browser) => {
    if (err) {
        console.log("Error registering service discovery", err);
        return;
    }

    browser.on('ItemNew', newDnsItem);
    browser.on('ItemRemove', removeDnsItem);
});

exports.services = services;
