import axios from 'axios';

const MB= 1024 * 1024;
const URL = 'http://localhost:3000';
const rtts: number[] = [];

//For upload speed testing//////////////////////////////////////////////////////// {
async function upload_file_and_measure_time(size: number): Promise<number>{
    const testFile = Buffer.alloc(size * MB, 'x');
    const start = performance.now();

    await axios.post(`${URL}/upload`, testFile, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      })
      .then(response => {
        const end = performance.now();

        console.log(response.data);
        console.log(`${size}MB : `, end - start, 'ms');
        console.log(`${(size*8) / ((end - start) / 1000)} Mb/s`);

        return end - start;
      })
      .catch(error => {
        console.error('Error uploading the file:', error);
      });

      return -1;
}
///////////////////////////////////////////////////////////////////////////////////// }

//For download speed testing///////////////////////////////////////////////////////// {
async function download_file_and_measure_time(size: number): Promise<number>{
    // TODO: add size check logic 
    const start = performance.now();
    
    axios.get(`${URL}/download`, {
        params: { size }, 
        responseType: 'arraybuffer',
    })
    .then((response) => {
        const end = performance.now();

        console.log(response.data);
        console.log(`${size}MB : `, end - start, 'ms');
        console.log(`${(size * 8) / ((end - start) / 1000)} Mb/s`);

        return end - start;
    })
    .catch((error) => {
        console.error('Error downloading the file:', error);
    });

    return -1;    
}
/////////////////////////////////////////////////////////////////////////////////////// }

// upload_file_and_measure_time(1000)
// download_file_and_measure_time(1000);