// Create server
const PORT = process.env.PORT || 8001;

// Get SSL stuff
// const fs = require('fs');
// const key = fs.readFileSync('./key.pem');
// const cert = fs.readFileSync('./cert.pem');

const express = require('express');
const app = express();

// Tell server where to look for files
app.use(express.static('public'));

// Make a web application server!
// let server = require('https').createServer({
//   key: key,
//   cert: cert
// }, app).listen(PORT, function() {
//   console.log('Server listening at port: ', PORT);
// });

let server = require('http').createServer(app).listen(PORT, function() {
  console.log('Server listening at port: ', PORT);
});

// Create socket server
let io = require('socket.io')(server, {
  cors: {
    origin: true
  },
  allowEIO3: true
});

// Local variables
let mode = 1;
let data_rate = 200;
let sample_rate = 20;

// Listen for output clients to connect
io.on('connection', function(socket) {
  console.log('A player or board client connected: ' + socket.id);

  // Sync up mode
  socket.emit('mode', mode);

  // Set board settings
  socket.emit('set_data_rate', data_rate);
  socket.emit('set_sample_rate', sample_rate);

  // Tell inputs what data to send
  update_mode();

  // Listen for id
  socket.on('idx', function(idx) {
    console.log("idx", idx);
    socket.idx = idx;
    outputs.emit('idx', socket.idx);
  });

  // Listen for orientation data
  socket.on('message', function(message) {
    // Data comes in as whatever was sent, including objects
    //message.o += 180;
    console.log("Received message: " + message.idx, message.yaw);
    //console.log()

    // let o = 0;
    // if(message.pitch > 45 || message.pitch < -45) o = message.roll
    // else o = message.yaw;

    let o_message = {
      idx : message.idx,
      o : message.yaw
    }

    let l_message = {
      idx : message.idx,
      l : message.roll,
    }

    //outputs.emit('message', message);

    // Send it to all of the output clients
    if(mode <= 2) outputs.emit('orientation', o_message);

    // Send it to all of the output clients
    if(mode > 1) outputs.emit('level', l_message);

  });

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
inputs.on('connection', function(socket) {
  console.log('An input client connected: ' + socket.id);

  // Tell inputs what data to send
  update_mode();

  // Listen for id
  socket.on('idx', function(idx) {
    console.log("idx", idx);
    socket.idx = idx;
    outputs.emit('idx', socket.idx);
  });

  // Listen for orientation data
  socket.on('orientation', function(message) {
    // Data comes in as whatever was sent, including objects

    // Send it to all of the output clients
    message.o = message.o - 180;
    console.log("Received orientation: " + message.o);
    outputs.emit('orientation', message);
  });

  // Listen for level data
  socket.on('level', function(message) {
    // Data comes in as whatever was sent, including objects
    //console.log("Received level: " + message.level);

    // Send it to all of the output clients
    message.l = message.l - 180;
    console.log("Received level: " + message.l);
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
outputs.on('connection', function(socket) {
  console.log('An output client connected: ' + socket.id);
  console.log('Mode', mode);

  // Sync up mode
  socket.emit('mode', mode);

  // Listen for orientation data
  socket.on('rate', function(message) {
    // Data comes in as whatever was sent, including objects
    //console.log("Received: 'message' " + message.idx, message.rate);

    // Send it to all of the output clients
    io.emit('rate', message);
  });

  // Listen for orientation data
  socket.on('interval', function(message) {

    // Data comes in as whatever was sent, including objects
    console.log("Received interval: " + message.interval);

    // Send it to all of the player clients
    io.emit('interval', message);
  });

  // Tell player mode has changed
  socket.on('mode', function(data) {
    console.log("Mode:", data);

    // Store the mode
    mode = data;

    // Tell player and board clients about mode
    io.emit('mode', mode);

    // Tell inputs what data to send
    update_mode();
  });

  // Stop the music
  socket.on('stop', function() {
    io.emit('stop');
  });

  // Start the music
  socket.on('start', function() {
    io.emit('start');
  });

  // Listen for this input client to disconnect
  // Tell all of the output clients this client disconnected
  socket.on('disconnect', function() {
    console.log("An output client has disconnected " + socket.id);
    io.emit('disconnected', socket.side);
  });
});

// Tell inputs what data to send
function update_mode() {
  let only_set_rate = 0;
  let only_set_level = 0;

  switch (mode) {
    case '1':
      only_set_rate = 1;
      only_set_level = 0;
      break;
    case '2':
      only_set_rate = 0;
      only_set_level = 0;
      break;
    case '3':
      only_set_rate = 0;
      only_set_level = 1;
      break;
  }

  io.emit('only set rate', only_set_rate);
  io.emit('only set level', only_set_level);
  inputs.emit('only set rate', only_set_rate);
  inputs.emit('only set level', only_set_level);

}
