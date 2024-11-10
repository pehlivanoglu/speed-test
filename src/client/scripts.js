const DOWNLOAD_WS_PORT = 3031;
const UPLOAD_WS_PORT = 3032;
const PING_WS_PORT = 3033;

const KB = 1024; // 1 KB
const packetSize = 64 * KB; // Each packet is 64 KB
const timeLimit = 15; // Time limit for download/upload tests in seconds
const uploadDownloadMBLimit = 100; // for each test (down-up) in MB

const dataBuffer = new Uint8Array(packetSize).fill(120); // Fill buffer for upload with dummy number

const downloadSpeedSpan = document.getElementById('downloadSpeed');
const uploadSpeedSpan = document.getElementById('uploadSpeed');
const pingResult = document.getElementById('ping');
const jitterResult = document.getElementById('jitter');
const startButton = document.getElementById('startTest');

startButton.addEventListener('click', async () => {
    startButton.disabled = true;
    resetUI();

    console.log('Starting speed tests...');

    try {
        console.log('Measuring Ping and Jitter...');
        setTextAndStyle(pingResult, 'Measuring...', 'measuring');
        setTextAndStyle(jitterResult, 'Measuring...', 'measuring');
        await measurePingAndJitter();

        console.log('Measuring Download Speed...');
        setTextAndStyle(downloadSpeedSpan, 'Measuring...', 'measuring');
        await startDownloadTest();

        console.log('Measuring Upload Speed...');
        setTextAndStyle(uploadSpeedSpan, 'Measuring...', 'measuring');
        await startUploadTest();
    } catch (error) {
        console.error('Error during test:', error);
    }

    startButton.disabled = false;
});

function resetUI() {
    setTextAndStyle(pingResult, 'Waiting...', 'waiting');
    setTextAndStyle(jitterResult, 'Waiting...', 'waiting');
    setTextAndStyle(downloadSpeedSpan, 'Waiting...', 'waiting');
    setTextAndStyle(uploadSpeedSpan, 'Waiting...', 'waiting');
}

function setTextAndStyle(element, text, styleClass) {
    element.textContent = text;
    element.className = styleClass;
}

async function measurePingAndJitter() {
    const WS_SERVER_URL = `ws://${window.location.hostname}:${PING_WS_PORT}`;
    const socket = new WebSocket(WS_SERVER_URL);
    const pingTimes = [];

    return new Promise((resolve) => {
        socket.onopen = () => {
            let warmupCount = 3;
            let actualCount = 0;

            console.log('Ping test initiated...');

            const interval = setInterval(() => {
                const start = performance.now();
                socket.send('ping');
                console.log(`Ping sent...`);

                socket.onmessage = (event) => {
                    const { type, timestamp } = JSON.parse(event.data);
                    if (type === 'pong') {
                        const ping = performance.now() - start;
                        if (warmupCount > 0) {
                            console.log(`Warm-up Ping: ${ping.toFixed(2)} ms`);
                            warmupCount--;
                        } else {
                            pingTimes.push(ping);
                            console.log(`Measured Ping: ${ping.toFixed(2)} ms`);
                            actualCount++;

                            if (actualCount >= 5) {
                                clearInterval(interval);
                                socket.close();

                                const avgPing = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length;
                                const jitter = pingTimes.reduce((acc, time, i, arr) => {
                                    if (i > 0) return acc + Math.abs(time - arr[i - 1]);
                                    return acc;
                                }, 0) / (pingTimes.length - 1);

                                console.log(`Average Ping: ${avgPing.toFixed(2)} ms`);
                                console.log(`Jitter: ${jitter.toFixed(2)} ms`);

                                setTextAndStyle(pingResult, `${avgPing.toFixed(2)} ms`, 'success');
                                setTextAndStyle(jitterResult, `${jitter.toFixed(2)} ms`, 'success');
                                resolve();
                            }
                        }
                    }
                };
            }, 1000);
        };
    });
}

async function startDownloadTest() {
    const downloadSocket = new WebSocket(`ws://${window.location.hostname}:${DOWNLOAD_WS_PORT}`);
    let counter = 0;
    let firstPacketTime;

    return new Promise((resolve) => {
        downloadSocket.onopen = () => {
            console.log('Download socket connected.');
            downloadSocket.send(`${uploadDownloadMBLimit}`);
            console.log(`Requested ${uploadDownloadMBLimit}MB of data...`);
        };

        downloadSocket.onmessage = () => {
            if (counter === 0) firstPacketTime = performance.now();
            if (performance.now() - firstPacketTime > timeLimit * 1000) {
                downloadSocket.close();
            }
            counter++;
        };

        downloadSocket.onclose = () => {
            const totalData = (counter * packetSize * 8) / (KB * KB); // Mbps
            const timeElapsed = (performance.now() - firstPacketTime) / 1000; // seconds
            const speed = (totalData / timeElapsed).toFixed(2); // Mbps

            console.log(`Total downloaded data: ${totalData.toFixed(2)} Mbps`);
            console.log(`Time elapsed: ${timeElapsed.toFixed(2)} seconds`);
            console.log(`Download Speed: ${speed} Mbps`);

            setTextAndStyle(downloadSpeedSpan, `${speed} Mbps`, 'success');
            resolve();
        };

        downloadSocket.onerror = (err) => {
            console.error('Download WebSocket error:', err);
            setTextAndStyle(downloadSpeedSpan, 'Error', 'error');
            resolve();
        };
    });
}

async function startUploadTest() {
    const uploadSocket = new WebSocket(`ws://${window.location.hostname}:${UPLOAD_WS_PORT}`);
    const numPackets = (uploadDownloadMBLimit * KB * KB) / packetSize;

    return new Promise((resolve) => {
        uploadSocket.onopen = () => {
            console.log('Upload socket connected.');
            console.log(`Sending ${uploadDownloadMBLimit}MB of data...`);

            for (let i = 0; i < numPackets; i++) {
                uploadSocket.send(dataBuffer);
            }
            uploadSocket.send('1');
        };

        uploadSocket.onmessage = (event) => {
            console.log(`Upload Speed: ${event.data} Mbps`);
            setTextAndStyle(uploadSpeedSpan, `${event.data} Mbps`, 'success');
            resolve();
        };

        uploadSocket.onerror = (err) => {
            console.error('Upload WebSocket error:', err);
            setTextAndStyle(uploadSpeedSpan, 'Error', 'error');
            resolve();
        };
    });
}