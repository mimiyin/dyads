class Note {
  constructor(idx, m, x, y, n, t) {
    this.idx = idx;
    this.m = m;
    this.x = x;
    this.y = y;
    this.n = n;
    this.o = noteToOrientation(this.n);
    this.f = noteToFrequency(this.n);
    this.osc = new p5.Oscillator("sine", this.f);
    this.osc.amp(0);
    this.osc.start();
    this.amp = 0;
    this.ease = null;
    this.isActive = false;
    this.t = t;
    this.isPositioning = false;
  }

  isInside(x, y) {
    return dist(this.x, this.y, x, y) < RAD;
  }

  isOriented(o) {
    return abs(this.o - o) < 0.2;
  }

  inPosition(x, y, o) {
    return this.isInside(x, y) && this.isOriented(o);
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
    this.positioning = false;

    // Save new x,y position of note
    let cue = cues[this.m][this.idx];
    cue.x = this.x;
    cue.y = this.y;
    saveJSON('cues', 'cues-' + Date.now() + '.json');
  }

  play() {
    // create Oscillator node
    if(this.isActive) return;
    console.log("PLAY!", this.f);
    this.isActive = true;
    this.osc.amp(1);
    return;
    clearInterval(this.ease);
    this.ease = setInterval(()=>{
      this.osc.amp(this.amp);
      if(this.amp < 1) this.amp+=0.01;
      else clearInterval(this.ease);
      //console.log("AMP", this.amp);
    }, 10);
  }

  stop() {
    if(!this.isActive) return;
    this.isActive = false;
    console.log("STOP", this.f);
    this.osc.amp(0);
    return;
    clearInterval(this.ease);
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
    text(this.m + ': ' + this.n, 0, -RAD);
    rotate(this.o);
    line(0, 0, RAD, 0);
    pop();

  }
}
