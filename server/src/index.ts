import express from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MB: number = 1024 * 1024;

//For download speed testing///////////////////////////////////////////////////////// {
const testFile1MB = Buffer.alloc(1 * MB, 'x');
const testFile10MB = Buffer.alloc(10 * MB, 'x');
const testFile100MB = Buffer.alloc(100 * MB, 'x');
const testFile1000MB = Buffer.alloc(1000 * MB, 'x');

app.get('/download', (req, res) => {
  try{
    const size = parseInt(req.query.size as string, 10);

    let testFile;
    if (size === 1) {
      testFile = testFile1MB;
    } else if (size === 10) {
      testFile = testFile10MB;
    } else if (size === 100) {
      testFile = testFile100MB;
    } else if (size === 1000) {
      testFile = testFile1000MB;
    } else {
      throw new Error('Invalid size parameter');
    }

    console.log(`Download request received for ${size} MB file`);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', testFile.length.toString());
    // res.setHeader('Content-Disposition', 'attachment; filename="speed_test_file.bin"');
    
    res.send(testFile);

  }catch(e){
    res.status(400).json({ message: 'Invalid size parameter' });
  }
  
});
///////////////////////////////////////////////////////////////////////////////////////// }

//For upload speed testing///////////////////////////////////////////////////////// {
app.use('/upload', express.raw({ type: 'application/octet-stream', limit: '1000mb' }));

app.post('/upload', (req ,res) => {
  try{
    const receivedBuffer = req.body as Buffer;

    // console.log('Buffer received:', receivedBuffer);
    console.log('Uploaded buffer length from client (MB):', receivedBuffer.length/MB);

    res.status(200).json({ message: 'Buffer received successfully'});
  }catch(e){
    res.status(400).json({ message: 'Invalid buffer received' });
  }

});
///////////////////////////////////////////////////////////////////////////////////////// }

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
