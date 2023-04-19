// Open and connect input socket
let socket = io("/output");

// Listen for confirmation of connection
socket.on("connect", function() {
  console.log("Connected");

  // Sync mode
  socket.on('mode', function(_mode) {
    console.log("MODE: ", mode)
    mode = _mode;
    changeMode();
  });
});

// Keep track of users
let users = {};

// Reference point
let base = 1;

// Intervals
let interval_max = 3;
let quanta = 2; // 2 or 8

const PITCH_DELAY = 1000;
const ANGLE_MIN = 30;
const ANGLE_MAX = 180;
const INTERVAL_MIN = 0.375
const OFFSETS = {
  'board/1': 240,
  'board/2': 285,
  'control/1': 0,
  'control/2': 0
};
// Pitches for Rhythm
const RATES = {
  'board/1': 0.83333,
  'board/2': 1
};

// Mode
let mode = 1;
let onlySetRate = 0;
let onlySetInterval = 0;
let start = false;
let record = false;
let source = "control";

// Battery data
let bat = 0;

// Create new users
function createId(idx, src) {
  return src + '/' + idx;
}

function getOrCreate(idx, src) {
  let id = createId(idx, src);
  if (!(id in users)) users[id] = new User(idx, src);
  return users[id];
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  rectMode(CENTER);
  textAlign(LEFT, TOP);
  strokeCap(PROJECT);

  socket.on("idx", function(message) {
    let idx = message.idx;
    let src = message.src;
    getOrCreate(idx, src);
    console.log('User ' + idx + ' joined.', idx);
  });

  // Listen for new orientation data
  socket.on("orientation", function(message) {
    let idx = message.idx;
    let o = message.o;
    let src = message.src;

    // Nevermind if not on the right source
    if (source !== src) return;

    let user = getOrCreate(idx, src);
    user.updatePitch(o);
  });

  // Listen for new tilt data
  socket.on("tilt", function(message) {
    let idx = message.idx;
    let t = message.t;
    let src = message.src;

    // Nevermind if not on the right source
    if (source !== src) return;

    let user = getOrCreate(idx, src);
    user.updateTempo(t);
  });

  // Listen for battery
  socket.on("bat", function(_bat) {
    bat = _bat;
  })

  // Remove disconnected users
  socket.on("disconnect", function(message) {
    delete users[createId(message.idx, message.src)];
  });
}



function draw() {
  background("black");
  for (let u in users) {
    let user = users[u];
    user.run();
  }

  // Change rate
  textSize(16);
  fill(255);
  let st = start ? "(S)tarted" : "(S)topped";
  let rec = record? "(R)ec" : "!(R)ec";
  text('Power: ' + bat + '\t' + st + '\t' + rec + '\t(X/C)Source: ' + source + '\t(V/B)ase: ' + base + '\tMode(123): ' + mode + '\tOnly rate: ' + onlySetRate + '\tOnly interval: ' + onlySetInterval, 10, 20);
}

class User {
  constructor(idx, src) {

    this.id = createId(idx, src);
    this.idx = idx;
    this.src = src;
    let x = width * idx * 0.34;
    let y = height * (this.src == 'board' ? 0.34 : 0.67);
    this.loc = createVector(x, y);
    this.diam = 100;
    this.init();

    console.log("New user: " + this.id);
  }

  run() {
    this.display();
  }

  init() {

    // Orientations
    this.o = 0;
    this.offset = OFFSETS[this.id];

    // Starting vector is 270-degrees
    this.po = 270;
    this.a = createVector(-1, 0);

    // Rates
    this.rate = 1;
    this.prate = 0;
    this.pr = 0;
    this.base = base;

    this.r_timeout = null;

    //this.setBase();

    // Level stuff
    this.interval = -1;
  }

  // Need this to replay note when there's no change.
  resetOrientation() {
    console.log("RESET TO: ", this.o);
    // Boink it again
    this.reset_o = true;
    this.updatePitch(this.o);
  }

  setBase(_base) {
    console.log("RE-BASE TO: ", _base);
    this.base = _base;
    this.resetOrientation();
  }

  setRate(rate) {
    socket.emit("rate", {
      idx: this.idx,
      rate: rate
    });
  }

  mapRate(o) {
    // Map pitch
    let r = map(o, 0, 360, 1, 2);

    // Snap to closest diatonic note
    let closest = 10;
    let nr = r;
    for (let ratio of ratios) {
      let _r = ratio.num / ratio.den;
      let dr = abs(r - _r);
      if (dr < closest) {
        nr = _r;
        closest = dr;
      }
    }
    // Snap to closest r
    return nr;
  }

