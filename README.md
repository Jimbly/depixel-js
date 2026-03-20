Kopf-Lischinski "Depixelizing Pixel Art" for Node.js
====================================================

Based on the following paper:
* [Depixelizing Pixel Art](https://johanneskopf.de/publications/pixelart/) by Johannes Kopf & Dani Lischinski

And the [source code](https://github.com/falichs/Depixelizing-Pixel-Art-on-GPUs) included with this paper:
* [Depixelizing Pixel Art on GPUs](https://www.cg.tuwien.ac.at/research/publications/2014/KREUZER-2014-DPA/) by Felix Kreuzer

Improvements upon original GPU version:
* Add a threshold parameter to adjust how close two colors need to be to be consider similar
* Better handle alpha channels (treat as dissimilar from non-transparent pixels)
* Fix stretching/scaling due to texel misalignment
* Add option to pass in a similarity map
  * Relatedly, renderMode:similarityMask outputs a scaled up similarity map (for use in post-processing, etc)

Notes
* Original GPU code is MIT licensed, the same license may apply here, all original code in this project is additionally released under the MIT License
* Most GPU code semi-automatically converted to JavaScript by Codex (AI)
* Example below is expanded to 12x via Depixel and then shrunk by 2x with linear filtering (e.g. 2xAA)

<img src="https://github.com/Jimbly/depixel-js/blob/HEAD/test/test-in-6x-nearest.png"><img src="https://github.com/Jimbly/depixel-js/blob/HEAD/test/test-out-6x-bilinear.png">

## API
```ts
type Image = {
  data: Buffer; // Or Uint8Array - pixels in RGBA byte order
  width: number;
  height: number;
  similarityData?: Buffer;
};

type Opts = {
  height: number;
  threshold?: number; // 0..255, lower = fewer similarity edges; default 255
  // borderPx - pad input with this many pixels (1-2) - useful with
  //   `threshold=0` for complete hard edges
  borderPx?: number;
  // if `similarity` specified, uses values here instead or RGBA values to
  //   determine similarity.  Note: `threshold` (default 3) is used against sum
  //   of RGB differences in this buffer instead the default of using a
  //   perceptual threshold based on color
  // note: color still impacts shape of splines
  similarity?: Buffer;
  // if `outputSimilarityMask` and `similarity` is specified,
  //   then `similarityData` in the return will contain a scaled up version of
  //   the `similarity` mask (for use in post-processing, etc
  outputSimilarityMask?: boolean; // default false
  renderMode?: 'splines' | 'default'; // default default
  doOpt?: boolean; // default true
}

function scaleImage(src: Image, opts: Opts): Image;
```

## Example usage

```js
const { scaleImage } = require('depixel');

let src = new Uint32Array([
  // White on black "x"
  0xFFFFFFFF, 0x000000FF, 0xFFFFFFFF,
  0x000000FF, 0xFFFFFFFF, 0x000000FF,
  0xFFFFFFFF, 0x000000FF, 0xFFFFFFFF,
]);

let result = scaleImage({
  data: src,
  width: 3,
  height: 3,
}, {
  height: 3 * 6,
});
```

See [test/test.js](test/test.js) for an example including reading and writing from a PNG file.

## Links

* https://johanneskopf.de/publications/pixelart/
* https://github.com/falichs/Depixelizing-Pixel-Art-on-GPUs
* https://www.cg.tuwien.ac.at/research/publications/2014/KREUZER-2014-DPA/
