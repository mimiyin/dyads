//
// Set note positions of notes with mousedrag
// When both people have occupied a position for a certain amount of time - click them to the next stage

// Load and save spreadsheet of settings
// Initial set of positions for each movers
// Notes for each mover
// Time delay for each pair of positions

let cues = {
  'A': [{
    x: 100,
    y: 100,
    n: 'do',
    t: 1000
  }],
  'B': [{
    x: 300,
    y: 100,
    n: 'so',
    t: 1000
  }]
}


// Open and connect socket
let socket = io();

// 10 seconds in each location
const DURATION = 10000;

const MOVER = 0;
const NOTE = 1;

// Remembering where we are
let o = 0;
let po = 0;
let a;
let pr = 1;
let rate = 1;
let prate = 1;

let moverTagPairs = {
  'A': {
    0: null,
    1: null
  },
  'B': {
    2: null,
    3: null
  }
}

let tags2MoversLookup = {
  0: 'A',
  1: 'A',
  2: 'B',
  3: 'B'
}

// Track movers
let movers = {
  'A': undefined,
  'B': undefined
};

// Locales
let notes = {
  'A': [],
  'B': []
};



const RAD = 30;

// Listen for when the socket connects
socket.on('connect', function() {
  // Log a success message
  console.log("HEY I'VE CONNECTED");
});

function setup() {
  createCanvas(windowWidth, windowHeight);

  osc = new p5.Oscillator("sine", 440);
  osc.amp(0);

  // Load all the cues
  for (let m in cues) {
    let moverCues = cues[m];
    for (let cue of moverCues) {
      let x = cue.x;
      let y = cue.y;
      let n = cue.n;
      let t = cue.t;
      let ratio = ratios[n];
      let r = ratio.num / ratio.den;
      let f = r * base;
      let o = map(r, 1, 2, 0, TWO_PI) + PI / 2;

      // Create new note
      notes[m].push(new Note(m, x, y, o, f, t));
    }
  }






  // Listen for data coming from the server
  socket.on('pozyx', function(message) {
    // Log the data
    //console.log('Received message: ', message);
    // Draw a circle at the y-position of the other user
    let tag = message[0];
    let data = tag.data;
    let id = tag.tagId;
    let ts = tag.ts;
    if (data) {
      if (data.coordinates) {
        let x = data.coordinates.x / 10;
        let y = data.coordinates.y / 10;

        //console.log(id, x, y);
        tags[id] = {
          x: x,
          y: y,
          ts: ts
        };
      }
    }
  });

  textSize(10);
  textAlign(RIGHT, BOTTOM);
}

function draw() {
  background(255);

  // Show the notes.
  for (let m in notes) {
    let sequence = notes[m];
    for (let n in sequence) {
      let note = sequence[n];
      note.display();
    }
  }

  // Draw all the tags
  for (let m in moverTagPairs) {
    let moverTagPair = moverTagPairs[m];
    let pcount = 0;
    let start, end;
    for (let t in moverTagPair) {
      let tag = moverTagPair[t];
      if (!tag) break;
      ellipse(tag.x, tag.y, 5);
      if (pcount == 0) start = tag;
      else end = tag;
      pcount++;
    }
    if (start && end) {
      line(start.x, start.y, end.x, end.y);
      if (start) {
        fill('darkgray');
        ellipse(start.x, start.y, 5, 5);
      }
      if (end) {
        fill('lightgray');
        ellipse(end.x, end.y, 5, 5);
      }
    }
  }

  // Is everyone ready to move on?
  let ready = movers.values((mover) => mover.run());
  // If everyone ready, move everyone ahead
  if (ready) movers.values((mover) => {
    mover.next()
  })

}

let osc;

function keyPressed() {

  switch (key) {
    case 's':
      osc.amp(0);
      osc.start();
      osc.amp(1);
      break;
    case 'm':
      mode = MOVER;
      break;
    case 'n':
      mode = NOTE;
      break;
  }
}

function mousePressed() {
  switch (mode) {
    case MOVER:
      // Straight mouse testing
      for (let m in movers) {
        let mover = movers[m];
        if (mover) mover.move();
        else {
          console.log("Create new mover: ", m);
          movers[m] = new Mover(m, mouseX, mouseY, PI / 2);
        }
      }
      break;
    case NOTE:
      // Straight mouse testing
      for(let m in notes) {
        for(let n in notes[m]) note[n].position(mouseX, mouseY);
      }
      break;
  }

  function mouseReleased() {
    switch (mode) {
      case MOVER:
        // Straight mouse testing
        for (let m in movers) {
          let mover = movers[m];
          if (mover) mover.release();
        }
        break;
      case NOTE:
        // Straight mouse testing
        for(let m in notes) {
          for(let n in notes[m]) note[n].release();
        }
        break;
    }
  }



  // Test tags
  // idx++;
  // idx %= 4;
  // Test tags
  // calc(idx, {
  //   x: mouseX,
  //   y: mouseY,
  //   ts: Date.now()
  // });
}

function keyReleased() {
  if (key == 's') osc.amp(0);


}
