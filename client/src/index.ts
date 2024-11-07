import axios from 'axios';

const MB = 1024 * 1024;
const URL = 'http://localhost:3000';
const NUM_CONNECTIONS = 4; // Number of parallel connections
const STABILITY_THRESHOLD = 0.1; // 10% stability margin
const MAX_SIZE_MB = 20; // Maximum file size for adaptive testing

// Function to calculate speed in Mbps
function calculateSpeed(sizeMB: number, timeMs: number): number {
    return (sizeMB * 8) / (timeMs / 1000); // Convert to Mbps
}

// Ping measurement using fetch for RTT calculation
async function measureRTT(): Promise<number> {
    const start = performance.now();
    
    try {
        await fetch(URL, { cache: 'no-store' });
        const end = performance.now();
        const rtt = end - start;
        console.log(`Ping: ${rtt.toFixed(2)} ms`);
        return rtt;
    } catch (error) {
        console.error("Ping failed:", error);
        return -1;
    }
}

// Adaptive multithreaded download speed test
async function measureDownloadSpeed(): Promise<number> {
    let sizeMB = 1; // Start with 1 MB
    let stabilityCount = 0;
    let previousSpeed = 0;
    const speeds: number[] = [];

    while (stabilityCount < 3 && sizeMB <= MAX_SIZE_MB) {
        const start = performance.now();

        try {
            // Run multiple concurrent download requests
            const downloadPromises = Array(NUM_CONNECTIONS).fill(null).map(() =>
                axios.get(`${URL}/download`, {
                    params: { size: sizeMB },
                    responseType: 'arraybuffer',
                })
            );

            await Promise.all(downloadPromises);
            const end = performance.now();
            const timeTaken = end - start;
            const speed = calculateSpeed(sizeMB * NUM_CONNECTIONS, timeTaken);

            speeds.push(speed);
            console.log(`Download ${sizeMB * NUM_CONNECTIONS}MB: ${speed.toFixed(2)} Mbps`);

            // Stability check within a 10% margin
            if (Math.abs(speed - previousSpeed) / previousSpeed <= STABILITY_THRESHOLD || previousSpeed === 0) {
                stabilityCount += 1;
                previousSpeed = speed;
            } else {
                stabilityCount = 0;
                previousSpeed = speed;
            }

            // Increase size if stability isn’t reached
            if (stabilityCount < 3) sizeMB += 2;
        } catch (error) {
            console.error('Error in download speed test:', error);
            return -1;
        }
    }

    // Calculate the average stable speed
    return speeds.reduce((a, b) => a + b, 0) / speeds.length;
}

// Adaptive multithreaded upload speed test
async function measureUploadSpeed(): Promise<number> {
    let sizeMB = 1; // Start with 1 MB
    let stabilityCount = 0;
    let previousSpeed = 0;
    const speeds: number[] = [];

    while (stabilityCount < 3 && sizeMB <= MAX_SIZE_MB) {
        const testFile = Buffer.alloc(sizeMB * MB, 'x'); // Create a test file of sizeMB
        const start = performance.now();

        try {
            // Run multiple concurrent upload requests
            const uploadPromises = Array(NUM_CONNECTIONS).fill(null).map(() =>
                axios.post(`${URL}/upload`, testFile, {
                    headers: { 'Content-Type': 'application/octet-stream' },
                })
            );

            await Promise.all(uploadPromises);
            const end = performance.now();
            const timeTaken = end - start;
            const speed = calculateSpeed(sizeMB * NUM_CONNECTIONS, timeTaken);

            speeds.push(speed);
            console.log(`Upload ${sizeMB * NUM_CONNECTIONS}MB: ${speed.toFixed(2)} Mbps`);

            // Stability check within a 10% margin
            if (Math.abs(speed - previousSpeed) / previousSpeed <= STABILITY_THRESHOLD || previousSpeed === 0) {
                stabilityCount += 1;
                previousSpeed = speed;
            } else {
                stabilityCount = 0;
                previousSpeed = speed;
            }

            // Increase size if stability isn’t reached
            if (stabilityCount < 3) sizeMB += 2;
        } catch (error) {
            console.error('Error in upload speed test:', error);
            return -1;
        }
    }

    // Calculate the average stable speed
    return speeds.reduce((a, b) => a + b, 0) / speeds.length;
}

// Main function to run the tests
(async () => {
    console.log("Starting ping test...");
    await measureRTT();

    console.log("Starting download speed test...");
    const downloadSpeed = await measureDownloadSpeed();
    console.log(`Average Download Speed: ${downloadSpeed.toFixed(2)} Mbps`);

    console.log("Starting upload speed test...");
    const uploadSpeed = await measureUploadSpeed();
    console.log(`Average Upload Speed: ${uploadSpeed.toFixed(2)} Mbps`);
})();
