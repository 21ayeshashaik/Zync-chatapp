import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']); // Force Google DNS

const hostname = '_mongodb._tcp.cluster0.vducpru.mongodb.net';

console.log(`Resolving SRV for ${hostname} using 8.8.8.8...`);

dns.resolveSrv(hostname, (err, addresses) => {
    if (err) {
        console.error('Error resolving:', err);
    } else {
        console.log('Addresses:', JSON.stringify(addresses, null, 2));
    }
});
