// Get orientation
let rotZ = 0;
let rotX = 180;
// Current angle
let a = 0;

// Open and connect input socket
let socket = io("/input");
let idx = 0;

// Start off with pitch only
let onlySetRate = true;
let onlySetLevel = false;

// Listen for confirmation of connection
socket.on("connect", function() {
  console.log("Connected");

  // Get userid
  let params = new URL(document.location).searchParams;
  idx = params.get("idx") || 0;
  console.log("IDX", idx);

  // Tell me which side I am
  socket.emit("idx", idx);
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  strokeCap(PROJECT);

  // Calculate length of diagonal of screen
  diag = sqrt(sq(width) + sq(height));

  // Lower framerate
  frameRate(30);

  // Listen for turning off level
  socket.on('only set rate', function(data) {
    console.log("ONLY SET RATE", data);
    onlySetRate = data;
    if (onlySetRate) onlySetLevel = 0;
  });

  // Listen for turning off orientation
  socket.on('only set level', function(data) {
    console.log("ONLY SET LEVEL", data);
    onlySetLevel = data;
    if (onlySetLevel) onlySetRate = 0;
  });
}

function draw() {
  // Draw Scale
  background(0);

  // Draw from the center
  translate(width / 2, height / 2);
  rotate(180);

  // Draw all the notes in the diatonic scale

  push();
  for (let r = 0; r < ratios.length; r++) {
    let rat = ratios[r];
    let angle = map(rat.num / rat.den, 1, 2, -90, 270);
    strokeWeight(25 - (rat.num + rat.den));
    push();
    if (angle == -90) stroke("green");
    else stroke(255, 32);
    rotate(angle);
    line(0, 0, diag / 2, 0);
    pop();
  }
  pop();

  push();
  rotate(rotX);
  stroke(onlySetLevel ? "yellow" : "orange");
  strokeWeight(20);
  line(0, 0, 0, -diag / 2);
  pop();

  push();
  rotate(rotZ);
  stroke(onlySetRate ? "red" : "blue");
  strokeWeight(20);
  line(0, 0, 0, -diag / 2);
  pop();
}

function emitOrientation() {
  console.log("O", rotZ);
  // Send my pitch data
  if (!onlySetLevel) {
    socket.emit("orientation", {
      idx: idx,
      o: 360-rotZ
    });
  }
}

function emitLevel() {
  console.log("L", rotX, onlySetRate);
  // Send level data
  if (!onlySetRate) {
    socket.emit("level", {
      idx: idx,
      l: (450-rotX)%360
    });
  }
}

function keyPressed() {
  let sendO = false;
  let sendL = false;
  switch (keyCode) {
    case RIGHT_ARROW:
      a++;
      sendO = true;
      break;
    case LEFT_ARROW:
      a--;
      sendO = true;
      break;
    case UP_ARROW:
      rotX -= 10;
      sendL = true;
      break;
    case DOWN_ARROW:
      rotX += 10;
      sendL = true;
      break;
  }
  if (sendO) {
    if (a < 0) a = angles.length - 1;
    else if (a > angles.length - 1) a = 0;
    rotZ = angles[a];
    emitOrientation();
  }
  if (sendL) {
    if (rotX < 0) rotX = 360 + rotX;
    else if (rotX > 360) rotX = rotX - 360;
    emitLevel();
  }
}
