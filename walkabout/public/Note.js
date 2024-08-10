class Note {
  constructor(x, y, o, b) {
    this.x = x;
    this.y = y;
    this.o = o;
    this.r = this.mapRate(o);
    this.pr = this.r;
    this.f = this.r * base * b;
    this.osc = new p5.Oscillator("sine", this.f);
    this.osc.amp(0);
    this.osc.start();
    this.amp = 0;
    this.int = null;
    this.isActive = false;
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
    rotate(this.o);
    line(0, 0, RAD, 0);
    pop();

  }

  mapRate(o) {
    // Map pitch
    let r = map(o, 0, 360, 1, 2);

    // Snap to closest diatonic note
    let closest = 10;
    let nr = r;
    for (let ratio of ratios) {
      let _r = ratio.num / ratio.den;
      let dr = abs(r - _r);
      if (dr < closest) {
        nr = _r;
        closest = dr;
      }
    }
    // Snap to closest r
    return nr;
  }
}
