import express from 'express';
import path from 'path';
import http from 'http';
import { WebSocketServer } from 'ws';
import os from 'os';
import cors from 'cors';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// Allowed file sizes (in MB)
const supportedSizes = [10, 50, 100, 500];

// Enable CORS
app.use(cors());

// Serve static files from the client folder
app.use(express.static(path.join(__dirname, '../../client')));

// Serve pre-generated test files
app.use('/public', express.static(path.join(__dirname, '../public')));

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
            ws.send('pong'); // Respond for RTT measurement
        }
    });
    ws.on('close', () => console.log('WebSocket connection closed'));
});

// Download Speed Testing Endpoint
app.get('/download', (req, res) => {
    const sizeMB = parseInt(req.query.size as string, 10);

    if (!supportedSizes.includes(sizeMB)) {
        console.error(`Invalid download request: ${sizeMB}MB not supported`);
        return res.status(400).json({ message: `Unsupported size: ${sizeMB}MB. Supported sizes: ${supportedSizes.join(', ')}MB.` });
    }

    const filePath = path.join(__dirname, `../public/testfile-${sizeMB}MB.bin`);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return res.status(404).json({ message: `File of size ${sizeMB}MB not found.` });
    }

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err.message);
            res.status(500).json({ message: 'Error sending file' });
        } else {
            console.log(`Served testfile-${sizeMB}MB.bin to ${req.ip}`);
        }
    });
});

// Upload Speed Testing Endpoint
app.use('/upload', express.raw({ type: 'application/octet-stream', limit: '1000mb' }));

app.post('/upload', (req, res) => {
    let totalBytes = 0;

    req.on('data', (chunk) => {
        totalBytes += chunk.length;
    });

    req.on('end', () => {
        console.log(`Upload complete: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB from ${req.ip}`);
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
    getLocalIPs().forEach((ip) => console.log(`- http://${ip}:${PORT}`));
});
