// Get orientation
let o = 0;
let board_o = 0;
let t = 0;
// Current angle
let a = 0;

// OFFSET
const OFFSET = 0;

// Open and connect input socket
let socket = io('/control');
let idx = 0;

// Mode
let onlySetRate = 1;
let onlySetTilt = 0;

// Listen for confirmation of connection
socket.on("connect", function() {
  console.log("Connected");

  // Get userid
  let params = new URL(document.location).searchParams;
  idx = params.get("idx") || 0;
  console.log("IDX", idx);

  // Tell me which side I am
  socket.emit("idx", {
    idx: idx,
    src: "control"
  });

  // Load note sequence
  roll_notes(idx);

  // Load interstitial calculations
  for (let i = 0; i < NOTE_SEQUENCE.length; i++) {
    const nextElement = NOTE_SEQUENCE[i];
    let arrowPresses = arrowPressesToElement(currentNote, nextElement);
    ARROW_PRESSES.push(arrowPresses);
    currentNote = parseInt(nextElement.slice(1), 10); // Update currentNote for the next iteration
  }

  console.log('Arrow presses calculated are: ', ARROW_PRESSES);

});

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  strokeCap(PROJECT);

  // Display notes
  display_notes();

  // Calculate length of diagonal of screen
  diag = sqrt(sq(width) + sq(height));

  // Lower framerate
  frameRate(30);

  // Listen for orientation data
  socket.on("orientation", function(message) {
    console.log("O! ", message.idx, nfs(message.o, 0, 2));
    let _idx = message.idx;
    if (_idx == idx) board_o = message.o;
  });

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

  push();
  rotate(OFFSET - 90);
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
  rotate(OFFSET + o);
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

function emit(event) {

  console.log("event name " + o);
  // Create message
  let message = {
    idx: idx,
    src: "control",
  }

  // Append data
  if (event == "orientation") {
    if (onlySetTilt) return;
    message.o = o;
  } else if (event == "tilt") {
    if (onlySetRate) return;
    message.t = t;
  }

  // Emit event
  socket.emit(event, message);

}

function keyPressed(e) {

  // Controlling what?
  let emit_o = false;
  let emit_t = false;
  let num_arrows = 0;

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
    case 65: // a
      console.log("current note index: " + current_arrow_index);
      if (current_arrow_index == 0) {
        console.log("no more notes before this one");
        return;
      }
      num_arrows = -ARROW_PRESSES[current_arrow_index];
      simulateArrows(num_arrows);
      updateCurrentArrowIndex(-1);
      break;
    case 68: // d
      // console.log("current note index: " + current_arrow_index);
      if (current_arrow_index == ARROW_PRESSES.length - 1) {
        console.log("no more notes after this one");
        return;
      }

      num_arrows = ARROW_PRESSES[current_arrow_index + 1];
      simulateArrows(num_arrows);
      updateCurrentArrowIndex(1);
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

  if (emit_o) emit("orientation");
  else if (emit_t) emit("tilt");
}

