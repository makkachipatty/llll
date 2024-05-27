const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs=require("fs")

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

let onlineUsers = 0;

app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('user count', onlineUsers);

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('user count', onlineUsers);
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

app.post('/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    const imageUrl = `/uploads/${req.file.filename}`;
    io.emit('chat image', { username: req.body.username, imageUrl });

    setTimeout(() => {
      const filePath = path.join(__dirname, 'uploads', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Failed to delete file: ${filePath}`, err);
        } else {
          console.log(`Deleted file: ${filePath}`);
        }
      });
    }, 20000); 

    res.json({ imageUrl });
  } else {
    res.status(400).send('No file uploaded');
  }
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
