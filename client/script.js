const MB = 1024 * 1024;
const SERVER_URL = window.location.origin;

// Function to measure the ping (RTT)
async function measurePing() {
    const start = performance.now();
    await fetch(SERVER_URL);
    const end = performance.now();
    return end - start;
}

async function measureDownloadSpeed(size) {
    const start = performance.now();
    const response = await fetch(`${SERVER_URL}/download?size=${size}`);
    await response.arrayBuffer(); // Ensure the full response is downloaded
    const end = performance.now();
    const time = (end - start) / 1000; // Convert time to seconds
    const speed = (size * 8) / time; // Convert size to Mbps
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
    const time = (end - start) / 1000; // Convert time to seconds
    const speed = (size * 8) / time; // Convert size to Mbps
    return speed;
}

// Event listener for the "Start Test" button
document.getElementById('startTest').addEventListener('click', async () => {
    // Reset results while testing
    document.getElementById('ping').textContent = '...';
    document.getElementById('downloadSpeed').textContent = '...';
    document.getElementById('uploadSpeed').textContent = '...';

    // Measure ping
    const ping = await measurePing();
    document.getElementById('ping').textContent = ping.toFixed(2);

    // Measure download speed with a 10 MB file
    const downloadSpeed = await measureDownloadSpeed(10);
    document.getElementById('downloadSpeed').textContent = downloadSpeed.toFixed(2);

    // Measure upload speed with a 10 MB file
    const uploadSpeed = await measureUploadSpeed(10);
    document.getElementById('uploadSpeed').textContent = uploadSpeed.toFixed(2);
});
