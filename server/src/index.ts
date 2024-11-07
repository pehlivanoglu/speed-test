import express from 'express';
import path from 'path';
import http from 'http';
import { WebSocketServer } from 'ws';
import os from 'os';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;
const MB = 1024 * 1024; // 1 Megabyte in bytes

// Enable CORS
app.use(cors());

// Serve static files from the client folder
app.use(express.static(path.join(__dirname, '../../client')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/index.html'));
});

// WebSocket for Ping Test
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    ws.on('message', (message) => {
        if (message.toString() === 'ping') {
            ws.send('pong'); // Response for RTT measurement
        }
    });
    ws.on('close', () => console.log('WebSocket connection closed'));
});

// Download Speed Testing Endpoint
app.get('/download', (req, res) => {
    const sizeMB = parseInt(req.query.size as string, 10);

    if (isNaN(sizeMB) || sizeMB <= 0) {
        return res.status(400).json({ message: 'Invalid size parameter' });
    }

    const testFile = Buffer.alloc(sizeMB * MB, 'x'); // Generate test buffer
    console.log(`Download request: ${sizeMB} MB from ${req.ip}`);

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', testFile.length.toString());
    res.send(testFile);
});

// Improved Upload Speed Testing Endpoint
app.post('/upload', (req, res) => {
    let totalBytes = 0;

    req.on('data', (chunk) => {
        totalBytes += chunk.length;
    });

    req.on('end', () => {
        console.log(`Upload complete: ${(totalBytes / MB).toFixed(2)} MB from ${req.ip}`);
        res.status(200).json({ receivedBytes: totalBytes });
    });

    req.on('error', (err) => {
        console.error(`Upload error from ${req.ip}:`, err.message);
        res.status(500).json({ message: 'Error processing upload' });
    });
});


// Get Local IP Addresses
function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];

    for (const iface of Object.values(interfaces)) {
        iface?.forEach((ip) => {
            if (ip.family === 'IPv4' && !ip.internal) {
                addresses.push(ip.address);
            }
        });
    }
    return addresses;
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}:`);
    console.log(`- http://localhost:${PORT}`);
    getLocalIPs().forEach((ip) => console.log(`- http://${ip}:${PORT}`));
});
