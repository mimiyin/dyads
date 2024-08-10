// Base frequency
let base = 200;

// Ratios for diatonic scale
let ratios = [{
  num: 1,
  den: 1
}, {
  num: 9,
  den: 8
}, {
  num: 5,
  den: 4
}, {
  num: 4,
  den: 3
}, {
  num: 3,
  den: 2
}, {
  num: 5,
  den: 3
}, {
  num: 15,
  den: 8
}, {
  num: 2,
  den: 1
}, ]

function calc(id, data) {

  // Look up the moverId for this tag
  let m = tags2MoversLookup[id];

  // Track number of tags for this pair
  let pcount = 0;
  // Get the mover's pair of tags
  let pair = moverTagPairs[m];
  let left, right;
  // Store the data
  pair[id] = data;
  // For every tagId in pair
  for (t in pair) {
    let tag = pair[t];
    // If there is data for this tag
    if (tag) {
      if (pcount == 0) left = tag;
      else right = tag;
    }
    pcount++;
  }

  // If it's a pair
  if (left && right) {

    let ox = (right.x - left.x);
    let oy = (right.y - left.y);

    let x = (left.x + right.x) / 2;
    let y = (left.y + right.y) / 2;

    let o = createVector(ox, oy).heading() + PI/2;

    // Create new mover
    let mover = movers[m];

    if(mover) mover.update(x, y, o, Date.now());
    else mover = new Mover(x, y, o, Date.now());
    movers[m] = mover;
  }


}
