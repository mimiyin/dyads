// Open and connect input socket
let socket = io("/output");

// Listen for confirmation of connection
socket.on("connect", function() {
  console.log("Connected");

  // Sync mode
  socket.on('mode', function(_mode) {
    console.log("MODE: ", mode)
    mode = _mode;
  });
});

// Keep track of users
let users = {};

// Reference point
let base = 1;

// Intervals
let interval_max = 3;
let quanta = 2; // 2 or 8

const RATE_DELAY = 500;
const ANGLE_MIN = 30;
const ANGLE_MAX = 180;

// Mode
let mode = 0;
let onlySetRate = 0;
let onlySetLevel = 0;

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
    let o = message.orientation;

    let user = users[idx];
    if (!user) users[idx] = new User(idx);
    user.updateOrientation(o);
  });

  // Listen for new data
  socket.on("level", function(message) {

    let idx = message.idx;
    let l = message.level;

    let user = users[idx];
    if (!user) users[idx] = new User(idx);
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
  text('Mode(123): ' + mode + '\tOnly set (r)ate: ' + onlySetRate + '\tOnly set (l)evel: ' + onlySetLevel, 100, 20);
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
    this.po = 0;
    this.a = createVector(0, -1);
    this.idx = idx;
    this.base = 1;
    this.interval = 1;
    this.rate = 1;
    this.update(90, 90);
    this.go = true;
    this.timeout = null;
  }

  run() {
    this.display();
  }

  updateRate(o) {
    // Calculate change in orientation
    let b = createVector(cos(o), sin(o));
    let ab = b.angleBetween(this.a);
    this.a = b;

    // Remember for next time
    this.po = o;

    // Ignore minor changes
    if (abs(ab) < 0.0175) return false;

    // Shifted
    //console.log("TURNED");

    // Calculate direction
    // -1 is CCW, 1 is CW
    let dir = ab / abs(ab);

    //console.log("DIR", dir, "AB", ab);

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
    r = nr;

    // Ignore no change in note
    if (r == this.pr) return false;

    // New note
    //console.log("NEW NOTE");

    // Calculate crossed
    // Going left and...
    let crossedCCW = dir < 0 && r > this.pr;
    let crossedCW = dir > 0 && r < this.pr;

    if (crossedCCW) this.base /= 2;
    else if (crossedCW) this.base *= 2;

    // cross CCW
    // true, true, 2, 1
    //console.log("CROSSED", r, this.pr, crossedCCW, crossedCW);

    // Calculate rate
    this.rate = this.base * r;

    // Remember for next time
    this.pr = r;

    return true;
  }

  updateInterval(l) {
    l = constrain(l, 0, 180);
    let q = map(l, ANGLE_MIN, ANGLE_MAX, 0, quanta);
    q = floor(q);
    let interval = (q * interval_max) / quanta;

    // Don't go under 0.25
    if (interval < interval_max / quanta) interval = interval_max / quanta;

    // Special case for mode 2
    if (mode == 2) {
      if (q < 2) interval = 2;
      else interval = 5.75;
    }

    //console.log("L Q I", l, q, interval);

    console.log("INTERVAL", interval);

    // // Ignore small changes
    if (abs(interval - this.interval) < (interval_max / quanta)) return false;
    //console.log("BASE, INTERVAL: ", l, base, interval);

    // Remember for next time
    this.interval = interval;
    //console.log("CALC: " + interval_max, quanta);

    return true;
  }

  updateOrientation(o) {
    let updatedRate = this.updateRate(o);

    // Updated Rate
    if (updatedRate) {
      console.log("New note: ", this.rate);
      //clearTimeout(this.timeout);
      // Play interval in 1 second
      this.timeout = setTimeout(() => {
        console.log("EMITTING: ", this.rate);
        socket.emit("rate", {
          idx: this.idx,
          rate: this.rate
        });
      }, RATE_DELAY);
    }

  }

  updateLevel(l) {
    //if(frameCount%30 !== 1) return;

    let updatedInterval = this.updateInterval(l);

    // Updated Interval
    if (updatedInterval) {
      console.log("New interval: ", this.interval);
      socket.emit("interval", {
        idx: this.idx,
        interval: this.interval
      });
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

  // Assign a mode
  if (key == 1 || key == 2 || key == 3) {
    mode = key;
    socket.emit('mode', key);
  }

  switch (key) {
    case '1':
      onlySetRate = 1;
      onlySetLevel = 0;
      break;
    case '2':
      onlySetRate = 0;
      onlySetLevel = 0;
      interval_max = 5.5;
      quanta = 2;
      break;
    case '3':
      onlySetRate = 0;
      onlySetLevel = 1;
      interval_max = 3;
      quanta = 8;
      break;

  }

}
