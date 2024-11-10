const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const HTTP_PORT = 3030;
const DOWNLOAD_WS_PORT = 3031;
const UPLOAD_WS_PORT = 3032;
const PING_WS_PORT = 3033;

const KB = 1024;
const packetSize = 64 * KB;
const dataBuffer = Buffer.alloc(packetSize, 'x');
const timeLimit = 15; // seconds for tests
const SERVER_IP = "34.17.87.58";

// Serve client files
app.use(express.static(path.join(__dirname, './client')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './client/index.html'));
});

// Start the HTTP server
const server = http.createServer(app);
server.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`Web server running on http://${SERVER_IP}:${HTTP_PORT}`);
});

// --------------------------------------
// WebSocket Servers for Download, Upload, and Ping-Pong tests

// Download Server
const downloadServer = new WebSocket.Server({ port: DOWNLOAD_WS_PORT });
downloadServer.on('connection', (ws) => {
  console.log('Download - Client connected');

  ws.on('message', (message) => {
    console.log(`Download - Received request for ${message} MB of data`);
    const maxDataToSend = KB * KB * parseInt(message);
    const numPackets = maxDataToSend / packetSize;

    for (let i = 0; i < numPackets; i++) {
      ws.send(dataBuffer);
    }

    console.log(`Download - Sent ${numPackets} packets (${message} MB total)`);
    ws.close();
  });

  ws.on('close', () => {
    console.log('Download - Client disconnected');
  });

  ws.on('error', (err) => {
    console.error('Download - WebSocket error:', err.message);
  });
});

// Upload Server
const uploadServer = new WebSocket.Server({ port: UPLOAD_WS_PORT });
uploadServer.on('connection', (ws) => {
  console.log('Upload - Client connected');
  let uploadStart, uploadEnd;
  let counter = 0;

  ws.on('message', (message) => {
    if (parseInt(message) === 1) {
      uploadEnd = Date.now();
      const totalData = (counter * packetSize * 8) / (KB * KB); // Data in Megabits
      const timeElapsed = (uploadEnd - uploadStart) / 1000; // Time in seconds
      const measuredBandwidth = (totalData / timeElapsed).toFixed(1);

      console.log(`Upload - Total data uploaded: ${totalData.toFixed(2)} Megabits`);
      console.log(`Upload - Time elapsed: ${timeElapsed.toFixed(2)} seconds`);
      console.log(`Upload - Measured upload speed: ${measuredBandwidth} Mbps`);

      ws.send(measuredBandwidth);
      ws.close();
      counter = 0;
    } else {
      if (counter === 0) {
        uploadStart = Date.now();
        console.log('Upload - Data transmission started');
      }

      if (Date.now() - uploadStart > timeLimit * 1000) {
        console.warn('Upload - Time limit exceeded, terminating connection. But,');
        uploadEnd = Date.now();
        const totalData = (counter * packetSize * 8) / (KB * KB); // Data in Megabits
        const timeElapsed = (uploadEnd - uploadStart) / 1000; // Time in seconds
        const measuredBandwidth = (totalData / timeElapsed).toFixed(1);

        console.log(`Upload - Total data uploaded: ${totalData.toFixed(2)} Mbits`);
        console.log(`Upload - Time elapsed: ${timeElapsed.toFixed(2)} seconds`);
        console.log(`Upload - Measured upload speed: ${measuredBandwidth} Mbps`);

        ws.send(measuredBandwidth);
        ws.terminate();
        counter = 0;
      }

      counter++;
    }
  });

  ws.on('close', () => {
    console.log('Upload - Client disconnected');
  });

  ws.on('error', (err) => {
    console.error('Upload - WebSocket error:', err.message);
  });
});

// Ping-Pong Server for Latency and Jitter
const pingServer = new WebSocket.Server({ port: PING_WS_PORT });
pingServer.on('connection', (ws) => {
  console.log('Ping-Pong - Client connected');

  ws.on('message', (message) => {
    if (message.toString() === 'ping') {
      console.log(`Ping-Pong - Received ping, sending pong...`);
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
    }
  });

  ws.on('close', () => {
    console.log('Ping-Pong - Client disconnected');
  });

  ws.on('error', (err) => {
    console.error('Ping-Pong - WebSocket error:', err.message);
  });
});

// --------------------------------------
console.log(`Download server on ws://${SERVER_IP}:${DOWNLOAD_WS_PORT}`);
console.log(`Upload server on ws://${SERVER_IP}:${UPLOAD_WS_PORT}`);
console.log(`Ping-Pong server on ws://${SERVER_IP}:${PING_WS_PORT}`);