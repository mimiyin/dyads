// Open and connect socket
let socket = io();
let tags = {};


// Remembering where we are
let o = 0;
let po = 0;
let a;
let pr = 1;
let rate = 1;
let prate = 1;

// Track tags
let tags2MoversLookup = {
  0 : 'A',
  1 : 'A',
  2 : 'B',
  3 : 'B'
}

let movers = {};

// Locales
let notes = [];

const RAD = 50;

// Listen for when the socket connects
socket.on('connect', function() {
  // Log a success message
  console.log("HEY I'VE CONNECTED");
});

function setup() {
  createCanvas(windowWidth, windowHeight);

  osc  = new p5.Oscillator("sine", 440);
  osc.amp(0);

  notes.push(new Note(random(width), random(height), PI/2, 1));
  //notes.push(new Note(random(width), random(height), PI/4, 1));

  movers['A'] = new Mover(0, 1),
  //movers['B'] = new Mover(2, 3),

  // Listen for data coming from the server
  socket.on('pozyx', function(message) {
    // Log the data
    //console.log('Received message: ', message);
    // Draw a circle at the y-position of the other user
    let tag = message[0];
    let data = tag.data;
    let id = tag.tagId;
    let ts = tag.ts;
    if(data) {
      if(data.coordinates) {
        let x = data.coordinates.x / 10;
        let y = data.coordinates.y / 10;

        //console.log(id, x, y);
        let m = tags2MoversLookup[id] || null;
        if(m) movers[m].update(id, ts, x, y);
      }
    }
  });

  textSize(10);
  textAlign(RIGHT, BOTTOM);

  a = createVector(0, 1);

  //osc = new p5.Oscillator('sine');
}

function draw() {
  background(255);

  // Show the notes.
  for(let note of notes) note.display();

  for(let m in movers) {
    let mover = movers[m];
    mover.run();
  }

}

let idx = 0;
let osc;

let active = false;
function mousePressed() {
  movers['A'].update(idx, mouseX, mouseY, Date.now());
  idx++;
  idx%=2;
  if(active) return;
  osc.amp(0);
  osc.start();
  osc.amp(1);
  active = true;
  //active = true;
  // vol = audioCtx.createGain();
  // osc.connect(vol);
  // vol.connect(audioCtx.destination);


  // osc.freq(440);
  // osc.amp(1);
  // osc.start();
}

function mouseReleased() {
  //vol.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 5);
  osc.amp(0, 2);
}
