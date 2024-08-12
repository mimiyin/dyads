class Note {
  constructor(m, x, y, o, f, t) {
    this.m = m;
    this.x = x;
    this.y = y;
    this.o = o;
    this.f = f;
    this.osc = new p5.Oscillator("sine", this.f);
    this.osc.amp(0);
    this.osc.start();
    this.amp = 0;
    this.int = null;
    this.isActive = false;
    this.t = 0;
    this.isPositioning = false;
  }

  isInside(x, y) {
    return dist(this.x, this.y, x, y) < RAD;
  }

  isOriented(o) {
    console.log(this.o-o);
    return abs(this.o - o) < 0.1;
  }

  inPosition(x, y, o) {
    return this.isInside(x, y) && this.isOriented(o);
  }

  position(x, y) {
    if(d < RAD) this.positioning = true;
    if(this.positioning) {
      this.x = x;
      this.y = y;
    }
  }

  release() {
    this.positioning = false;
    let cue = cues[this.m][this.n];
    cue.x = this.x;
    cue.y = this.y;
    saveJSON('cues', cues);
  }

  play() {
    // create Oscillator node
    if(this.isActive) return;
    console.log("PLAY!", this.f);
    this.isActive = true;
    clearInterval(this.int);
    this.int = setInterval(()=>{
      this.osc.amp(this.amp);
      if(this.amp < 1) this.amp+=0.01;
      console.log("AMP", this.amp);
    }, 10);
  }

  stop() {
    if(!this.isActive) return;
    this.isActive = false;
    console.log("STOP", this.f);
    clearInterval(this.int);
    this.int = setInterval(()=>{
      this.osc.amp(this.amp);
      if(this.amp > 0) this.amp-=0.01;
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
    text(this.m, 0, 0);
    rotate(this.o);
    line(0, 0, RAD, 0);
    pop();

  }
}
