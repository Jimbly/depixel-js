const assert = require('assert');
const fs = require('fs');
const { PNG } = require('pngjs');
const { scaleImage } = require('../');

const PNG_RGBA = 6;

function doTest(filename, outname, scale, opts, overrides) {
  let src = PNG.sync.read(fs.readFileSync(__dirname + '/' + filename));
  let res = scaleImage({
    data: src.data, // Buffer
    width: src.width,
    height: src.height,
    ...(overrides || {})
  }, {
    height: src.height * scale,
    ...(opts || {})
  });
  let dst = new PNG({ width: src.width * scale, height: src.height * scale, colorType: PNG_RGBA });
  assert.equal(res.data.length, dst.data.length);
  res.data.copy(dst.data);
  fs.writeFileSync(__dirname + '/' + outname, PNG.sync.write(dst));
}
let scale = 6;

doTest('test-in.png', 'test-out.png', scale);

doTest('test2-in.png', 'test2-out-noopt.png', 25, {
  threshold: 0,
  borderPx: 2,
  doOpt: false,
});
doTest('test2-in.png', 'test2-out-noopt-splines.png', 25, {
  threshold: 0,
  borderPx: 2,
  doOpt: false,
  renderMode: 'splines',
});
doTest('test2-in.png', 'test2-out.png', 25, {
  threshold: 0,
  borderPx: 2,
});
doTest('test2-in.png', 'test2-out-splines.png', 25, {
  threshold: 0,
  borderPx: 2,
  renderMode: 'splines',
});

let src_similarity = PNG.sync.read(fs.readFileSync(__dirname + '/test-in-similarity.png'));
doTest('test-in.png', 'test-out-fromsim.png', scale, {
  threshold: 0,
  similarity: src_similarity.data,
});

doTest('test-in.png', 'test-out-fromsim-newmask.png', scale, {
  threshold: 32, // won't perfectly match
}, {
  data: src_similarity.data,
});

doTest('test-in.png', 'test-out-hard.png', scale, {
  threshold: 0,
  borderPx: 1,
});

//////////////////////////////////////////////////////////////////////////
// Verify things line up, and check for other bugs fixed along the way
let had_error = false;

// check test2.out vs expected
let expected = PNG.sync.read(fs.readFileSync(__dirname + '/test2-out-expected.png'));
let actual = PNG.sync.read(fs.readFileSync(__dirname + '/test2-out.png'));
assert.equal(expected.data.length, actual.data.length);
let diff = 0;
for (let ii = 0; ii < expected.data.length; ++ii) {
  if (expected.data[ii] !== actual.data[ii]) {
    ++diff;
  }
}
if (diff > 9) {
  had_error = true;
  console.error(`Too many mismatched pixels between test2-out and test2-out-expected: ${diff}`);
}

{
  let srcNearest = PNG.sync.read(fs.readFileSync(__dirname + '/test-in-6x-nearest.png'));
  let dest = PNG.sync.read(fs.readFileSync(__dirname + '/test-out-hard.png'));
  assert.equal(srcNearest.data.length, dest.data.length);
  function check(x, y, w, h) {
    let valid = true;
    let logs = [];
    logs.push('Expected Depixel');
    for (let yy = y; yy < y + h; ++yy) {
      let line1 = [];
      let line2 = [];
      for (let xx = x; xx < x + w; ++xx) {
        let v1 = srcNearest.data[(yy * srcNearest.width + xx) * 4];
        let v2 = dest.data[(yy * dest.width + xx) * 4];
        line1.push(v1 < 127 ? 'X' : '.');
        line2.push(v2 < 127 ? 'X' : '.');
        if (v1 !== v2) {
          valid = false;
          line2[line2.length - 1] = v2 < 127 ? 'W' : '-'
        }
      }
      logs.push(`${line1.join('')} ${line2.join('')}`);
    }
    if (!valid) {
      console.log(logs.join('\n'));
      console.error('Vertical stretching detected');
      had_error = true;
    }
  }
  check(118, 520, 8, 12);

  function checkNoBlack(x, y, w, h) {
    for (let yy = y; yy < y + h; ++yy) {
      for (let xx = x; xx < x + w; ++xx) {
        let r = dest.data[(yy * dest.width + xx) * 4];
        let g = dest.data[(yy * dest.width + xx) * 4+1];
        let b = dest.data[(yy * dest.width + xx) * 4+2];
        if (!r && !g && !b) {
          console.error(`Found unexpected black pixels at ${xx},${yy}`);
          had_error = true;
        }
      }
    }
  }
  // Verify no black pixels in the middle of the scaled asset
  checkNoBlack(102, 265, 99, 261);
}

if (had_error) {
  throw new Error('Tests failed');
} else {
  console.log('Test complete.');
}
