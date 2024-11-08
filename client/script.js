const SERVER_URL = window.location.origin;
const WS_SERVER_URL = `ws://${window.location.host}`;
const supportedSizes = [10, 50, 100, 500]; // Ensure supported sizes

// Measure Ping
async function measurePing() {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(WS_SERVER_URL);
        socket.onopen = () => {
            const start = performance.now();
            socket.send('ping');
            socket.onmessage = () => {
                const end = performance.now();
                socket.close();
                resolve(end - start); // RTT in ms
            };
        };
        socket.onerror = (err) => reject(`WebSocket error: ${err.message}`);
    });
}

// Measure Download Speed
async function measureDownloadSpeed(sizeMB = 100, threads = 4) {
    if (!supportedSizes.includes(sizeMB)) {
        throw new Error(`Unsupported file size ${sizeMB}MB.`);
    }

    console.log(`Starting download test with ${threads} threads`);

    const promises = Array.from({ length: threads }, async () => {
        const start = performance.now();
        const response = await fetch(`${SERVER_URL}/download?size=${sizeMB / threads}`);
        await response.arrayBuffer(); // Fully download the file
        const end = performance.now();

        const duration = (end - start) / 1000; // seconds
        return ((sizeMB / threads) * 8) / duration; // Mbps per thread
    });

    const speeds = await Promise.all(promises);
    return speeds.reduce((a, b) => a + b, 0); // Total Mbps
}

// Measure Upload Speed
async function measureUploadSpeed(sizeMB = 50, chunkSizeMB = 5, threads = 4) {
    const chunkSize = chunkSizeMB * 1024 * 1024; // Convert MB to bytes
    const totalChunks = Math.ceil(sizeMB / chunkSizeMB);
    const testFile = new Uint8Array(chunkSize).fill(120); // Generate dummy data

    console.log(`Starting upload test with ${totalChunks} chunks and ${threads} threads`);

    const promises = Array.from({ length: threads }, async () => {
        const start = performance.now();

        for (let i = 0; i < totalChunks / threads; i++) {
            await fetch(`${SERVER_URL}/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: testFile,
            });
        }

        const end = performance.now();
        const duration = (end - start) / 1000; // seconds
        return (sizeMB / threads) * 8 / duration; // Mbps per thread
    });

    const speeds = await Promise.all(promises);
    return speeds.reduce((a, b) => a + b, 0); // Total Mbps
}

// Run the Tests
document.getElementById('startTest').addEventListener('click', async () => {
    document.getElementById('ping').textContent = '...';
    document.getElementById('downloadSpeed').textContent = '...';
    document.getElementById('uploadSpeed').textContent = '...';

    try {
        const ping = await measurePing();
        document.getElementById('ping').textContent = `${ping.toFixed(2)} ms`;

        const downloadSpeed = await measureDownloadSpeed(100, 4);
        document.getElementById('downloadSpeed').textContent = `${downloadSpeed.toFixed(2)} Mbps`;

        const uploadSpeed = await measureUploadSpeed(50, 5, 4);
        document.getElementById('uploadSpeed').textContent = `${uploadSpeed.toFixed(2)} Mbps`;
    } catch (error) {
        console.error('Speed test error:', error);
    }
});
