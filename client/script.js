const MB = 1024 * 1024;
const SERVER_URL = window.location.origin;
const WS_SERVER_URL = `ws://${window.location.host}`;

// Measure Ping (RTT) with WebSocket
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

// Measure Download Speed with Adaptive File Size
async function adaptiveDownloadTest() {
    let sizeMB = 1; // Start with 1 MB
    let stableSpeed = 0;
    let stabilityCount = 0;
    const speeds = [];
    const maxIterations = 14; // Set a maximum number of iterations

    while (stabilityCount < 3 && speeds.length < maxIterations) {
        const speed = await measureDownloadSpeed(sizeMB);
        speeds.push(speed);
        
        // Increase stability margin to 10%
        if (Math.abs(speed - stableSpeed) / stableSpeed <= 0.10 || stableSpeed === 0) {
            stabilityCount += 1;
            stableSpeed = speed;
        } else {
            stabilityCount = 0;
        }

        // Increase file size only if stability isn’t reached
        if (stabilityCount < 3) sizeMB = Math.min(sizeMB + 2, 20); // Cap size to 10 MB
    }

    return calculateWeightedAverage(speeds);
}

async function measureDownloadSpeed(sizeMB) {
    const start = performance.now();
    const response = await fetch(`${SERVER_URL}/download?size=${sizeMB}`);
    await response.arrayBuffer();
    const end = performance.now();
    const time = (end - start) / 1000;
    const speed = (sizeMB * 8) / time;
    return speed;
}

// Measure Upload Speed with Adaptive File Size
async function adaptiveUploadTest() {
    let sizeMB = 1; // Start with 1 MB
    let stableSpeed = 0;
    let stabilityCount = 0;
    const speeds = [];
    const maxIterations = 12; // Set a maximum number of iterations

    while (stabilityCount < 3 && speeds.length < maxIterations) {
        const speed = await measureUploadSpeed(sizeMB);
        speeds.push(speed);
        
        // Increase stability margin to 10%
        if (Math.abs(speed - stableSpeed) / stableSpeed <= 0.10 || stableSpeed === 0) {
            stabilityCount += 1;
            stableSpeed = speed;
        } else {
            stabilityCount = 0;
        }

        // Increase file size only if stability isn’t reached
        if (stabilityCount < 3) sizeMB = Math.min(sizeMB + 2, 20); // Cap size to 10 MB
    }

    return calculateWeightedAverage(speeds);
}

async function measureUploadSpeed(sizeMB) {
    const testFile = new Uint8Array(sizeMB * MB).fill(120);
    const start = performance.now();
    await fetch(`${SERVER_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: testFile
    });
    const end = performance.now();
    const time = (end - start) / 1000;
    const speed = (sizeMB * 8) / time;
    return speed;
}

// Weighted Average Calculation
function calculateWeightedAverage(speeds) {
    const weights = speeds.map((_, i) => i + 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    return speeds.reduce((sum, speed, i) => sum + speed * weights[i], 0) / totalWeight;
}

// Run the Tests and Display Results
document.getElementById('startTest').addEventListener('click', async () => {
    // Reset results while testing
    document.getElementById('ping').textContent = '...';
    document.getElementById('downloadSpeed').textContent = '...';
    document.getElementById('uploadSpeed').textContent = '...';

    try {
        // Measure Ping
        const ping = await measurePing();
        document.getElementById('ping').textContent = ping.toFixed(2);

        // Adaptive Download Speed Measurement
        const downloadSpeed = await adaptiveDownloadTest();
        document.getElementById('downloadSpeed').textContent = downloadSpeed.toFixed(2);

        // Adaptive Upload Speed Measurement
        const uploadSpeed = await adaptiveUploadTest();
        document.getElementById('uploadSpeed').textContent = uploadSpeed.toFixed(2);
    } catch (error) {
        console.error(error);
    }
});
