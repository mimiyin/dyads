// Create server
const PORT = process.env.PORT || 8001;

// Get SSL stuff
// const fs = require('fs');
// const key = fs.readFileSync('./key.pem');
// const cert = fs.readFileSync('./cert.pem');

const express = require('express');
const app = express();

// Make a web application server!
let server = require('http').createServer(app).listen(PORT, function () {
  console.log('Server listening at port: ', PORT);
});

// Create socket server
let io = require('socket.io')(server, {
  cors: {
    origin: true
  },
  allowEIO3: true
});

// Tell server where to look for files
app.use(express.static('public'));

// Listen for output clients to connect
io.on('connection', function(socket){
  console.log('A player or board client connected: ' + socket.id);

  // Listen for this output client to disconnect
  socket.on('disconnect', function() {
    console.log("A player or board client has disconnected " + socket.id);
  });
});

// Clients in the input namespace
let inputs = io.of('/input');

// Clients in the output namespace
let outputs = io.of('/output');

// Listen for input clients to connect
inputs.on('connection', function(socket){
  console.log('An input client connected: ' + socket.id);

  // Listen for id
  socket.on('idx', function(idx) {
    console.log("idx", idx);
    socket.idx = idx;
    outputs.emit('idx', socket.idx);
  });

  // Listen for orientation data
  socket.on('touch', function(message) {
    // Data comes in as whatever was sent, including objects
    console.log("Received touch: " + message.idx, message.id);

    // Send it to all of the output clients
    outputs.emit('touch', message);
  });

  // Listen for orientation data
  socket.on('untouch', function(message) {
    // Data comes in as whatever was sent, including objects
    console.log("Received untouch: " + message.idx, message.id);

    // Send it to all of the output clients
    outputs.emit('untouch', message);
  });

  // Listen for this input client to disconnect
  // Tell all of the output clients this client disconnected
  socket.on('disconnect', function() {
    console.log("An input client has disconnected " + socket.id);
    io.emit('disconnected', socket.side);
  });
});

// Listen for input clients to connect
outputs.on('connection', function(socket){
  console.log('An output client connected: ' + socket.id);

  // Listen for this input client to disconnect
  // Tell all of the output clients this client disconnected
  socket.on('disconnect', function() {
    console.log("An output client has disconnected " + socket.id);
    io.emit('disconnected', socket.side);
  });
});
