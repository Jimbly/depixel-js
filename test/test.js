const assert = require('assert');
const fs = require('fs');
const { PNG } = require('pngjs');
const { scaleImage } = require('../');

const PNG_RGBA = 6;

let src = PNG.sync.read(fs.readFileSync(__dirname + '/test-in.png'));

let scale = 6;
let dst = new PNG({ width: src.width * scale, height: src.height * scale, colorType: PNG_RGBA });

let res = scaleImage({
  data: src.data, // Buffer
  width: src.width,
  height: src.height,
}, {
  height: src.height * scale,
});
assert.equal(res.data.length, dst.data.length);
res.data.copy(dst.data);

fs.writeFileSync(__dirname + '/test-out.png', PNG.sync.write(dst));

let dstHard = new PNG({ width: src.width * scale, height: src.height * scale, colorType: PNG_RGBA });
let resHard = scaleImage({
  data: src.data,
  width: src.width,
  height: src.height,
}, {
  height: src.height * scale,
  threshold: 0,
  borderPx: 1,
});
assert.equal(resHard.data.length, dstHard.data.length);
resHard.data.copy(dstHard.data);
fs.writeFileSync(__dirname + '/test-out-hard.png', PNG.sync.write(dstHard));

// Verify things line up

let srcNearest = PNG.sync.read(fs.readFileSync(__dirname + '/test-in-6x-nearest.png'));
assert.equal(srcNearest.data.length, dstHard.data.length);
function check(x, y, w, h) {
  let valid = true;
  console.log('Expected Depixel');
  for (let yy = y; yy < y + h; ++yy) {
    let line1 = [];
    let line2 = [];
    for (let xx = x; xx < x + w; ++xx) {
      let v1 = srcNearest.data[(yy * srcNearest.width + xx) * 4];
      let v2 = dstHard.data[(yy * dstHard.width + xx) * 4];
      line1.push(v1 < 127 ? 'X' : '.');
      line2.push(v2 < 127 ? 'X' : '.');
      if (v1 !== v2) {
        valid = false;
        line2[line2.length - 1] = v2 < 127 ? 'W' : '-'
      }
    }
    console.log(`${line1.join('')} ${line2.join('')}`);
  }
  if (!valid) {
    throw new Error('Vertical stretching detected');
  }
}
check(118, 520, 8, 12);

function checkNoBlack(x, y, w, h) {
  for (let yy = y; yy < y + h; ++yy) {
    for (let xx = x; xx < x + w; ++xx) {
      let r = dstHard.data[(yy * dstHard.width + xx) * 4];
      let g = dstHard.data[(yy * dstHard.width + xx) * 4+1];
      let b = dstHard.data[(yy * dstHard.width + xx) * 4+2];
      if (!r && !g && !b) {
        throw new Error(`Found unexpected black pixels at ${xx},${yy}`);
      }
    }
  }
}
// Verify no black pixels in the middle of the scaled asset
checkNoBlack(71, 37, 99, 261);

console.log('Test complete.');
