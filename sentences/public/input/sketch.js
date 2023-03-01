// Asking for permision for motion sensors on iOS 13+ devices
if (typeof DeviceOrientationEvent.requestPermission === "function") {
  document.body.addEventListener("click", function() {
    DeviceOrientationEvent.requestPermission();
    DeviceMotionEvent.requestPermission();
  });
}

console.log("HELLO");

// Open and connect input socket
let socket = io("/input");
let idx = 0;

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
}

function draw() {
  // Draw Scale
  background(0);

  // Change in acceleration
  let d = dist(accelerationX, accelerationY, accelerationZ, pAccelerationX, pAccelerationY, pAccelerationZ)
  let r = floor(random(6));
  if (d > 10) socket.emit('strike', idx);

  // Draw from the center
  translate(width / 2, height / 2);
  ellipse(0, 0, abs(d));
  fill(255);
  textSize(64);
  text(r, 0, -100);

}


// Toggle on and off auto-pilot
let int;
let auto = false;

function keyPressed() {
  socket.emit("strike", idx);
}
