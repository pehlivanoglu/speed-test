const WebSocket = require('ws');

const downloadServer = new WebSocket.Server({ port: 3001 });
const uploadServer = new WebSocket.Server({ port: 3002 });

const KB = 1024;
const packetSize = 64 * KB;
const dataBuffer = Buffer.alloc(packetSize, 'x');
const timeLimit = 20; // Will be determined by the user
let counter = 0;
let uploadStart, uploadEnd;

downloadServer.on('connection', (ws) => {
    ws.on('message', (message) => {
        const maxDataToSend = KB * KB * parseInt(message);
        const numPackets = maxDataToSend / packetSize;
        
        for (let i = 0; i < numPackets; i += 1) {
          ws.send(dataBuffer);
        }
        ws.close();
    });
    ws.on('close', () => {
        console.log('Download - Client disconnected');
    });
});

uploadServer.on('connection', (ws) => {
    ws.on('message', (message) => {
        uploadEnd = performance.now();
        // console.log(parseInt(message));
        if(parseInt(message) === 1){
            const totalData = (counter * packetSize * 8) / (KB * KB);
            const timeElapsed = (uploadEnd - uploadStart) / 1000;
            const measuredBandwidth = (totalData / timeElapsed).toFixed(1);      
            // console.log(`Upload - ${measuredBandwidth} Mbps`);
            ws.send(measuredBandwidth);
            ws.close();
            counter = 0;
        }else{
            if(counter==0){
                uploadStart = performance.now();
            }
            if (performance.now() - uploadStart > 1000 * timeLimit) {
                ws.terminate();
            }
            counter++;
            // console.log(counter);
        }
        
    });
    ws.on('close', () => {
        console.log('Upload - Client disconnected');
    });
});

console.log('Download - Server on ws://34.17.87.58:3030');
console.log('Upload - Server on ws://34.17.87.58:3031');