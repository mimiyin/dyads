class Mover {
  constructor(m, x, y, o) {
    console.log("Create new mover: ", m, x, y, o);

    this.m = m;
    this.x;
    this.y;
    this.o;
    this.ox;
    this.oy;

    // Populate position values
    this.update(x, y, o);

    // Track manual updates
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
    //this.osc.amp(1);
    //this.osc.start();

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

  ready() {
    // If note is done
    return this.timer > this.note.t;
  }

  next() {
    // Move to next note
    this.n++;

    // Assign note if started
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
  }

  stop(){
    this.osc.amp(0);
    this.osc.stop();
    this.standby = false;
  }

  run() {
    // Draw the mover
    this.display();

    // Reflect movement freely at the beginning
    if(this.standby) {
      this.play();
      console.log("On standby!");
      if(this.note.isInside(this.x, this.y)) this.stop();
    }
    else {
      if (this.note.inPosition(this.x, this.y, this.o)) {
        console.log("In position!");
        this.note.play();
        this.timer++;
      }
      else {
        this.note.stop();
        this.timer = 0;
      }
    }
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
    if (this.positioning) this.update(x, y, this.o, Date.now());
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
