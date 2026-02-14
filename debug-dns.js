import dns from 'dns';

const hostname = '_mongodb._tcp.cluster0.vducpru.mongodb.net';

console.log(`Resolving SRV for ${hostname}...`);

dns.resolveSrv(hostname, (err, addresses) => {
    if (err) {
        console.error('Error resolving:', err);
    } else {
        console.log('Addresses:', JSON.stringify(addresses, null, 2));
    }
});
