const STARTING_NOTE = 1;

// notes and arrows sequence
// 1. Declare predefined notes list
const NOTES = [1, 2, 3, 4, 5, 6, 7];

// 2. Loop to calculate and store arrow presses for each pair of elements in the NOTE_SEQUENCE
const ARROW_PRESSES = [];

// Start on DO
let currentNote = STARTING_NOTE;

// 3. defualts for autopilot
let current_arrow_index = 0;
let notes_text_offset = -600; // display offset for x of the notes sequence

const COMPOSITION = {
  "unison": {
    1: {
      2: ["+1", "+2", "+3", "+4", "+5", "+6", "+7", "+1"],
      1: ["+1", "+2", "+3", "+4", "+5", "+6", "+7", "+1"]
    }
  },
  "contrary": {
    1: {
      2: ["+2", "+3", "+4", "+5", "+6", "+7", "+1"],
      1: ["-7", "-6", "-5", "+1", "-4", "-3", "-2", "-1"]
    }
  },
  "reset": {
    1: {
      2: ["-1"],
      1: ["+1"]
    }
  },
  "alternate": {
    1: {
      2: ["-1", "+3", "+4", "-2", "-4", "-3", "+5"],
      1: ["-1", "+2", "-7", "-6", "+7", "-5"]
    },
    2: {
      2: ["+1", "+4", "+5", "-3", "-4", "+5", "-3"],
      1: ["+1", "+2", "-7", "-6", "+7", "-5"]
    },
    3: {
      2: ["+1", "-5", "-4", "+6", "=6", "+7", "-5"],
      1: ["+1", "-7", "+2", "-3", "+4", "-2"]
    },
    4: {
      2: ["+1", "+4", "+5", "-3", "-4", "+6", "-3"],
      1: ["+1", "-7", "+2", "-6", "+7", "-5"]
    }
  },
  "repeat": {
    1: {
      2: ["+1", "+4", "-7", "+3", "-6", "-4", "+7", "+3"],
      1: ["+1", "+4", "-7", "+3", "-6", "-4", "+7", "+3"]
    },
    2: {
      2: ["-1", "+4", "-7", "+3", "-6", "-4", "+7", "-3"],
      1: ["-1", "+4", "-7", "+3", "-6", "-4", "+7", "+3"]
    },
    3: {
      2: ["+1", "-7", "-6", "-4", "-3", "+1", "+4", "-2", "+3"],
      1: ["-1", "+4", "-3", "-2", "-7", "-5", "+1", "-6", "+7", "+2", "+3"]
    },
  }
}

// Sequence of notes to cycle through
const NOTE_SEQUENCE = [];

function roll_notes(idx) {
  for (let m in COMPOSITION) {
    let movement = COMPOSITION[m];
    for (let s in movement) {
      let section = movement[s];
      NOTE_SEQUENCE.push(...section[idx]);
    }
  }
  console.log("Note sequence: ", NOTE_SEQUENCE);
}

// Display notes in DOM elements
function display_notes() {
  let counters = {
    1: 0,
    2: 0
  };
  let compP = select('#composition');
  for (let m in COMPOSITION) {
    let movement = COMPOSITION[m];
    let movementP = createP();
    let title = createP(m);
    title.parent(movementP);
    movementP.parent(compP)
    for (let s in movement) {
      let section = movement[s];
      let sectionP = createP();
      sectionP.parent(movementP);
      for (let thisIdx in section) {
        let thisIdxP = createP();
        let title = createSpan(thisIdx + ":\t");
        title.parent(thisIdxP);
        thisIdxP.parent(sectionP);
        thisIdxP.addClass(thisIdx == idx ? "me" : "not-me");
        let sequence = section[thisIdx];
        for (let note of sequence) {
          let notesp = createSpan();
          let count = counters[thisIdx]++
          notesp.attribute("id", "idx-count-" + thisIdx + "-" + count);
          if (count == 0 && thisIdx == idx) notesp.addClass("current");
          notesp.parent(thisIdxP);
          notesp.addClass("note");
          notesp.html(note);
          // FF feature
          notesp.mousePressed(() => jump(count));
        }
      }
    }
  }
}

// Speed feature
function jump(to) {
  console.log("Jump to: ", to);
  if (current_arrow_index < to) {
    for (let c = current_arrow_index; c < to; c++) {
        keyCode = ENTER;
        keyPressed();
    }
  }
  else {
    for (let c = current_arrow_index; c > to; c--) {
        keyCode = SHIFT;
        keyPressed();
    }
  }
}

// Change note
function updateCurrentArrowIndex(change) {
  try {
    select("#idx-count-" + idx + "-" + current_arrow_index).removeClass("current");
  } catch (e) {
    console.log("Nothing to remove.");
  }
  current_arrow_index += change;
  select("#idx-count-" + idx + "-" + current_arrow_index).addClass("current")
}

// Function to calculate arrow presses needed to get from one element to the next in the NOTE_SEQUENCE
function arrowPressesToElement(currentNote, nextElement) {
  const direction = nextElement[0];

  // Don't bother
  if (direction == '=') return 0;

  const targetNote = parseInt(nextElement.slice(1), 10);
  let currentIndex = NOTES.indexOf(currentNote);
  let targetIndex = NOTES.indexOf(targetNote);
  let arrowPresses = 0;

  // // Account for jumping octaves
  if (currentIndex == targetIndex) {
    arrowPresses = direction === '+' ? 7 : -7;
  } else if (direction === '+') {
    while (currentIndex !== targetIndex) {
      currentIndex = (currentIndex + 1) % NOTES.length;
      arrowPresses++;
    }
  } else if (direction === '-') {
    while (currentIndex !== targetIndex) {
      currentIndex = (currentIndex - 1 + NOTES.length) % NOTES.length;
      arrowPresses--;
    }
  }

  return arrowPresses;
}

// Simulating keypresses for auto-manual mode
function simulateArrows(num_arrows) {
  if (num_arrows < 0) {
    for (let i = 0; i < abs(num_arrows); i++) {
      console.log("Go down");
      keyCode = LEFT_ARROW;
      keyPressed();
    }
  } else {
    for (let i = 0; i < num_arrows; i++) {
      console.log("Go up!");
      keyCode = RIGHT_ARROW;
      keyPressed();
    }
  }
}
