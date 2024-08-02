// Open and connect input socket
let socket = io("/output");

// Listen for confirmation of connection
socket.on("connect", function() {
  console.log("Connected");
});

// Keep track of tag pairings
let pairs = [[0,1], [2,3], [4,5]];

// Keep track of users
let tags = {};
let users = {};

// Reference point
let base = 1;


const PITCH_DELAY = 1000;
const ANGLE_MIN = 30;
const ANGLE_MAX = 180;
const OFFSET = 0;

// Create new users
function createUsers() {
  for(let pair of pairs) {
    let left = pair[0];
    let right = pair[1];
    let user = new User(left, right);
    users[left] = user;
    users[right]
  }
}

function scaleXY(value) {
  return value/10;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  rectMode(CENTER);
  textAlign(LEFT, TOP);
  strokeCap(PROJECT);

  socket.on("pozyx", function(message) {
    let id = message.id;
    let x = scaleXY(message.x);
    let y = scaleXY(message.x);
    console.log(id, x, y);

    let user = users[id];
    user.update(id, { x : x, y : y });
  });
}



function draw() {
  background("black");
  for (let u in users) {
    let user = users[u];
    user.run();
  }

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
    this.bat = -1;
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
    // Manipulate playback rate of sound file
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
    // Re-broadcast out orientation changes
    if (this.src == "board") {
      socket.emit("orientation", {
        idx: this.idx,
        o: this.o,
        off: this.offset
      });
    }

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



  update(o, t) {
    this.updatePitch(o);
  }

  display() {
    let count = 0;
    let pair = [];
    for (let id in tags) {
      let tag = tags[id];
      let x = tag.x;
      let y = tag.y;
      stroke('black');
      fill('black');
      text(tag.id, tag.x, tag.y);
      fill(count == 0 ? 'red' : 'blue');
      pair[count] = {
        x: x,
        y: y
      };
      push();
      translate(x,y);
      noStroke();
      ellipse(0, 0, 30, 30);
      pop();
      count++;
    }
    if (pair.length > 1) {
      stroke(0);
      line(pair[0].x, pair[0].y, pair[1].x, pair[1].y)

      let ox = (pair[0].x - pair[1].x);
      let oy = (pair[0].y - pair[1].y);

      o = createVector(ox, oy).heading();
      push();
      translate(pair[0].x, pair[0].y);
      rotate(o-PI/4);
      strokeWeight(3);
      line(0, 0, 30, 30);
      pop();
      o-=PI;
      updateRate();
  }
}
