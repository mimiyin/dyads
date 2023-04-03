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
const O_MARGIN = 0.01;

// Make DO the new North
const OFFSETS = {
  1: 0,
  2: 0
};
// Pitches for Rhythm
const RATES = {
  1: 0.83333,
  2: 1
};

// Mode
let mode = 1;
let onlySetRate = 0;
let onlySetLevel = 0;
let start = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  rectMode(CENTER);
  textAlign(LEFT, TOP);
  strokeCap(PROJECT);

  socket.on("idx", function(idx) {
    users[idx] = new User(idx);
    console.log("idx joined: ", users);
  });

  // Listen for new data
  socket.on("orientation", function(message) {
    let idx = message.idx;
    let o = message.o;

    if (!(idx in users)) users[idx] = new User(idx);
    let user = users[idx];
    user.updateOrientation(o);
  });

  // Listen for new data
  socket.on("level", function(message) {
    let idx = message.idx;
    let l = message.l;

    if (!(idx in users)) users[idx] = new User(idx);
    let user = users[idx];
    user.updateLevel(l);
  });

  // Remove disconnected users
  socket.on("disconnect", function(id) {
    delete users[id];
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
  text('(S)tart/(S)top + \t(V/B)ase: ' + base + '\tMode(123): ' + mode + '\tOnly set (r)ate: ' + onlySetRate + '\tOnly set (l)evel: ' + onlySetLevel, 100, 20);
}

class User {
  constructor(idx) {
    console.log("idx", idx);
    let x = width * (idx > 1 ? 0.67 : 0.34);
    let y = height / 2;
    this.loc = createVector(x, y);
    this.diam = 100;
    this.pl = 90;
    this.pr = 1;
    this.o = 0;
    this.po = 0;
    this.offset = OFFSETS[idx];
    this.a = createVector(1, 0);
    this.idx = idx;
    this.base = base;
    this.interval = -1;
    this.rate = 1;
    this.prate = 0;
    this.go = true;
    this.r_timeout = null;
    this.l_timeout = null;
    this.resetted = false;
  }

  run() {
    this.display();
  }

  init() {
    this.interval = -1;
    this.rate = -1;
    this.setBase();
  }

  resetOrientation() {
    console.log("RESET TO: ", this.o);
    // Boink it again
    this.resetO = true;
    this.updateOrientation(this.o);
  }

  setBase() {
    console.log("RE-BASE TO: ", base);
    this.base = base;
    this.resetOrientation();
  }

  setNorth() {

    console.log("CALIBRATE TO: ", this.o);

    // This is new offset
    this.offset = this.o;

    // Reset pitch
    this.setBase();
  }

  setRate(rate) {
    socket.emit("rate", {
      idx: this.idx,
      rate: rate
    });
  }

  mapRate(o) {
    // Map pitch
    // Reverse direction
    let r = map(o, 0, 360, 2, 1);

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

    // Remap orientation
    o = map(o, -180, 180, 0, 360);

    // Store the current o
    this.o = o;

    //console.log("OFF", round(o), this.offset);
    // Re-center orientation
    o -= this.offset + O_MARGIN;
    console.log("UPDATE OFFSET: ", this.offset);

    // Wrap around
    if (o < 0) {
      o = 360 + o;
    }

    // Remember for next time
    this.po = o;

    // Calibrated?
    if (this.resetO) {

      let r = this.mapRate(o);

      // Calculate rate
      this.rate = this.base * r;

      // Remember for next time
      this.pr = r;

      // Set it back
      this.resetO = false;

      //console.log("RESET DEBUG: ", this.rate, this.pr, this.po, this.a);

      return true;
    }

    // Calculate change in orientation
    let b = createVector(cos(o), sin(o));
    let ab = b.angleBetween(this.a);
    this.a = b;

    // Ignore minor changes
    if (abs(ab) < 0.0175) {
      //console.log("Did not rotate enough.");
      return false;
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
      console.log("Did not change notes.");
      return false;
    }

    // New note
    //console.log("NEW NOTE");
    // Calculate crossed
    // Going left and...
    let crossedCCW = dir < 0 && r > this.pr;
    let crossedCW = dir > 0 && r < this.pr;

    if (crossedCCW || crossedCW) console.log("Crossed DO.");
    if (crossedCCW) this.base /= 2;
    else if (crossedCW) this.base *= 2;

    // cross CCW
    // true, true, 2, 1
    //console.log("CROSSED", r, this.pr, crossedCCW, crossedCW);

    // Remember for next time
    this.pr = r;

    // Calculate rate
    this.rate = this.base * r;
    console.log("BASE | RATE: ", nfs(this.base, 0, 2), nfs(this.rate, 0, 2), nfs(o, 0, 2));

    if (abs(this.rate - this.prate) < 0.01) return false;

    // Remember rate for next time
    this.prate = this.rate;

    return true;
  }

  updateOrientation(o) {
    let updatedRate = this.updateRate(o);

    // Updated Rate
    if (updatedRate) {
      console.log("New note: ", nfs(this.rate, 0, 2));
      //clearTimeout(this.timeout);
      // Play interval in 1 second
      this.r_timeout = setTimeout(() => {
        console.log("EMITTING RATE: ", nfs(this.rate, 0, 2));
        this.setRate(this.rate);
      }, PITCH_DELAY);
    }

  }

  updateInterval(l) {

    // Re-map level
    // -90 to -180, 180 to 90 --> -180 to 0
    // 90 to -90 --> 0 to 180
    // Toes --> Hips
    if (l < -90 && l >= -180) l = map(l, -90, -180, -180, -90)
    // Head --> Hips
    else if (l >= 90 && l < 180) l = map(l, 180, 90, -90, 0);
    // Backside
    else l = map(l, 90, -90, 0, 180);
    // Remove the sign
    l = abs(l);

    l = map(l, 180, 0, 0, 180);
    l = constrain(l, 0, 180);
    let q = map(l, ANGLE_MIN, ANGLE_MAX, 0, quanta);
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
    //console.log("CALC: " + interval_max, quanta);

    return true;
  }

  updateLevel(l) {
    //if(frameCount%30 !== 1) return;

    let updatedInterval = this.updateInterval(l);

    // Updated Interval
    if (updatedInterval) {
      console.log("New interval: ", this.interval);
      console.log("EMITTING INTERVAL: ", this.interval);
      socket.emit("interval", {
        idx: this.idx,
        interval: this.interval
      });
      // Don't double-dip if the level changes too quickly
      // clearTimeout(this.l_timeout);
      // this.l_timeout = setTimeout(() => {
      //   console.log("EMITTING INTERVAL: ", this.interval);
      //   socket.emit("interval", {
      //     idx: this.idx,
      //     interval: this.interval
      //   });
      // }, 100);
    }
  }

  update(o, l) {
    this.updateOrientation(o);
    this.updateLevel(l);
  }

  display() {
    fill("red");
    ellipse(this.loc.x, this.loc.y, this.diam, this.diam);
  }
}

function keyPressed() {

  switch (keyCode) {
    case RIGHT_ARROW:
      users[1].move(1);
      break;
    case LEFT_ARROW:
      users[1].move(-1);
      break;
    case UP_ARROW:
      users[2].move(1);
      break;
    case RIGHT_ARROW:
      users[2].move(-1);
      break;
  }

  switch (key) {
    case 'b':
      base *= 2;
      for (let u in users) {
        let user = users[u];
        user.setBase();
      }
      break;
    case 'v':
      base /= 2;
      for (let u in users) {
        let user = users[u];
        user.setBase();
      }
      break;
  }



  // Assign a mode
  if (key == '1' || key == '2' || key == '3') {
    mode = key;
    socket.emit('mode', key);
    changeMode();
  } else if (key == 's') {
    start = !start;
    socket.emit(start ? 'stop' : 'start');
  }
}

function changeMode() {
  switch (mode) {
    case '1':
      onlySetRate = 1;
      onlySetLevel = 0;
      break;
    case '2':
      onlySetRate = 1;
      onlySetLevel = 0;
      // for (let u in users) {
      //   let user = users[u];
      //   user.init();
      // }
      break;
    case '3':
      onlySetRate = 0;
      onlySetLevel = 1;
      interval_max = 3;
      quanta = 16;
      for (let u in users) {
        let user = users[u];
        user.setRate(RATES[u]);
      }
      break;
  }
}
