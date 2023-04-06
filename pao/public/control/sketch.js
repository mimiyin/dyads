// Get orientation
let o = 0;
let board_o = 0;
let t = 0;
// Current angle
let a = 0;

// offset
let offset = 0;

// Open and connect input socket
let socket = io();
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

  // Listen for orientation data
  socket.on("orientation", function(message){
    console.log("O!");
    let idx = message.idx;
    board_o = message.o;
  });
}

function draw() {
  // Draw Scale
  background(0);

  // Draw from the center
  translate(width / 2, height / 2);
  // Draw all the notes in the diatonic scale

  push();
  rotate(offset - 90);
  for (let r = 0; r < ratios.length; r++) {
    let rat = ratios[r];
    let angle = map(rat.num / rat.den, 1, 2, 0, 360);
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
  // Make it go backwards
  rotate(t);
  stroke("yellow");
  strokeWeight(20);
  line(0, 0, 0, -diag / 2);
  pop();

  push();
  rotate(offset + o);
  stroke("red");
  strokeWeight(20);
  line(0, 0, 0, -diag / 2);
  pop();

  push();
  rotate(board_o);
  stroke("white");
  strokeWeight(5);
  line(0, 0, 0, -diag / 2);
  pop();
}

function emit() {
  console.log("O:", o, "T:", t);
  // Send my pitch data
  socket.emit("message", {
    idx: idx,
    o: o,
    t: t
  });
}

function keyPressed() {

  let emit_off = false;
  switch (key) {
    case 'a':
      offset--;
      emit_off = true;
      break;
    case 's':
      offset++;
      emit_off = true;
      break;
  }

  // Control offset
  if(emit_off) {
    socket.emit("offset", {
      idx : idx,
      off : offset
    });
  }


  // Controlling what?
  let emit_o = false;
  let emit_t = false;

  switch (keyCode) {
    case RIGHT_ARROW:
      a++;
      emit_o = true;
      break;
    case LEFT_ARROW:
      a--;
      emit_o = true;
      break;
    case UP_ARROW:
      t -= 10;
      emit_t = true;
      break;
    case DOWN_ARROW:
      t += 10;
      emit_t = true;
      break;
  }

  // Wrap it around
  if (emit_o) {
    if (a < 0) a = angles.length - 1;
    else if (a > angles.length - 1) a = 0;
    o = angles[a];
  } else if (emit_t) {
    if (t < 0) t = 360 + t;
    else if (t > 360) t = t - 360;
  }

  emit();
}
