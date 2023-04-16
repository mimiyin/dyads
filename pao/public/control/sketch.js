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

// notes sequence
let note_sequences = [0, 2, 4, 2, 1, 3]; // assuming 0 is the root note
let current_note_index = 0;
let notes_text_offset = -600; // offset for both x and y of the text

// Listen for confirmation of connection
socket.on("connect", function () {
  console.log("Connected");

  // Get userid
  let params = new URL(document.location).searchParams;
  idx = params.get("idx") || 0;
  console.log("IDX", idx);

  // Tell me which side I am
  socket.emit("idx", { idx: idx, src: "control" });
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
  socket.on("orientation", function (message) {
    console.log("O! ", message.idx, nfs(message.o, 0, 2));
    let _idx = message.idx;
    if (_idx == idx) board_o = message.o;
  });

  // Listen for turning off level
  socket.on('only set rate', function (data) {
    console.log("ONLY SET RATE", data);
    onlySetRate = data;
    if (onlySetRate) onlySetTilt = 0;
  });

  // Listen for turning off orientation
  socket.on('only set tilt', function (data) {
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

  // Draw the notes sequence in white and mark the current note in red
  stroke("white");
  strokeWeight(1);
  for (let i = 0; i < note_sequences.length; i++) {
    let note = note_sequences[i];
    text(note, 50 + i * 50 + notes_text_offset, 100 + notes_text_offset);
  }
  stroke("red");
  strokeWeight(1);
  text(note_sequences[current_note_index], 50 + current_note_index * 50 + notes_text_offset, 100 + notes_text_offset);
}

function emit(event) {

  console.log("event name " + event);
  // Create message
  let message = {
    idx: idx,
    src: "control",
  }

  // Append data
  if (event == "orientation") {
    if (onlySetTilt) return;
    message.o = o;
  }
  else if (event == "tilt") {
    if (onlySetRate) return;
    message.t = t;
  }

  // Emit event
  socket.emit(event, message);

}

function keyPressed() {


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
    case 65:
      // console.log("current note index: " + current_note_index);
      if (current_note_index == 0) {
        console.log("no more notes before this one");
        return;
      }
      num_arrows = note_sequences[current_note_index - 1] - note_sequences[current_note_index];
      simulateArrows(num_arrows);
      current_note_index--;
      break;
    case 68:
      // console.log("current note index: " + current_note_index);
      if (current_note_index == note_sequences.length - 1) {
        console.log("no more notes after this one");
        return;
      }

      num_arrows = note_sequences[current_note_index + 1] - note_sequences[current_note_index];
      simulateArrows(num_arrows);
      current_note_index++;
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

function simulateArrows(num_arrows) {
  // console.log("Simulating " + num_arrows + " arrows");
  if (num_arrows < 0) {
    for (let i = 0; i < abs(num_arrows); i++) {
      keyCode = LEFT_ARROW;
      keyPressed();
    }
  } else {
    for (let i = 0; i < num_arrows; i++) {
      keyCode = RIGHT_ARROW;
      keyPressed();
    }
  }
}