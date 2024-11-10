const KB = 1024;
const packetSize = 64 * KB;
const uploadDownloadMBLimit = 100;
const timeLimit = 20; // seconds for tests

const downloadSpeedSpan = document.getElementById('downloadSpeed');
const uploadSpeedSpan = document.getElementById('uploadSpeed');
const pingResult = document.getElementById('ping');
const jitterResult = document.getElementById('jitter');

document.getElementById('startTest').addEventListener('click', async () => {
  console.log('Starting speed tests...');

  // Ping & Jitter Test
  console.log('Starting Ping and Jitter Test...');
  await measurePingAndJitter();

  // Download Speed Test
  console.log('Starting Download Test...');
  await startDownloadTest();

  // Upload Speed Test
  console.log('Starting Upload Test...');
  await startUploadTest();
});

async function measurePingAndJitter() {
  const WS_SERVER_URL = `ws://${window.location.hostname}:3003`;
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
                const jitter = pingTimes.reduce((acc, time, index, array) => {
                  if (index > 0) return acc + Math.abs(time - array[index - 1]);
                  return acc;
                }, 0) / (pingTimes.length - 1);

                console.log(`Average Ping: ${avgPing.toFixed(2)} ms`);
                console.log(`Jitter: ${jitter.toFixed(2)} ms`);

                pingResult.textContent = `${avgPing.toFixed(2)} ms`;
                jitterResult.textContent = `${jitter.toFixed(2)} ms`;
                resolve();
              }
            }
          }
        };
      }, 1000); // Send a ping every second
    };
  });
}

async function startDownloadTest() {
  const downloadSocket = new WebSocket(`ws://${window.location.hostname}:3001`);
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
  const uploadSocket = new WebSocket(`ws://${window.location.hostname}:3002`);
  const numPackets = (uploadDownloadMBLimit * KB * KB) / packetSize;

  return new Promise((resolve) => {
    uploadSocket.onopen = () => {
      console.log('Upload socket connected.');
      console.log(`Sending ${uploadDownloadMBLimit}MB of data...`);

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