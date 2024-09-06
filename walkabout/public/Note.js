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
    this.occupants = { 'A' : false, 'B' : false };
  }

  isInside(x, y) {
    return dist(this.x, this.y, x, y) < RAD;
  }

  _isOriented(r) {
    return this.r == r;
  }

  inPosition(x, y, o) {
    console.log("Inside this note?");
    let r = orientationToRate(o);
    return this.isInside(x, y) && this._isOriented(r);
  }

  position(x, y) {
    let d = dist(this.x, this.y, x, y);
    if(d < RAD) this.positioning = true;
    if(this.positioning) {
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

  play(m) {
    console.log("PLAY?", this.idx);

    this.occupants[m] = true;
    // create Oscillator node
    if(this.isActive) return;
    this.isActive = true;
    clearInterval(this.ease);

    console.log("PLAY!", this.idx);
    this.ease = setInterval(()=>{
      this.osc.amp(this.amp);
      if(this.amp < 1) this.amp+=0.01;
      else clearInterval(this.ease);
      //console.log("AMP", this.amp);
    }, 10);
  }

  stop(m) {
    console.log("STOP?", this.idx);

    this.occupants[m] = false;
    let occupants = Object.values(this.occupants);
    let occupied = occupants.some((occupant) => occupant);
    if(occupied) return;
    if(!this.isActive) return;
    this.isActive = false;
    clearInterval(this.ease);

    console.log("STOP?", this.idx);
    this.ease = setInterval(()=>{
      this.osc.amp(this.amp);
      if(this.amp > 0) this.amp-=0.01;
      else clearInterval(this.ease);
    }, 10);
    this.osc.amp(0);
  }

  display() {
    push();
    translate(this.x, this.y);
    fill(255);
    ellipse(0, 0, RAD*2);
    textSize(14);
    textAlign(CENTER, CENTER);
    fill(0);
    text(this.idx + ': ' + this.n, 0, -RAD * 1.5);
    rotate(this.o);
    line(0, 0, RAD, 0);
    pop();

  }
}
