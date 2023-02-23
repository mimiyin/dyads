// Create server
const PORT = process.env.PORT || 8001;

// Get SSL stuff
const fs = require('fs');
const key = fs.readFileSync('./key.pem');
const cert = fs.readFileSync('./cert.pem');

const express = require('express');
const app = express();

// Make a web application server!
let server = require('https').createServer({key: key, cert: cert }, app).listen(PORT, function () {
  console.log('Server listening at port: ', PORT);
});

// Create socket server
let io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:" + PORT,
    methods: ["GET", "POST"],
    credentials: false
  }
});

// Tell server where to look for files
app.use(express.static('public'));

// Listen for output clients to connect
io.on('connection', function(socket){
  console.log('A player client connected: ' + socket.id);

  // Listen for this output client to disconnect
  socket.on('disconnect', function() {
    console.log("A player client has disconnected " + socket.id);
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
  socket.on('orientation', function(message) {
    // Data comes in as whatever was sent, including objects
    console.log("Received orientation: " + message.orientation);

    // Send it to all of the output clients
    outputs.emit('orientation', message);
  });

  // Listen for level data
  socket.on('level', function(message) {
    // Data comes in as whatever was sent, including objects
    console.log("Received level: " + message.level);

    // Send it to all of the output clients
    outputs.emit('level', message);
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

  // Listen for orientation data
  socket.on('rate', function(message) {
    // Data comes in as whatever was sent, including objects
    console.log("Received: 'message' " + message.idx, message.rate);

    // Send it to all of the output clients
    io.emit('rate', message);
  });

  // Listen for orientation data
  socket.on('interval', function(message) {
    // Data comes in as whatever was sent, including objects
    //console.log("Received: 'message' " + data);

    // Send it to all of the output clients
    io.emit('interval', message);
  });

  socket.on('only change rate', function(data){
    io.emit('only change rate', data);
  });


  // Listen for this input client to disconnect
  // Tell all of the output clients this client disconnected
  socket.on('disconnect', function() {
    console.log("An output client has disconnected " + socket.id);
    io.emit('disconnected', socket.side);
  });
});
