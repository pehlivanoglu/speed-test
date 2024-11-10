import express from 'express';
import path from 'path';
import http from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const HTTP_PORT = 3000; // Web server port
const DOWNLOAD_WS_PORT = 3001; // WebSocket for download test
const UPLOAD_WS_PORT = 3002; // WebSocket for upload test

// Serve static files from the client folder
app.use(express.static(path.join(__dirname, '../../client')));

// Route for index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/index.html'));
});

// Start HTTP server on 0.0.0.0
const httpServer = app.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`Web server running on http://0.0.0.0:${HTTP_PORT}`);
});

// WebSocket server for download speed test
const downloadServer = new WebSocketServer({ port: DOWNLOAD_WS_PORT, host: '0.0.0.0' });
console.log(`Download WebSocket server running on ws://0.0.0.0:${DOWNLOAD_WS_PORT}`);

downloadServer.on('connection', (ws) => {
    const KB = 1024;
    const packetSize = 64 * KB;
    const dataBuffer = Buffer.alloc(packetSize, 'x');

    ws.on('message', (message) => {
        const maxDataToSend = parseInt(message.toString()) * KB * KB;
        const numPackets = Math.ceil(maxDataToSend / packetSize);

        for (let i = 0; i < numPackets; i++) {
            ws.send(dataBuffer);
        }
        ws.close();
    });

    ws.on('close', () => {
        console.log('Download - Client disconnected');
    });
});

// WebSocket server for upload speed test
const uploadServer = new WebSocketServer({ port: UPLOAD_WS_PORT, host: '0.0.0.0' });
console.log(`Upload WebSocket server running on ws://0.0.0.0:${UPLOAD_WS_PORT}`);

uploadServer.on('connection', (ws) => {
    let uploadStart: number;
    let packetCount = 0;

    ws.on('message', (message) => {
        const num = parseInt(message.toString());
        if (num === 0) {
            // Start the timer
            uploadStart = performance.now();
        } else if (num === 1) {
            // End of upload test
            const uploadEnd = performance.now();
            const totalDataMB = (packetCount * 64) / 1024; // in MB
            const timeElapsed = (uploadEnd - uploadStart) / 1000; // in seconds
            const uploadSpeed = (totalDataMB * 8) / timeElapsed; // in Mbps

            ws.send(uploadSpeed.toFixed(1));
            ws.close();
        } else {
            packetCount++;
        }
    });

    ws.on('close', () => {
        console.log('Upload - Client disconnected');
    });
});