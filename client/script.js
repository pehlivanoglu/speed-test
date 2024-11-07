const MB = 1024 * 1024; // 1 Megabyte in bytes
const SERVER_URL = window.location.origin;
const WS_SERVER_URL = `ws://${window.location.host}`;

// Measure Ping (RTT) using WebSocket
async function measurePing() {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(WS_SERVER_URL);
        socket.onopen = () => {
            const start = performance.now();
            socket.send('ping');
            socket.onmessage = () => {
                const end = performance.now();
                socket.close();
                resolve(end - start);
            };
        };
        socket.onerror = (err) => reject(`WebSocket error: ${err.message}`);
    });
}

// Measure Download Speed
async function measureDownloadSpeed(sizeMB = 10, threads = 3, durationCap = 5) {
    console.log(`Starting download test with ${threads} threads`);

    const promises = Array.from({ length: threads }, () =>
        new Promise(async (resolve) => {
            const start = performance.now();
            let downloadedBytes = 0;

            const response = await fetch(`${SERVER_URL}/download?size=${sizeMB}`);
            const reader = response.body.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                downloadedBytes += value.length;
            }

            const end = performance.now();
            resolve((downloadedBytes * 8) / (end - start) / 1000); // Mbps
        })
    );

    const speeds = await Promise.all(promises);
    return speeds.reduce((a, b) => a + b, 0) / threads; // Average speed
}


// Measure Upload Speed
async function measureUploadSpeed(sizeMB = 50, chunkSizeMB = 10, threads = 3) {
    console.log(`Starting upload test with ${threads} threads, ${sizeMB} MB total`);

    const totalChunks = Math.ceil(sizeMB / chunkSizeMB);
    const chunkSize = chunkSizeMB * MB;
    const testFile = new Uint8Array(chunkSize).fill(120); // Create a chunk of dummy data

    const promises = Array.from({ length: threads }, (_, threadId) =>
        new Promise(async (resolve) => {
            let uploadedBytes = 0;
            const start = performance.now();

            for (let i = 0; i < totalChunks / threads; i++) {
                await fetch(`${SERVER_URL}/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/octet-stream' },
                    body: testFile,
                }).then((res) => res.json());
                uploadedBytes += chunkSize;
            }

            const end = performance.now();
            resolve((uploadedBytes * 8) / (end - start) / 1000); // Mbps
        })
    );

    const speeds = await Promise.all(promises);
    return speeds.reduce((a, b) => a + b, 0) / threads; // Average speed
}



// Run the Tests
document.getElementById('startTest').addEventListener('click', async () => {
    document.getElementById('ping').textContent = '...';
    document.getElementById('downloadSpeed').textContent = '...';
    document.getElementById('uploadSpeed').textContent = '...';

    try {
        const ping = await measurePing();
        document.getElementById('ping').textContent = `${ping.toFixed(2)} ms`;

        const downloadSpeed = await measureDownloadSpeed(20, 3);
        document.getElementById('downloadSpeed').textContent = `${downloadSpeed} Mbps`;

        const uploadSpeed = await measureUploadSpeed(10, 3);
        document.getElementById('uploadSpeed').textContent = `${uploadSpeed} Mbps`;
    } catch (error) {
        console.error('Speed test error:', error);
    }
});
