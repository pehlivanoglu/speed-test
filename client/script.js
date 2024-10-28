const MB = 1024 * 1024;
const SERVER_URL = window.location.origin;
const WS_SERVER_URL = `ws://${window.location.host}`;

async function measurePing() {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(WS_SERVER_URL);

        socket.onopen = () => {
            const start = performance.now();
            socket.send('ping');

            socket.onmessage = () => {
                const end = performance.now();
                const rtt = end - start;
                
                socket.close();
                resolve(rtt);
            };
        };

        socket.onerror = (error) => {
            reject(`WebSocket error: ${error.message}`);
        };
    });
}

async function measureDownloadSpeed(size) {
    const start = performance.now();
    const response = await fetch(`${SERVER_URL}/download?size=${size}`);
    await response.arrayBuffer();
    const end = performance.now();
    const time = (end - start) / 1000;
    const speed = (size * 8) / time;
    return speed;
}

async function measureUploadSpeed(size) {
    const testFile = new Uint8Array(size * MB).fill(120);
    const start = performance.now();
    await fetch(`${SERVER_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: testFile
    });
    const end = performance.now();
    const time = (end - start) / 1000;
    const speed = (size * 8) / time;
    return speed;
}

document.getElementById('startTest').addEventListener('click', async () => {
    // Reset results while testing
    document.getElementById('ping').textContent = '...';
    document.getElementById('downloadSpeed').textContent = '...';
    document.getElementById('uploadSpeed').textContent = '...';

    try {
        const ping = await measurePing();
        document.getElementById('ping').textContent = ping.toFixed(2);

        const downloadSpeed = await measureDownloadSpeed(100);
        document.getElementById('downloadSpeed').textContent = downloadSpeed.toFixed(2);

        const uploadSpeed = await measureUploadSpeed(10);
        document.getElementById('uploadSpeed').textContent = uploadSpeed.toFixed(2);
    } catch (error) {
        console.error(error);
    }
});
