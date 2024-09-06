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

    // Assign click
    this.click = loadSound('click.wav');
    // Pan to left or right speaker
    this.click.pan(m == 'A' ? 1 : -1);

    // Temp oscillator for pre-start
    this.osc = new p5.Oscillator("sine", 0);
    //this.osc.amp(1);
    //this.osc.start();

    // Track standby status
    this.standby = true;

    // Track tempo
    this.tempo = -1;
    this._tempo = -1;
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

  // Play frequency feedback when in standby mode
  play() {
    let f = orientationToFrequency(this.o);
    this.osc.freq(f);
  }

  stop() {
    this.osc.amp(0);
    this.osc.stop();
    this.standby = false;
  }

  run() {

    // Draw the mover
    this.display();

    // Reflect movement freely at the beginning
    if (this.standby) {
      this.play();
      console.log(this.m, " is on standby!");
      if (START.isInside(this.x, this.y)) this.stop();
    } else {
      let outside = true;
      for (let note of notes) {
        console.log(this.m, " is ready!");
        if (note.inPosition(this.x, this.y, this.o)) {
          this.lock();
          note.play(this.m);
          outside = false;
          break;
        } else {
          note.stop(this.m);
          if (note.isInside(this.x, this.y)) {
            this.dial();
            outside = false;
            break;
          }
        }
      }

      // If mover is outside all of the notes
      if (outside) this.walkabout();
    }
  }

  lock() {
    console.log('Locked in.');
    this.tempo = -1;
    clearInterval(this.clickInt);
  }

  dial() {
    console.log('Dialing.');
    this.setClicker(1000);
  }

  walkabout() {
    console.log('Walking about.');
    this.setClicker(2000);
  }

  setClicker(tempo) {
    this._tempo = this.tempo;
    this.tempo = tempo;
    if (abs(this.tempo - this._tempo) < 1) return;
    clearInterval(this.clickInt);
    this.clickInt = setInterval(() => {
      this.click.play();
    }, this.tempo);
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
