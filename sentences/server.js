// Create server
const PORT = process.env.PORT || 8001;

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

let data_rate = 10000;
let sample_rate = 20;
let strike_th = 10;

// Listen for output clients to connect
io.on('connection', function(socket){
  console.log('A player or board client connected: ' + socket.id);

  // Set board settings
  socket.emit('set_data_rate', data_rate);
  socket.emit('set_sample_rate', sample_rate);
  socket.emit('set_strike_th', strike_th);

  // Listen for id
  socket.on('idx', function(message) {
    console.log("idx", message.idx);
    socket.idx = message.idx;
    outputs.emit('idx', message);
  });

  // Listen for strike data
  socket.on('message', function(message) {
    console.log("Received data:", message.idx, message.da);

    // Send it to all of the output clients
    if(message.da > strike_th) outputs.emit('strike', message.idx);
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
