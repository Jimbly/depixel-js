const assert = require('assert');
const fs = require('fs');
const { PNG } = require('pngjs');
const { scaleImage } = require('../');
const { abs, floor, random, round } = Math;
const PNG_RGBA = 6;

const FILENAME = 'work';
const MAKE_SIMILARITY = false;
const USE_SIMILARITY = true;
const OPTS = {
  threshold: 120, // only used for MAKE_SIMILARITY or if USE_SIMILARITY is not set
  borderPx: 2,
  scale: 6.4,
  doOpt: true,
  blendSigma: 0.7,
};

let sim_name = __dirname + '/' + FILENAME + '-similarity.png';

function generateSimilarityMask(src) {
  const THRESHOLD_a = 32 / 255;
  const THRESHOLD_y = 48 / 255;
  const THRESHOLD_u = 7 / 255;
  const THRESHOLD_v = 6 / 255;
  const threshold = OPTS.threshold / 255;
  const { data, width, height } = src;
  const ONEo255 = 1/255;
  function isSimilar(aidx, bidx) {
    const yA = 0.299 * ONEo255*data[aidx+0] + 0.587 * ONEo255*data[aidx+1] + 0.114 * ONEo255*data[aidx+2];
    const uA = 0.493 * (ONEo255*data[aidx+2] - yA);
    const vA = 0.877 * (ONEo255*data[aidx+0] - yA);
    const yB = 0.299 * ONEo255*data[bidx+0] + 0.587 * ONEo255*data[bidx+1] + 0.114 * ONEo255*data[bidx+2];
    const uB = 0.493 * (ONEo255*data[bidx+2] - yB);
    const vB = 0.877 * (ONEo255*data[bidx+0] - yB);
    if (abs(ONEo255*data[aidx+3] - ONEo255*data[bidx+3]) <= THRESHOLD_a * threshold) {
      if (ONEo255*data[aidx+3] + ONEo255*data[bidx+3] <= THRESHOLD_a * threshold) {
        // treat all alpha=0 pixels as similar, regardless of color
        // note: need an option for this if processing images with masks or premultiplied alpha
        return true;
      }
      if (abs(yA - yB) <= THRESHOLD_y * threshold) {
        if (abs(uA - uB) <= THRESHOLD_u * threshold) {
          if (abs(vA - vB) <= THRESHOLD_v * threshold) {
            return true;
          }
        }
      }
    }
    return false;
  }

  let colors_used = {};
  function uniqueColor(rgb) {
    let quant = [floor(rgb[0] / 4), floor(rgb[1] / 4), floor(rgb[2] / 4)];
    while (colors_used[quant.join(',')]) {
      let idx = floor(random() * 3);
      if (quant[idx] === 15) {
        quant[idx]--;
      } else if (quant[idx] === 0) {
        quant[idx]++;
      } else {
        quant[idx] += random() < 0.5 ? 1 : -1;
      }
    }
    colors_used[quant.join(',')] = true;
    return [quant[0] * 4, quant[1] * 4, quant[2] * 4, rgb[3]];
  }
  let dst = new PNG({ width, height, colorType: PNG_RGBA });
  let done = Buffer.alloc(width * height);
  const DX = [-1, -1, -1, 0, 0, 1, 1, 1];
  const DY = [-1, 0, 1, -1, 1, -1, 0, 1];
  function fill(x0, y0, coloridx) {
    coloridx *= 4;
    let color = [data[coloridx], data[coloridx+1], data[coloridx+2], data[coloridx+3]];
    color = uniqueColor(color);
    let todo = [];
    function push(xx, yy) {
      let idx = xx + yy * width
      done[idx] = true;
      for (let ii = 0; ii < 4; ++ii) {
        dst.data[idx * 4 + ii] = color[ii];
      }
      todo.push([xx, yy]);
    }
    push(x0, y0);
    while (todo.length) {
      let pos = todo.pop();
      let fillidx = (pos[0] + pos[1] * width) * 4;
      for (let ii = 0; ii < DX.length; ++ii) {
        let xx = pos[0] + DX[ii];
        let yy = pos[1] + DY[ii];
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) {
          continue;
        }
        let idx = xx + yy * width;
        if (done[idx]) {
          continue;
        }
        if (isSimilar(idx * 4, fillidx)) {
          push(xx, yy);
        }
      }
    }
  }
  for (let yy = 0; yy < height; ++yy) {
    for (let xx = 0; xx < width; ++xx) {
      let idx = xx + yy * width;
      if (done[idx]) {
        continue;
      }
      fill(xx, yy, idx);
    }
  }
  fs.writeFileSync(sim_name, PNG.sync.write(dst));
}

let out_name = __dirname + '/' + FILENAME + '-out.png';
let src = PNG.sync.read(fs.readFileSync(__dirname + '/' + FILENAME + '.png'));
if (MAKE_SIMILARITY) {
  generateSimilarityMask(src);
}
let src_similarity = USE_SIMILARITY ? PNG.sync.read(fs.readFileSync(sim_name)) : undefined;
const { scale } = OPTS;
let res = scaleImage({
  data: src.data, // Buffer
  width: src.width,
  height: src.height,
}, {
  ...OPTS,
  height: round(src.height * scale),
  ...(USE_SIMILARITY ? {
    threshold: 3,
    similarity: src_similarity.data,
  } : {
    threshold: OPTS.threshold,
  }),
});

let dst = new PNG({ width: round(src.width * scale), height: round(src.height * scale), colorType: PNG_RGBA });
assert.equal(res.data.length, dst.data.length);
res.data.copy(dst.data);
fs.writeFileSync(out_name, PNG.sync.write(dst));

console.log('Done.');
