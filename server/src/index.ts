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

// WebSocket server setup for ping measurement
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

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

// Download speed testing endpoint (dynamically handles file sizes)
app.get('/download', (req, res) => {
    try {
        const sizeMB = parseInt(req.query.size as string, 10);
        if (isNaN(sizeMB) || sizeMB <= 0) throw new Error('Invalid size parameter');

        const testFile = Buffer.alloc(sizeMB * MB, 'x');
        console.log(`Download request received for ${sizeMB} MB file`);

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
