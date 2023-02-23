// Open and connect input socket
let socket = io("/output");

// Listen for confirmation of connection
socket.on("connect", function () {
  console.log("Connected");
});

// Keep track of users
let users = {};

// Reference point
let base = 1;

// Intervals
const INTERVAL_MIN = 30;
const INTERVAL_MAX = 3 * 60;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  strokeCap(PROJECT);

  socket.on("idx", function (idx) {
    users[idx] = new User(idx);
    console.log("idx joined: ", users);
  });

  // Listen for new data
  socket.on("orientation", function (message) {
    let idx = message.idx;
    let o = message.orientation;

    let user = users[idx];
    if (user) user.updateOrientation(o);
  });

  // Listen for new data
  socket.on("level", function (message) {
    let idx = message.idx;
    let l = message.level;

    let user = users[idx];
    if (user) user.updateLevel(l);
  });

  // Remove disconnected users
  socket.on("disconnect", function (id) {
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
  text('Only change (r)ate: ' + onlyChangeRate,  100, 20);
}

class User {
  constructor(idx) {
    console.log("idx", idx);
    let x = width * (idx > 0 ? 0.67 : 0.34);
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
    console.log("TURNED");

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
    console.log("NEW NOTE");

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
    let interval = map(l, 0, 180, INTERVAL_MIN, INTERVAL_MAX);
    // Snap to closes 30 frames
    // interval /= INTERVAL_MIN;
    // interval = round(interval);
    // interval *= INTERVAL_MIN;

    // Ignore small changes
    if (abs(interval - this.interval) < INTERVAL_MIN) return false;

    // Remember for next time
    this.interval = interval;
    return true;
  }

  updateOrientation(o) {
    let updatedRate = this.updateRate(o);

    // Updated Rate
    if (updatedRate) {
      console.log("New note: ", this.rate);
      socket.emit("rate", { idx : this.idx, rate: this.rate });
    }

  }

  updateLevel(l) {
    let updatedInterval = this.updateInterval(l);

    // Updated Interval
    if (updatedInterval) {
      console.log("New interval: ", this.interval);
      socket.emit("interval", { idx : this.idx, interval: this.interval });
    }
  }

  update(o,l) {
    this.updateOrientation(o);
    this.updateLevel(l);
  }

  display() {
    fill("red");
    ellipse(this.loc.x, this.loc.y, this.diam, this.diam);
  }
}

let onlyChangeRate = true;
function keyPressed() {
  switch(key) {
    case 'r':
      onlyChangeRate = !onlyChangeRate;
      socket.emit('only change rate', onlyChangeRate);
      break;
  }


}
