class Note {
  constructor(idx, x, y, n, ) {
    this.idx = idx;
    this.x = x;
    this.y = y;
    this.n = n;
    this.r = noteToRate(this.n);
    this.o = rateToOrientation(this.r);
    this.f = rateToFrequency(this.r);
    this.osc = new p5.Oscillator("sine", this.f);
    this.osc.amp(0);
    this.osc.start();
    this.amp = 0;
    this.ease = null;
    this.isActive = false;
    this.isPositioning = false;
    this.occupants = {
      'A': false,
      'B': false
    };

    if(this.n == 'do2') {
      console.log(this.r, this.o, this.f);
    }
  }

  isInside(x, y) {
    return dist(this.x, this.y, x, y) < RAD;
  }

  _isOriented(r) {
    if (this.n == 'do' && r == 2) r = 1;
    else if (this.n == 'do2' && r == 1) r = 2;
    return this.r == r;
  }

  inPosition(x, y, o) {
    //console.log("Inside this note?");
    let r = orientationToRate(o);
    return this.isInside(x, y) && this._isOriented(r);
  }

  position(x, y) {
    let d = dist(this.x, this.y, x, y);
    if (d < RAD) this.positioning = true;
    if (this.positioning) {
      this.x = x;
      this.y = y;
    }
  }

  release() {
    console.log("RELEASE!", this.idx, this.n);

    this.positioning = false;

    // Save new x,y position of note
    let cue = cues[this.idx];
    cue.x = this.x;
    cue.y = this.y;
  }

  lock(m) {
    let unlocked = !this.occupants[m]; // true if wasn't here
    if (unlocked) this.occupants[m] = true;
    return unlocked;
  }

  unlock(m) {
    let locked = this.occupants[m]; // true if was here
    if (locked) this.occupants[m] = false;
    return locked;
  }

  play(m) {
    console.log("PLAY", this.idx);

    this.isActive = true;
    clearInterval(this.ease);
    this.osc.pan(m == 'A' ? 1 : -1);
    this.osc.amp(0);
    this.ease = setInterval(() => {
      if (this.amp < 1) {
        this.amp += 0.005;
        this.osc.amp(this.amp);
        console.log("Still fading in: ", m, this.amp);
      }
      else clearInterval(this.ease);
      //console.log("AMP", this.amp);
    }, 10);
  }

  stop(m) {
    console.log("STOP?", this.idx);

    this.occupants[m] = false;
    let occupants = Object.values(this.occupants);
    let occupied = occupants.some((occupant) => occupant);
    if (occupied) return;
    if (!this.isActive) return;
    this.isActive = false;
    clearInterval(this.ease);

    console.log("STOP", this.idx);
    this.ease = setInterval(() => {
      if (this.amp > 0) {
        this.amp -= 0.002;
        this.osc.amp(this.amp);
        //console.log("Still fading out: ", this.amp);
      }
      else clearInterval(this.ease);
    }, 10);
    this.osc.amp(0);
  }

  display() {
    push();
    translate(this.x, this.y);
    fill(255);
    ellipse(0, 0, RAD * 2);
    textFont('Courier');
    textSize(14);
    textAlign(CENTER, CENTER);
    fill(0);
    strokeWeight(2);
    text(this.idx + ': ' + this.n, 0, RAD * 1.5);
    rotate(this.o);
    line(0, 0, RAD, 0);
    pop();

  }
}
