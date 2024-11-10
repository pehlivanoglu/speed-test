const WebSocket = require('ws');
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const downloadServer = new WebSocket.Server({ port: 3001 });
const uploadServer = new WebSocket.Server({ port: 3002 });

const KB = 1024;
const packetSize = 64 * KB;
const dataBuffer = Buffer.alloc(packetSize, 'x');
const timeLimit = 20; // seconds for tests

// Serve client files
app.use(express.static(path.join(__dirname, '../../client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web server running on http://0.0.0.0:${PORT}`);
});

// Download Server
downloadServer.on('connection', (ws) => {
  ws.on('message', (message) => {
    const maxDataToSend = KB * KB * parseInt(message);
    const numPackets = maxDataToSend / packetSize;

    for (let i = 0; i < numPackets; i++) {
      ws.send(dataBuffer);
    }
    ws.close();
  });

  ws.on('close', () => {
    console.log('Download - Client disconnected');
  });
});

// Upload Server
let counter = 0;
uploadServer.on('connection', (ws) => {
  let uploadStart, uploadEnd;

  ws.on('message', (message) => {
    if (parseInt(message) === 1) {
      uploadEnd = performance.now();
      const totalData = (counter * packetSize * 8) / (KB * KB);
      const timeElapsed = (uploadEnd - uploadStart) / 1000;
      const measuredBandwidth = (totalData / timeElapsed).toFixed(1);
      ws.send(measuredBandwidth);
      ws.close();
      counter = 0;
    } else {
      if (counter === 0) uploadStart = performance.now();
      if (performance.now() - uploadStart > 1000 * timeLimit) ws.terminate();
      counter++;
    }
  });

  ws.on('close', () => {
    console.log('Upload - Client disconnected');
  });
});

// Ping-Pong for latency and jitter
const pingServer = new WebSocket.Server({ port: 3003 });
pingServer.on('connection', (ws) => {
  console.log('Ping-Pong connection established');
  ws.on('message', (message) => {
    if (message.toString() === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
    }
  });

  ws.on('close', () => {
    console.log('Ping-Pong connection closed');
  });
});

console.log('Servers running:');
console.log('Web server on http://0.0.0.0:3000');
console.log('Download server on ws://0.0.0.0:3001');
console.log('Upload server on ws://0.0.0.0:3002');
console.log('Ping-Pong server on ws://0.0.0.0:3003');
