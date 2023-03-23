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
  },
  allowEIO3: true
});

// Tell server where to look for files
app.use(express.static('public'));

// Listen for output clients to connect
io.on('connection', function(socket){
  console.log('A player or board client connected: ' + socket.id);

  // Listen for id
  socket.on('idx', function(idx) {
    console.log("idx", idx);
    socket.idx = idx;
    outputs.emit('idx', socket.idx);
  });

  // Listen for strike data
    socket.on('strike', function(message) {
      // Data comes in as whatever was sent, including objects
      console.log("Received strike: " + message);

      // Send it to all of the output clients
      outputs.emit('strike', message);
    });

  // Listen for this output client to disconnect
  socket.on('disconnect', function() {
    console.log("A player or board client has disconnected " + socket.id);
  });
});

// Clients in the output namespace
let outputs = io.of('/output');

// Listen for input clients to connect
outputs.on('connection', function(socket){
  console.log('An output client connected: ' + socket.id);

  // Listen for strike data
  socket.on('strike', function(message) {

    console.log('Strike received: ', message.idx, message.word);
    // Send it to all of the player clients
    io.emit('strike', message);
  });

  // Listen for this input client to disconnect
  // Tell all of the output clients this client disconnected
  socket.on('disconnect', function() {
    console.log("An output client has disconnected " + socket.id);
    io.emit('disconnected', socket.side);
  });
});
