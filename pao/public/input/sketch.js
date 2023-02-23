// Asking for permision for motion sensors on iOS 13+ devices
if (typeof DeviceOrientationEvent.requestPermission === "function") {
  document.body.addEventListener("click", function() {
    DeviceOrientationEvent.requestPermission();
    DeviceMotionEvent.requestPermission();
  });
}

// let magSensor = new Magnetometer({frequency: 60});

// magSensor.addEventListener('reading', (e) => {
//   console.log(`Magnetic field along the X-axis ${magSensor.x}`);
//   console.log(`Magnetic field along the Y-axis ${magSensor.y}`);
//   console.log(`Magnetic field along the Z-axis ${magSensor.z}`);
// });
// magSensor.start();

// Get orientation
let rotZ = 0;

console.log("HELLO");

// Open and connect input socket
let socket = io("/input");
let idx = 0;

// Start off with pitch only
let onlySendOrientation = true;

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
  socket.on('only change rate', function(data) {
    onlySendOrientation = data;
  })
}

function draw() {
  // Draw Scale
  background(0);

  // Draw from the center
  translate(width / 2, height / 2);

  // Draw all the notes in the diatonic scale

  // Re-orient to top
  rotZ = rotationZ;

  push();
  rotate(rotZ);
  for (let r = 0; r < ratios.length; r++) {
    let ratio = ratios[r];
    let angle = map(ratio.num / ratio.den, 1, 2, -90, 270);
    strokeWeight(25 - (ratio.num + ratio.den));
    push();
    if (angle == -90) stroke("green");
    else stroke(255, 32);
    rotate(angle);
    line(0, 0, diag / 2, 0);
    pop();
  }
  pop();

  push();
  rotate(rotationX);
  stroke("yellow");
  line(0, 0, diag / 2, 0);
  pop();

  stroke("red");
  strokeWeight(20);
  line(0, 0, 0, -diag / 2);

  // Send my pitch data
  socket.emit("orientation", {
    idx: idx,
    orientation: rotZ
  });

  // Send level data
  if (!onlySendOrientation) {
    socket.emit("level", {
      idx: idx,
      level: rotationX
    });
  }
}


// Toggle on and off auto-pilot
let o_int, l_int;
let auto_o = false;
let auto_l = false;

function keyPressed() {
  switch (key) {
    case 'o':
      clearInterval(o_int);
      auto_o = !auto_o
      console.log("Turn " + (auto_o ? "on" : "off") + " auto-pilot orientation.")
      if (auto_o) o_int = setInterval(() => {
        socket.emit("orientation", {
          idx: idx,
          orientation: floor(random(360))
        });
      }, 3000);

      break;
    case 'l':
      clearInterval(l_int);
      auto_l = !auto_l
      console.log("Turn " + (auto_l ? "on" : "off") + " auto-pilot level.")
      l_int = setInterval(() => {
        socket.emit("level", {
          idx: idx,
          level: floor(random(180))
        });
      }, 5000);
  }
}

function mousePressed() {
  socket.emit("level", {
    idx: idx,
    level: floor(180*mouseY/height)
  });
}
