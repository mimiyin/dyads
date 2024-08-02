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
let io = require('socket.io')(server);

// Listen for output clients to connect
io.on('connection', function(socket) {
  console.log('Pozyx connected: ' + socket.id);

  socket.on('pozyx', function(message) {
    outputs.emit('pozyx', message);
  });


  // Listen for this output client to disconnect
  socket.on('disconnect', function() {
    console.log("Pozyx disconnected " + socket.id);
  });
});


// Clients in the output namespace
let outputs = io.of('/output');

// Listen for input clients to connect
outputs.on('connection', function(socket) {
  console.log('An output client connected: ' + socket.id);
  console.log('Mode', mode);

  // Sync up mode
  update_mode(mode);

  // Listen for orientation data
  socket.on('orientation', function(message) {
    controls.emit('orientation', message);
  });

  // Listen for rate data
  socket.on('rate', function(message) {
    // Data comes in as whatever was sent, including objects
    //console.log("Received: 'message' " + message.idx, message.rate);

    // Send it to all of the output clients
    io.emit('rate', message);
  });

  // Listen for interval data
  socket.on('interval', function(message) {

    // Data comes in as whatever was sent, including objects
    //console.log("Received interval: " + message.interval);

    // Send it to all of the player clients
    io.emit('interval', message);
  });

  // Tell player mode has changed
  socket.on('mode', function(data) {
    console.log("Mode:", data);

    // Tell inputs what data to send
    update_mode(data);
  });

  // Start recording
  socket.on('record', function(data) {
    io.emit('record', data);
  });

  // Start the music
  socket.on('start', function(data) {
    io.emit('start', data);
  });

  // Listen for this input client to disconnect
  // Tell all of the output clients this client disconnected
  socket.on('disconnect', function() {
    console.log("An output client has disconnected " + socket.id);
  });
});

// Tell inputs what data to send
function update_mode(data) {

  console.log("Changed mode: ", data);

  // Store the mode
  mode = data;

  // Tell player and board clients about mode
  io.emit('mode', mode);
  // Tell output about mode
  outputs.emit('mode', mode);

  let only_set_rate = 0;
  let only_set_interval = 0;

  switch (mode) {
    case '1':
      only_set_rate = 1;
      only_set_interval = 0;
      break;
    case '2':
      only_set_rate = 0;
      only_set_interval = 0;
      break;
    case '3':
      only_set_rate = 0;
      only_set_interval = 1;
      break;
  }

  io.emit('only set rate', only_set_rate);
  io.emit('only set interval', only_set_interval);
  controls.emit('only set rate', only_set_rate);
  controls.emit('only set interval', only_set_interval);
}

function print_data(label, src, idx, dataObj, data) {
  // Just to print out o data
  let id = src + '-' + idx;
  dataObj[id] = data;
  let str = label + ' ';
  Object.keys(dataObj).forEach(key => {
    str += key + ' ' + dataObj[key] + '\t';
  });
  console.log(str);
}
