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
let data_rate = 20;
let sample_rate = 20;

let ohs = {};
let tees = {};

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
  socket.on('idx', function(message) {
    console.log(message.src + '-' + message.idx + ' connected.');
    socket.idx = message.idx;
    outputs.emit('idx', {
      idx : message.idx,
      src: message.src
    });
  });

  // Listen for orientation and tilt data
  socket.on('message', function(message) {
    // Data comes in as whatever was sent, including objects'
    
    // Unpack message
    let idx = message.idx;
    let src = message.src;
    let o = message.o;
    let t = message.t;

    print_data('o', message.src, message.idx, ohs, message.o)
    // print_data('t', message.src, message.idx, tees, message.t)


    // Send it to all of the output clients
    if(mode <= 2) outputs.emit('orientation', {
      idx : idx,
      src : src,
      o : o
    });

    // Send it to all of the output clients
    if(mode > 1) outputs.emit('tilt', {
      idx : idx,
      src : src,
      t : t
    });

    // Send battery data
    outputs.emit('bat', message.bat);
  });

  // Listen for this output client to disconnect
  socket.on('disconnect', function() {
    console.log("A player or board client has disconnected " + socket.id);
  });
});

// Clients in the output namespace
let controls = io.of('/control');

// Listen for output clients to connect
controls.on('connection', function(socket) {
  console.log('A control client connected: ' + socket.id);

  // Sync up mode
  socket.emit('mode', mode);

  // Tell inputs what data to send
  update_mode();

  // Listen for orientation and tilt data
  socket.on('orientation', function(message) {
    // Data comes in as whatever was sent, including objects
    print_data('o', message.src, message.idx, ohs, message.o)

    // Send it to all of the output clients
    outputs.emit('orientation', message);
  });

  // Listen for orientation and tilt data
  socket.on('tilt', function(message) {

    print_data('t', message.src, message.idx, tees, message.t)

    // Send it to all of the output clients
    outputs.emit('tilt', message);

  });

  // Listen for offset adjustments
  socket.on('offset', function(message){
    outputs.emit('offset', message);
  });

  // Listen for this output client to disconnect
  socket.on('disconnect', function() {
    console.log("A control client has disconnected " + socket.id);
  });
});


// Clients in the output namespace
let outputs = io.of('/output');

// Listen for input clients to connect
outputs.on('connection', function(socket) {
  console.log('An output client connected: ' + socket.id);
  console.log('Mode', mode);

  // Sync up mode
  socket.emit('mode', mode);

  // Listen for orientation data
  socket.on('orientation', function(message){
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
      let id= src + '-' + idx;
      dataObj[id] = data;
      let str = label + ' ';
      Object.keys(dataObj).forEach(key=>{ 
        str +=  key + ' ' + dataObj[key] + '\t'; 
      });
      console.log(str);
}
