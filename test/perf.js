const fs = require('fs');
const { PNG } = require('pngjs');
const { scaleImage } = require('../');

let scale = 6;

let src = PNG.sync.read(fs.readFileSync(__dirname + '/perf.png'));

function doit() {
  let start = performance.now();
  scaleImage({
    data: src.data, // Buffer
    width: src.width,
    height: src.height,
  }, {
    height: src.height * scale,
  });
  let end = performance.now();
  return end - start;
}
let time = doit();
console.log(`First run finished in ${time.toFixed(1)}`);

let timetotal = 0;
const mx = Math.min(100, Math.ceil(15000 / time));
for (let ii = 0; ii < mx; ++ii) {
  time = doit();
  timetotal += time;
  process.stdout.write(`\r${ii+1}/${mx} avg: ${(timetotal / (ii+1)).toFixed(1)}  last: ${time.toFixed(1)}   `);
}
console.log(`\nDone avg: ${(timetotal / mx).toFixed(1)}`);
