import express = require('express');
// import multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

const MB: number = 1024 * 1024;

//For download speed testing///////////////////////////////////////////////////////// {
const testFile1 = Buffer.alloc(1 * MB, 'x');
const testFile10 = Buffer.alloc(10 * MB, 'x');
const testFile100 = Buffer.alloc(100 * MB, 'x');
const testFile1000 = Buffer.alloc(1000 * MB, 'x');


app.get('/download1', (req, res) => {
    console.log('Download request received');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', testFile1.length.toString());
    res.setHeader('Content-Disposition', 'attachment; filename="speed_test_file.bin"');
    res.send(testFile1);
});
app.get('/download10', (req, res) => {
  console.log('Download request received');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', testFile10.length.toString());
  res.setHeader('Content-Disposition', 'attachment; filename="speed_test_file.bin"');
  res.send(testFile10);
});
app.get('/download100', (req, res) => {
  console.log('Download request received');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', testFile100.length.toString());
  res.setHeader('Content-Disposition', 'attachment; filename="speed_test_file.bin"');
  res.send(testFile100);
});
app.get('/download1000', (req, res) => {
  console.log('Download request received');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', testFile1000.length.toString());
  res.setHeader('Content-Disposition', 'attachment; filename="speed_test_file.bin"');
  res.send(testFile1000);
});
///////////////////////////////////////////////////////////////////////////////////////// }



// const upload = multer({ dest: 'uploads/' });

// // Route for handling single file uploads
// app.post('/upload', upload.single('file'), (req, res) => {
//   // 'file' refers to the name of the form field in the client
//   if (!req.file) {
//     return res.status(400).send('No file uploaded.');
//   }

//   // File details are available in req.file
//   console.log(req.file);
//   res.send(`File uploaded: ${req.file.originalname}`);
// });

// app.listen(3000, () => {
//   console.log('Server is running on http://localhost:3000');
// });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
