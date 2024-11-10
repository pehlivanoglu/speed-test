const KB = 1024;
const packetSize = 64 * KB;
const timeLimit = 20; // seconds
const uploadDownloadMBLimit = 100;

let downloadSpeedSpan = document.getElementById('downloadSpeed');
let uploadSpeedSpan = document.getElementById('uploadSpeed');

document.getElementById('startTest').addEventListener('click', async () => {
    console.log('Starting speed test...');
    downloadSpeedSpan.textContent = 'Testing...';
    uploadSpeedSpan.textContent = 'Waiting...';

    await startDownloadTest();
    await startUploadTest();
});

function startDownloadTest() {
    return new Promise((resolve) => {
        console.log('Download – Starting test...');
        const downloadSocket = new WebSocket(`ws://${window.location.hostname}:3001`);
        let counter = 0;
        let downloadStartTime, downloadEndTime, firstPacketTime;

        downloadSocket.onopen = () => {
            downloadSocket.send(`${uploadDownloadMBLimit}`);
        };

        downloadSocket.onmessage = () => {
            downloadEndTime = performance.now();
            if (counter === 0) {
                firstPacketTime = performance.now();
            }
            if (performance.now() - firstPacketTime > timeLimit * 1000) {
                downloadSocket.close();
            }
            counter++;
        };

        downloadSocket.onclose = () => {
            const totalData = (counter * packetSize * 8) / (KB * KB); // Convert to Mbps
            const timeElapsed = (downloadEndTime - firstPacketTime) / 1000; // In seconds
            const speed = (totalData / timeElapsed).toFixed(2); // Mbps
            console.log(`Download - ${speed} Mbps`);
            downloadSpeedSpan.textContent = speed;
            resolve();
        };

        downloadSocket.onerror = (err) => {
            console.error('Download WebSocket error:', err);
            downloadSpeedSpan.textContent = 'Error';
            resolve();
        };
    });
}

function startUploadTest() {
    return new Promise((resolve) => {
        console.log('Upload – Starting test...');
        const uploadSocket = new WebSocket(`ws://${window.location.hostname}:3002`);
        let uploadStartTime, uploadEndTime;

        uploadSocket.onopen = () => {
            const numPackets = (uploadDownloadMBLimit * KB * KB) / packetSize;
            uploadSocket.send('0'); // Start signal

            for (let i = 0; i < numPackets; i++) {
                uploadSocket.send(new Uint8Array(packetSize).fill(120));
            }

            uploadSocket.send('1');
        };

        uploadSocket.onmessage = (event) => {
            console.log(`Upload - ${event.data} Mbps`);
            uploadSpeedSpan.textContent = event.data;
            resolve();
        };

        uploadSocket.onerror = (err) => {
            console.error('Upload WebSocket error:', err);
            uploadSpeedSpan.textContent = 'Error';
            resolve();
        };
    });
}
