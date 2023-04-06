// Asking for permision for motion sensors on iOS 13+ devices
// if (typeof DeviceOrientationEvent.requestPermission === "function") {
//   document.body.addEventListener("click", function() {
//     DeviceOrientationEvent.requestPermission();
//     DeviceMotionEvent.requestPermission();
//   });
// }

// Get orientation
let rotZ = 0;
let rotX = 0;

// Open and connect input socket
let socket = io("/input");
let idx = 0;

// Start off with pitch only
let onlySetRate = true;
let onlySetTilt = false;

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
    if (onlySetRate) onlySetTilt = 0;
  });

  // Listen for turning off orientation
  socket.on('only set tilt', function(data) {
    console.log("ONLY SET TILT", data);
    onlySetTilt = data;
    if (onlySetTilt) onlySetRate = 0;
  });
}

function draw() {
  // Draw Scale
  background(0);

  // Draw from the center
  translate(width / 2, height / 2);

  // Draw all the notes in the diatonic scale

  // Re-orient to top
  rotZ = rotationZ;
  rotX = rotationX + 90;

  push();
  rotate(rotZ);
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

  // Draw tilt line
  push();
  rotate(rotationX);
  stroke(onlySetTilt ? "yellow" : "orange");
  strokeWeight(20);
  line(0, 0, diag / 2, 0);
  pop();

  // Draw the orientation line
  push();
  stroke(onlySetRate ? "red" : "blue");
  strokeWeight(20);
  line(0, 0, 0, -diag / 2);

  // Send my pitch data
  if (!onlySetTilt) {
    socket.emit("orientation", {
      idx: idx,
      o: 360-rotZ
    });
  }

  // Send level data
  if (!onlySetRate) {
    socket.emit("tilt", {
      idx: idx,
      t: rotX
    });
  }
  pop();
}
