// Asking for permision for motion sensors on iOS 13+ devices
if (typeof DeviceOrientationEvent.requestPermission === "function") {
  document.body.addEventListener("click", function() {
    DeviceOrientationEvent.requestPermission();
    DeviceMotionEvent.requestPermission();
  });
}

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

  fill('red');
  for(let touch of touches) {
    ellipse(touch.x, touch.y, 100, 100);
  }
}


// Toggle on and off auto-pilot
let int;
let auto = false;

function touchStarted(touch) {
  let touchId = touches.length > 0 ? touches.length : 1;
  socket.emit("touch", { idx : idx, id : touchId });
}

function touchEnded(touch) {
  socket.emit("untouch", { idx : idx, id : touches.length + 1 });
}

let keys = {};
// Press a number key
function keyPressed() {
    if(keys[key] == undefined) keys[key] = false;
    keys[key] = !keys[key];
    socket.emit(keys[key] ? "touch" : "untouch", { idx : idx, id : key });
}
