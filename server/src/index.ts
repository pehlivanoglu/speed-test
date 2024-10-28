import express from 'express';
import path from 'path';
import http from 'http';
import { WebSocketServer } from 'ws';
import os from 'os';

const app = express();
const PORT = process.env.PORT || 3000;
const MB = 1024 * 1024;

// Serve static files from the client folder (e.g., client/index.html and client/script.js)
app.use(express.static(path.join(__dirname, '../../client')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/index.html'));
});

// WebSocket Server Setup
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Handle WebSocket connections for ping measurement
wss.on('connection', (ws) => {
    console.log('WebSocket connection established for ping measurement');

    ws.on('message', (message) => {
        if (message.toString() === 'ping') {
            ws.send('pong'); // Respond immediately with "pong" for RTT calculation
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Download speed testing endpoint
const testFile1MB = Buffer.alloc(1 * MB, 'x');
const testFile10MB = Buffer.alloc(10 * MB, 'x');
const testFile100MB = Buffer.alloc(100 * MB, 'x');
const testFile1000MB = Buffer.alloc(1000 * MB, 'x');

app.get('/download', (req, res) => {
    try {
        const size = parseInt(req.query.size as string, 10);
        let testFile;

        switch (size) {
            case 1:
                testFile = testFile1MB;
                break;
            case 10:
                testFile = testFile10MB;
                break;
            case 100:
                testFile = testFile100MB;
                break;
            case 1000:
                testFile = testFile1000MB;
                break;
            default:
                throw new Error('Invalid size parameter');
        }

        console.log(`Download request received for ${size} MB file`);

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', testFile.length.toString());
        res.send(testFile);
    } catch (e) {
        res.status(400).json({ message: 'Invalid size parameter' });
    }
});

// Upload speed testing endpoint
app.use('/upload', express.raw({ type: 'application/octet-stream', limit: '1000mb' }));

app.post('/upload', (req, res) => {
    try {
        const receivedBuffer = req.body as Buffer;
        console.log('Uploaded buffer length from client (MB):', receivedBuffer.length / MB);
        res.status(200).json({ message: 'Buffer received successfully' });
    } catch (e) {
        res.status(400).json({ message: 'Invalid buffer received' });
    }
});

// Function to get local IP addresses
function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]!) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push(iface.address);
            }
        }
    }
    return addresses;
}

// Start the HTTP and WebSocket server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on the following addresses:`);
    console.log(`- http://0.0.0.0:${PORT}`);
    
    // Print all local IP addresses
    const ips = getLocalIPs();
    ips.forEach(ip => {
        console.log(`- http://${ip}:${PORT}`);
    });
});
