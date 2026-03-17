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

console.log('Test complete.');