  updateRate(o) {

    // Store the current o
    this.o = o;

    //console.log("OFF", round(o), this.offset);

    // Re-center orientation
    o -= this.offset;

    // Remap orientation from board
    if (this.src == 'board') o = map(o, -180, 180, 360, 0);

    // Wrap around
    if (o > 360) o = o - 360;

    // Remember for next time
    this.po = o;

    // Calibrating?
    if (this.reset_o) {
      let r = this.mapRate(o);

      // Calculate rate
      this.rate = this.base * r;

      // Remember for next time
      this.pr = r;

      // Set it back
      this.reset_o = false;

      console.log("Resetting orientation to: ", nfs(o, 0, 2));
      return true;
    }

    // Calculate change in orientation
    let b = createVector(sin(o), cos(o));
    let ab = b.angleBetween(this.a);
    this.a = b;

    // Ignore minor changes
    if (abs(ab) < 0.0175) {
      //console.log("Did not rotate enough.");
      return false;
    }

    // Re-broadcast out orientation changes
    if (this.src == "board") {
      socket.emit("orientation", {
        idx: this.idx,
        o: this.o - OFFSETS[this.id]
      });
    }

    // Shifted
    //console.log("TURNED");

    // Calculate direction
    // -1 is CCW, 1 is CW
    let dir = ab / abs(ab);

    //console.log("DIR", dir, "AB", ab);

    let r = this.mapRate(o);

    // Ignore no change in note
    if (r == this.pr) {
      //console.log("Did not change notes.");
      return false;
    }

    // New note
    //console.log("NEW NOTE");
    // Going right and rate gets lower
    let crossedCW = dir > 0 && r < this.pr;
    // Going left and rate gets higher
    let crossedCCW = dir < 0 && r > this.pr;

    if (crossedCW || crossedCCW) {
      console.log("Crossed DO CW?", this.idx, r, this.pr, o);
      console.log("Crossed DO: ", crossedCW ? 'CW' : 'CCW');
    }
    if (crossedCCW) this.base /= 2;
    else if (crossedCW) this.base *= 2;

    // cross CCW
    // true, true, 2, 1
    //console.log("CROSSED", r, this.pr, crossedCCW, crossedCW);

    // Remember for next time
    this.pr = r;

    // Calculate rate
    this.rate = this.base * r;
    //console.log("BASE | RATE | O ", nfs(this.base, 0, 2), nfs(this.rate, 0, 2), nfs(o, 0, 2));

    if (abs(this.rate - this.prate) < 0.01) return false;

    // Remember rate for next time
    this.prate = this.rate;

    return true;

  }

  updatePitch(o) {
    let updatedRate = this.updateRate(o);

    // Updated Rate
    if (updatedRate) {
      console.log("New rate: ", this.id, nfs(this.rate, 0, 2));

      // Play interval in 1 second
      clearTimeout(this.r_timeout);
      this.r_timeout = setTimeout(() => {
        console.log("Emit rate: ", this.id, nfs(this.rate, 0, 2));
        this.setRate(this.rate);
      }, PITCH_DELAY);
    }

  }

  updateInterval(t) {

    // Re-map tilt
    if (this.src == 'board') {
      // -90 to -180, 180 to 90 --> -180 to 0
      // 90 to -90 --> 0 to 180
      // Toes --> Hips
      if (t < -90 && t >= -180) t = map(t, -90, -180, -180, -90)
      // Head --> Hips
      else if (t >= 90 && t < 180) t = map(t, 180, 90, -90, 0);
      // Backside
      else t = map(t, 90, -90, 0, 180);
      // Remove the sign
      t = abs(t);
    }

    // Reverse, high number is longer interval
    t = map(t, 180, 0, 0, 180);
    t = constrain(t, 0, 180);
    let q = map(t, ANGLE_MIN, ANGLE_MAX, 0, quanta);
    q = floor(q);
    let interval = (q * interval_max) / quanta;

    // Don't go under 0.I 375
    let qsize = interval_max / quanta;
    let bottom = max(qsize, INTERVAL_MIN);
    if (interval < bottom) interval = bottom;

    // Special case for mode 2
    if (mode == 2) interval = 1;

    //console.log("L Q I", l, q, interval);
    //console.log("INTERVAL", interval);

    // // Ignore small changes
    // Since we're bottoming out at 0.375,
    //the last quanta minimum requirement
    //is even smaller from 0.5 --> 0.375
    //instead of 0.5 --> 0.25
    let cutoffChange = abs(qsize - INTERVAL_MIN);
    let minChange = min(qsize, cutoffChange);
    //console.log("MIN", minChange, abs(interval - this.interval));
    if (abs(interval - this.interval) < minChange) return false;
    //console.log("BASE, INTERVAL: ", l, base, interval);

    // Remember for next time
    this.interval = interval;
    return true;
  }

  updateTempo(t) {
    //if(frameCount%30 !== 1) return;

    let updatedInterval = this.updateInterval(t);

    // Updated Interval
    if (updatedInterval) {
      console.log("Emit interval: ", this.id, this.interval);
      socket.emit("interval", {
        idx: this.idx,
        interval: this.interval
      });
    }
  }

  update(o, t) {
    this.updatePitch(o);
    this.updateTempo(t);
  }

  display() {
    fill(this.src == 'board' ? "red" : "green");
    ellipse(this.loc.x, this.loc.y, this.diam, this.diam);
  }
}

function keyPressed() {

  switch (key) {
    case 'b':
      base *= 2;
      for (let u in users) {
        let user = users[u];
        user.setBase(base);
      }
      break;
    case 'v':
      base /= 2;
      for (let u in users) {
        let user = users[u];
        user.setBase(base);
      }
      break;
    case 'c':
      source = "control";
      break;
    case 'x':
      source = "board";
      break;
    case 'r':
      record = !record;
      socket.emit('record', record);
      break;
    case 's':
      start = !start;
      socket.emit('start', start);
      socket.emit('rate', { idx: 1, rate : 1 });
      socket.emit('rate', { idx : 2, rate : 1 });
      break;
  }



  // Assign a mode
  if (key == '1' || key == '2' || key == '3') {
    mode = key;
    socket.emit('mode', key);
    changeMode();
  }
}

function changeMode() {
  switch (mode) {
    case '1':
      onlySetRate = 1;
      onlySetInterval = 0;
      break;
    case '2':
      onlySetRate = 1;
      onlySetInterval = 0;
      break;
    case '3':
      onlySetRate = 0;
      onlySetInterval = 1;
      interval_max = 3;
      quanta = 16;
      for (let u in users) {
        let user = users[u];
        user.setRate(RATES[u]);
      }
      break;
  }
}
