const MB = 1024 * 1024;
const URL = window.location.origin;

async function measureRTT(){
  // Warm up the server
  const start = performance.now();
  
  try {
      await fetch(URL);
      const end = performance.now();
      // console.log(`Ping: ${end - start} ms`);
      return end - start;
  } catch (error) {
      console.error("Ping failed:", error);
      return -1;
  }
}

async function measureUploadSpeed(size) {
  const testFile = new Uint8Array(size * MB);
  const start = performance.now();

  try {
    const response = await fetch(`${URL}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: testFile
    });
    const end = performance.now();

    // console.log(response.data);
    // console.log(`${size}MB : `, end - start, 'ms');
    // console.log(`${(size * 8) / ((end - start) / 1000)} Mb/s`);

    return (size * 8) / ((end - start) / 1000);
  } catch (error) {
    console.error('Error uploading the file:', error);
    return -1;
  }
}

async function measureDownloadSpeed(size) {
  const start = performance.now();

  try {
    const response = await fetch(`${URL}/download?size=${size}`, {
      method: 'GET',
    });
    const end = performance.now();

    // console.log(response.data);
    // console.log(`${size}MB : `, end - start, 'ms');
    // console.log(`${(size * 8) / ((end - start) / 1000)} Mb/s`);

    return (size * 8) / ((end - start) / 1000);
  } catch (error) {
    console.error('Error downloading the file:', error);
    return -1;
  }
}

document.getElementById('startTest').addEventListener('click', async () => {
    // Reset results while testing
    document.getElementById('ping').textContent = '...';
    document.getElementById('downloadSpeed').textContent = '...';
    document.getElementById('uploadSpeed').textContent = '...';

    try {
        // Measure Ping
        const ping = await measureRTT();
        document.getElementById('ping').textContent = ping.toFixed(2);

        // Adaptive Download Speed Measurement
        const downloadSpeed = await measureDownloadSpeed(100);
        document.getElementById('downloadSpeed').textContent = downloadSpeed.toFixed(2);

        // Adaptive Upload Speed Measurement
        const uploadSpeed = await measureUploadSpeed(100);
        document.getElementById('uploadSpeed').textContent = uploadSpeed.toFixed(2);
    } catch (error) {
        console.error(error);
    }
});