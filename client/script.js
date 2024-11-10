const KB = 1024;
const packetSize = 64 * KB;
const uploadDownloadMBLimit = 100;
const timeLimit = 20; // in seconds

// DOM elements
const downloadSpeedSpan = document.getElementById('downloadSpeed');
const uploadSpeedSpan = document.getElementById('uploadSpeed');
const pingResult = document.getElementById('ping');
const jitterResult = document.getElementById('jitter');

document.getElementById('startTest').addEventListener('click', async () => {
  console.log('Starting speed tests...');

  await startPingTest();
  await startDownloadTest();
  await startUploadTest();
});

async function startPingTest() {
  console.log('Starting Ping Test...');
  const WS_SERVER_URL = `ws://${window.location.hostname}:3003`;
  const socket = new WebSocket(WS_SERVER_URL);
  const pingTimes = [];
  
  return new Promise((resolve) => {
    socket.onopen = () => {
      let count = 0;

      const interval = setInterval(() => {
        const start = performance.now();
        socket.send('ping');
        socket.onmessage = (event) => {
          const { type, timestamp } = JSON.parse(event.data);
          if (type === 'pong') {
            const ping = performance.now() - start;
            pingTimes.push(ping);
            console.log(`Ping: ${ping.toFixed(2)} ms`);
            count++;
            if (count >= 5) {
              clearInterval(interval);
              socket.close();

              const avgPing = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length;
              const jitter = pingTimes.reduce((acc, time, index, array) => {
                if (index > 0) return acc + Math.abs(time - array[index - 1]);
                return acc;
              }, 0) / (pingTimes.length - 1);

              pingResult.textContent = `${avgPing.toFixed(2)} ms`;
              jitterResult.textContent = `${jitter.toFixed(2)} ms`;
              resolve();
            }
          }
        };
      }, 1000);
    };
  });
}

async function startDownloadTest() {
  console.log('Starting Download Test...');
  const downloadSocket = new WebSocket(`ws://${window.location.hostname}:3001`);
  let counter = 0;
  let downloadStartTime, firstPacketTime;

  return new Promise((resolve) => {
    downloadSocket.onopen = () => {
      downloadSocket.send(`${uploadDownloadMBLimit}`);
    };

    downloadSocket.onmessage = () => {
      if (counter === 0) firstPacketTime = performance.now();
      if (performance.now() - firstPacketTime > timeLimit * 1000) {
        downloadSocket.close();
      }
      counter++;
    };

    downloadSocket.onclose = () => {
      const totalData = (counter * packetSize * 8) / (KB * KB); // Convert to Mbps
      const timeElapsed = (performance.now() - firstPacketTime) / 1000; // seconds
      const speed = (totalData / timeElapsed).toFixed(2); // Mbps
      console.log(`Download Speed: ${speed} Mbps`);
      downloadSpeedSpan.textContent = `${speed} Mbps`;
      resolve();
    };

    downloadSocket.onerror = (err) => {
      console.error('Download WebSocket error:', err);
      downloadSpeedSpan.textContent = 'Error';
      resolve();
    };
  });
}

async function startUploadTest() {
  console.log('Starting Upload Test...');
  const uploadSocket = new WebSocket(`ws://${window.location.hostname}:3002`);
  let numPackets = (uploadDownloadMBLimit * KB * KB) / packetSize;

  return new Promise((resolve) => {
    uploadSocket.onopen = () => {
      for (let i = 0; i < numPackets; i++) {
        uploadSocket.send(new Uint8Array(packetSize).fill(120));
      }
      uploadSocket.send(1);
    };

    uploadSocket.onmessage = (event) => {
      console.log(`Upload Speed: ${event.data} Mbps`);
      uploadSpeedSpan.textContent = `${event.data} Mbps`;
      resolve();
    };

    uploadSocket.onerror = (err) => {
      console.error('Upload WebSocket error:', err);
      uploadSpeedSpan.textContent = 'Error';
      resolve();
    };
  });
}
