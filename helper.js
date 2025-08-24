const fs = require('fs');
const jpeg = require('jpeg-js');
const ExifParser = require('exif-parser');
const sharp = require('sharp');


// Simple ELA (Error Level Analysis) for JPEG images.
// Returns an approximation score: higher means more likely edited.
async function elaScoreJPEG(buffer) {
try {
// decode original
const orig = jpeg.decode(buffer, {useTArray: true});
// re-encode at 95% quality
const recompressed = await sharp(buffer).jpeg({quality: 95}).toBuffer();
const rec = jpeg.decode(recompressed, {useTArray: true});


if (!orig || !rec || !orig.data || !rec.data) return null;


const len = Math.min(orig.data.length, rec.data.length);
let sumDiff = 0;
for (let i=0;i<len;i++){
const d = Math.abs(orig.data[i] - rec.data[i]);
sumDiff += d;
}
const avgDiff = sumDiff / (len);
// normalize roughly to 0-255
return avgDiff;
} catch (e) {
console.error('ELA error', e);
return null;
}
}


function extractEXIF(buffer) {
try {
const parser = ExifParser.create(buffer);
const result = parser.parse();
return result.tags || {};
} catch (e) {
return {};
}
}


module.exports = { elaScoreJPEG, extractEXIF };
