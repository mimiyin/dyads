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

// notes and arrows sequence
// 1. Declare predefined notes list
const notes = [1, 2, 3, 4, 5, 6, 7];
const notes_sequence = ["+1", "+4", "-7", "+3", "-6", "-4", "+7", "-3"]

// 2. Loop to calculate and store arrow presses for each pair of elements in the notes_sequence
const startingNote = 1;
const arrow_presses = [];

let currentNote = startingNote;
for (let i = 0; i < notes_sequence.length; i++) {
  const nextElement = notes_sequence[i];
  const arrowPresses = arrowPressesToElement(currentNote, nextElement);
  arrow_presses.push(arrowPresses);
  currentNote = parseInt(nextElement.slice(1), 10); // Update currentNote for the next iteration
}

console.log('Arrow presses calculated are: ', arrow_presses);

// 3. defualts for autopilot
let current_arrow_index = 0;
let notes_text_offset = -600; // display offset for x of the notes sequence

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
  textSize(20);
  stroke("white");
  fill("white");
  strokeWeight(1);
  for (let i = 0; i < arrow_presses.length; i++) {
    let note = notes_sequence[i];
    text(note, 50 + i * 50 + notes_text_offset, 0);
  }
  stroke("red");
  fill("red");
  strokeWeight(1);
  text(notes_sequence[current_arrow_index], 50 + current_arrow_index * 50 + notes_text_offset, 0);
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
      // console.log("current note index: " + current_arrow_index);
      if (current_arrow_index == 0) {
        console.log("no more notes before this one");
        return;
      }
      num_arrows = arrow_presses[current_arrow_index - 1];
      simulateArrows(num_arrows);
      current_arrow_index--;
      break;
    case 68:
      // console.log("current note index: " + current_arrow_index);
      if (current_arrow_index == arrow_presses.length - 1) {
        console.log("no more notes after this one");
        return;
      }

      num_arrows = arrow_presses[current_arrow_index + 1];
      simulateArrows(num_arrows);
      current_arrow_index++;
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


// autopilot helers

// Function to generate a random notes_sequence of 10 elements
// function generateNotesSequence() {
//   const notes_sequence = [];
//   for (let i = 0; i < 10; i++) {
//     const direction = Math.random() < 0.5 ? '-' : '+';
//     const note = notes[Math.floor(Math.random() * notes.length)];
//     notes_sequence.push(`${direction}${note}`);
//   }
//   return notes_sequence;
// }
//
// const notes_sequence = generateNotesSequence();
// console.log('Generated notes_sequence:', notes_sequence);

// Function to calculate arrow presses needed to get from one element to the next in the notes_sequence
function arrowPressesToElement(currentNote, nextElement) {
  const direction = nextElement[0];
  const targetNote = parseInt(nextElement.slice(1), 10);
  let currentIndex = notes.indexOf(currentNote);
  let targetIndex = notes.indexOf(targetNote);
  let arrowPresses = 0;

  if (direction === '+') {
    while (currentIndex !== targetIndex) {
      currentIndex = (currentIndex + 1) % notes.length;
      arrowPresses++;
    }
  } else if (direction === '-') {
    while (currentIndex !== targetIndex) {
      currentIndex = (currentIndex - 1 + notes.length) % notes.length;
      arrowPresses++;
    }
    // Negate arrowPresses for left direction
    arrowPresses = -arrowPresses;
  }

  return arrowPresses;
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
