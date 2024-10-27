import axios from 'axios';

const MB = 1024 * 1024;
const URL = 'http://localhost:3000';

async function measureRTT(url: string): Promise<number> {
  // // Warm up
  // await fetch(url, { cache: 'no-store' });
  // await fetch(url, { cache: 'no-store' });

  const start = performance.now();
  
  try {
      await fetch(url, { cache: 'no-store' });
      const end = performance.now();
      console.log(`Ping: ${end - start} ms`);
      return end - start;
  } catch (error) {
      console.error("Ping failed:", error);
      return -1;
  }
}

async function measureUploadSpeed(size: number): Promise<number> {
  const testFile = Buffer.alloc(size * MB, 'x');
  const start = performance.now();

  try {
    const response = await axios.post(`${URL}/upload`, testFile, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
    const end = performance.now();

    console.log(response.data);
    console.log(`${size}MB : `, end - start, 'ms');
    console.log(`${(size * 8) / ((end - start) / 1000)} Mb/s`);

    return end - start;
  } catch (error) {
    console.error('Error uploading the file:', error);
    return -1;
  }
}

async function measureDownloadSpeed(size: number): Promise<number> {
  const start = performance.now();

  try {
    const response = await axios.get(`${URL}/download`, {
      params: { size },
      responseType: 'arraybuffer',
    });
    const end = performance.now();

    // console.log(response.data);
    console.log(`${size}MB : `, end - start, 'ms');
    console.log(`${(size * 8) / ((end - start) / 1000)} Mb/s`);

    return end - start;
  } catch (error) {
    console.error('Error downloading the file:', error);
    return -1;
  }
}

async function main() {
  for (let i = 1; i <= 10; i++) {
    await measureRTT(URL);
  }
}

main();