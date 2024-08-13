class Mover {
  constructor(m, x, y, o) {
    console.log("Create new mover: ", m, x, y, o);

    this.m = m;
    this.x;
    this.y;
    this.o;
    this.ox;
    this.oy;

    this.update(x, y, o);

    this.positioning = false;
    this.orienting = false;

    // Assign note
    this.n = -1;
    this.notes = notes[this.m];
    this.note = null;

    // Assign click
    this.click = loadSound('click.wav', ()=> {
      this.next();
      console.log(this.click);
    });

    // Track status
    this.timer = 0;

    // Temp oscillator for pre-start
    this.osc = new p5.Oscillator("sine", 0);
    this.osc.amp(1);
    this.osc.start();

    // Track standby status
    this.standby = true;
  }

  update(x, y, o, ts) {
    this.x = x;
    this.y = y;
    this.o = o;
    this.ox = RAD * cos(this.o) + this.x;
    this.oy = RAD * sin(this.o) + this.y;
  }

  next() {
    this.n++;
    if(this.n >= this.notes.length) this.standby = true;
    else this.note = this.notes[this.n];

    //Play the click sound
    this.click.play();

    // Print status
    console.log("Next note: ", this.note);

  }

  // Play frequency feedback when in standby mode
  play() {
    let f = orientationToFrequency(this.o);
    this.osc.freq(f);
    console.log("On standby!", this.o);
  }

  run() {
    // Draw the mover
    this.display();

    // Reflect movement freely at the beginning
    if(this.standby) {
      this.play();
      if (this.note.inPosition(this.x, this.y, this.o)) this.standby = false;
    }
    else {
      if (this.note.inPosition(this.x, this.y, this.o)) {
        this.note.play();
        this.timer++;
        this.standby = false;
      }
      else {
        this.note.stop();
        this.timer = 0;
      }
    }

    // If note is done
    return this.timer > this.note.t;
  }

  display() {

    // Draw mover and heading
    push();
    translate(this.x, this.y);
    fill('black');
    textSize(14)
    textAlign(CENTER, BOTTOM);
    text(this.m, 0, -10);
    ellipse(0, 0, 10, 10);
    rotate(this.o);
    strokeWeight(1);
    line(0, 0, RAD, 0);
    ellipse(RAD, 0, 5, 5);
    pop();
  }

  move(x, y) {
    this.position(x, y);
    this.orient(x, y);
  }

  position(x, y) {
    if (dist(this.x, this.y, x, y) < 5) this.positioning = true;
    if (this.positioning) {
      console.log("Positioning", this.m);
      this.update(x, y, this.o, Date.now());
    }
  }

  orient(x, y) {
    if (dist(this.ox, this.oy, x, y) < 5) this.orienting = true;
    if (this.orienting) {
      let o = createVector(x - this.x, y - this.y).heading();
      this.update(this.x, this.y, o, Date.now());
    }
  }

  release() {
    this.positioning = false;
    this.orienting = false;
  }
}
