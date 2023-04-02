// Curve describing the balls dropping in
// Curve describing when to noodle versus go straight

// Curve describing how many layers of rhythm
// Linear positive slope - increases probability of adding a layer of rhythm
// Mostly overlapping extremely long sine waves to shift the rhythms slowly

// User's movement sets off horrific screech

let scales, scale, areas, ratios;
let mult = 1;
let TOTAL_OCTAVES = 5;
let BASE = 110;
let numOctaves = 3;
let ow = 100;
let stepSize = 0.00001;

let keyboard = [];
let balls = [];

let speed = 0;
let diag = 0;

let replay = false;

let record;
let rpdata;
let rp = 0;
let start = 0;

function preload() {
  scales = loadJSON('scales.json');
  record = loadJSON('record.json');
}

let soundOn = false;

let users = {};

// Open and connect input socket
let socket = io("/output");

// Listen for confirmation of connection
socket.on("connect", function() {
  console.log("Connected");
});

// Press a key to enable audio
function mousePressed() {
  if (soundOn) return;
  getAudioContext().resume();
  select('p').remove();
  soundOn = true;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(30);

  scale = scales.scales.chromatic;
  areas = scales.areas;
  ratios = scales.ratios;

  rpdata = record.data;

  diag = sqrt(sq(width) + sq(height));

  reset();
  calcRatios();

  noiseSeed(0);
  randomSeed(0);

  colorMode(HSB, 100);

  // Listen for users connecting
  socket.on('idx', function(idx) {
    users[idx] = {};
  });

  // Remove disconnected users
  socket.on('disconnected', function(idx) {
    delete users[idx];
  });

  // Listen for touches
  socket.on('touch', function(message) {
    let idx = message.idx;
    let touch = message.id;
    if(!users[idx]) users[idx] = {};
    users[idx][touch] = 1;
    console.log(touch, users);
  });

  // Listen for disconnections
  socket.on('untouch', function(message) {
    let idx = message.idx;
    let touch = message.id;
    if(!users[idx]) users[idx] = {};
    users[idx][touch] = -1;
    console.log(users);
  });
}

function reset() {
  ow = width / numOctaves;
}

function draw() {
  background(0);

  // Look for matching touches
  let touches1 = users[1];
  let touches2 = users[2];
  for (let t in touches1) {
    let touch1 = touches1[t];
    let touch2 = touches2[t];
    if(touch1 == 1 && touch2 == 1) {
      addBalls(1);
      // Turn it off
      touches1[t] = 0;
      touches2[t] = 0;
    }
  }


  if (replay) {
    //console.log("REPLAY!");
    if (start + millis() > rpdata[rp].m) {
      addBalls(rpdata[rp].num);
      rp++;
      if (rp >= rpdata.length - 1) replay = false;
    }
  }

  for (let o = 0; o < keyboard.length; o++) {
    let octave = keyboard[o];
    for (let n = 0; n < octave.length; n++) {
      let note = keyboard[o][n];
      note.run(balls);
      updateRelativeNotes(n, note);
    }
  }

  // Update multiplier
  let sum = 0;
  let octave = keyboard[0];
  for (let n = 0; n < octave.length; n++) {
    let note = octave[n];
    sum += note._rh;
  }
  mult = height / sum;

  // Update keyboard
  for (let o = 0; o < keyboard.length; o++) {
    let octave = keyboard[o];
    let y = height;
    for (let n = 0; n < octave.length; n++) {
      let note = keyboard[o][n];
      y -= note._rh * mult;
      note.update(y);
    }
  }

  for (let b = balls.length - 1; b >= 0; b--) {
    let ball = balls[b];
    ball.run();
    if (ball.died()) balls.splice(b, 1);
  }

  // Draw users
  let counter = 0;
  for(let u in users) {
    counter++;
    fill(255, 64);
    ellipse(width - counter*40, 10, 20, 20);
  }

  // Display text
  fill(255);
  noStroke();
  textSize(16);
  text('Press ENTER to release note.', 5, 20);
}

// Paramaters are tonic index and tonic note.
function updateRelativeNotes(t, tn) {
  if (tn.counter <= 0) return;
  // Iterate through ALL the keyboard again for each note.
  for (let o = 0; o < keyboard.length; o++) {
    let octave = keyboard[o];
    for (let n = 0; n < octave.length; n++) {
      let note = keyboard[o][n];
      // Calculate the relative note
      let rn = n >= t ? n - t : (n + (octave.length - 1)) - t;
      let h = (areas[rn] - note.h);
      note.modulate(areas[rn], tn.counter * stepSize);
    }
  }
}

function calcRatios() {
  // Calculate scale of areas based on total height of window
  let sum = 0;
  for (let s = 0; s < scale.length; s++) {
    sum += areas[s];
  }

  mult = height / sum;

  for (let o = 0; o < TOTAL_OCTAVES; o++) {
    keyboard[o] = [];
    let y = height;
    for (let s = 0; s < scale.length; s++) {
      let ratio = ratios[s].n / ratios[s].d;
      let freq = BASE * ratio * pow(2, o);
      let h = areas[s];
      y -= h * mult;
      keyboard[o].push(new Note(freq, o, y, h));
    }
  }


}

// function mouseMoved() {
//   // Don't create new balls if replaying
//   if (replay) return;
//   speed += dist(pmouseX, pmouseY, mouseX, mouseY) / diag;
//   if (speed > 1) {
//     addBalls(speed);
//     speed = 0;
//   }
// }

function addBalls(num) {
  console.log("ADDING BALLS: ", num)
  for (let i = 0; i < num; i++) {
    balls.push(new Ball(random(width), random(height), 20, 20, 0, random(-5, 5), 300 * num));
  }
}

// Manual mode
function keyPressed() {
  if(keyCode == ENTER) addBalls(1);
}
