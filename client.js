const WebSocket = require('ws'); 

const downloadWebSoc = new WebSocket('ws://34.17.87.58:3001'); 
const uploadWebSoc = new WebSocket('ws://34.17.87.58:3002');
// const downloadWebSoc = new WebSocket('ws://localhost:3001'); 
// const uploadWebSoc = new WebSocket('ws://localhost:3002');

let counter = 1;
const KB = 1024;
const timeLimit = 20; // Will be determined by the user
const packetSize = 64 * KB;
const dataBuffer = Buffer.alloc(packetSize, 'x');
const uploadDownloadMBLimit = 100; // Will be determined by the user
let downloadFirstPacketArrival, downloadEnd;



// Download ////////////////////////////////////////////////////////////////////////////////
downloadWebSoc.onopen = () => {
  console.log('Download - Connected to server');
  downloadWebSoc.send(`${uploadDownloadMBLimit}`);
};

const downloadStart = performance.now();
downloadWebSoc.onmessage = () => {
    downloadEnd = performance.now();
    if(counter==1){
        downloadFirstPacketArrival = performance.now();
    }
    if (performance.now() - downloadStart - downloadFirstPacketArrival  > 1000 * timeLimit) {
        downloadWebSoc.terminate();
    }
    // console.log(counter);
    counter++;
};

downloadWebSoc.onclose = () => {
  console.log('Download - Disconnected from server');
  const totalData = (counter * packetSize * 8) / (KB * KB);
  const timeElapsed = (downloadEnd - downloadFirstPacketArrival) / 1000;
  const measuredBandwidth = (totalData / timeElapsed).toFixed(1);      
  console.log(`Download - ${measuredBandwidth} Mbps`);
  counter = 1;
};

downloadWebSoc.onerror = (error) => {
  console.error('Download - WebSocket error:', error);
};
////////////////////////////////////////////////////////////////////////////////////////////


// Upload //////////////////////////////////////////////////////////////////////////////////
uploadWebSoc.onopen = () => {
  console.log('Upload - Connected to server');
  const numPackets = uploadDownloadMBLimit * KB * KB / packetSize;
  uploadWebSoc.send(0); // Send a message to start the timer in the server

  for (let i = 0; i < numPackets; i += 1) {
    uploadWebSoc.send(dataBuffer);
  }
  uploadWebSoc.send(1);
};

uploadWebSoc.onmessage = (message) => {
    console.log(`Upload - ${message.data} Mbps`);
};


uploadWebSoc.onclose = () => {
  // console.log('Disconnected from server');
  // const totalData = (counter * packetSize * 8) / (KB * KB);
  // const timeElapsed = (downloadEnd - downloadFirstPacketArrival) / 1000;
  // const measuredBandwidth = (totalData / timeElapsed).toFixed(1);      
  // console.log(`${measuredBandwidth} Mbps`);
};

uploadWebSoc.onerror = (error) => {
  console.error('Upload - WebSocket error:', error);
};


////////////////////////////////////////////////////////////////////////////////////////////