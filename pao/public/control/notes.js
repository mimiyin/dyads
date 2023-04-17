const COMPOSITION = {
  "unison": {
    1: {
      1: ["+1", "+2", "+3", "+4", "+5", "+6", "+7", "+1"],
      2: ["+1", "+2", "+3", "+4", "+5", "+6", "+7", "+1"]
    }
  },
  "contrary": {
    1: {
      1: ["+2", "+3", "+4", "+5", "+6", "+7", "+1"],
      2: ["-7", "-6", "-5", "+1", "-4", "-3", "-2", "-1"]
    }
  },
  "reset": {
    1: {
      1: ["-1"],
      2: ["+1"]
    }
  },
  "alternate": {
    1: {
      1: ["-1", "+3", "+4", "-2", "-4", "-3", "+5"],
      2: ["=1", "+2", "-7", "-6", "+7", "-5"]
    },
    2: {
      1: ["+1", "+4", "+5", "-3", "-4", "+5", "-3"],
      2: ["+1", "+2", "-7", "-6", "+7", "-5"]
    },
    3: {
      1: ["+1", "-5", "-4", "+6", "=6", "+7", "-5"],
      2: ["+1", "-7", "+2", "-3", "+4", "-2"]
    },
    4: {
      1: ["+1", "+4", "+5", "-3", "-4", "+6", "-3"],
      2: ["+1", "-7", "+2", "-6", "+7", "-5"]
    }
  },
  "repeat": {
    1: {
      1: ["+1", "+4", "-7", "+3", "-6", "-4", "+7", "+3"],
      2: ["+1", "+4", "-7", "+3", "-6", "-4", "+7", "+3"]
    },
    2: {
      1: ["-1", "+4", "-7", "+3", "-6", "-4", "+7", "+3"],
      2: ["-1", "+4", "-7", "+3", "-6", "-4", "+7", "+3"]
    },
    3: {
      1: ["-1", "-7", "-6", "-4", "-3", "+5", "+1", "+2", "+3"],
      2: ["-1", "+4", "-3", "-2", "-7", "+1", "+4", "-6", "+7", "+2", "+3"]
    },
  }
}

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
    1 : 0,
    2 : 0
  };
  let compP = select('#composition');
  for (let m in COMPOSITION) {
    let movement = COMPOSITION[m];
    let mp = createP();
    let title = createP(m);
    title.parent(mp);
    mp.parent(compP)
    for (let s in movement) {
      let section = movement[s];
      let sp = createP();
      sp.parent(mp);
      for(let idx in section) {
        let idxp = createP();
        let title = createSpan(idx + ":\t");
        title.parent(idxp);
        idxp.parent(sp);
        let sequence = section[idx];
        for(let note of sequence) {
          let notesp = createSpan();
          notesp.attribute("id", "idx-count-" + idx + "-" + counters[idx]++);
          notesp.parent(idxp);
          notesp.html(note);
        }
      }
    }
  }
}
