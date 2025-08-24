const express = require('express');
// Video analysis endpoint (extract frames and run basic consistency checks)
app.post('/analyze-video', upload.single('file'), async (req, res) => {
const filePath = req.file.path;
const outDir = path.join('uploads', 'frames_' + Date.now());
fs.mkdirSync(outDir);
// extract one frame every 2 seconds
ffmpeg(filePath)
.outputOptions(['-vf', 'fps=1/2'])
.save(path.join(outDir, 'frame-%03d.jpg'))
.on('end', async () => {
try {
const files = fs.readdirSync(outDir).filter(f => f.endsWith('.jpg'));
const elaScores = [];
for (const f of files) {
const buf = fs.readFileSync(path.join(outDir, f));
const ela = await elaScoreJPEG(buf);
if (ela !== null) elaScores.push(ela);
}
// basic metric: variance of ELA across frames
const avg = elaScores.reduce((a,b)=>a+b,0)/Math.max(1, elaScores.length);
const variance = elaScores.reduce((a,b)=>a+(b-avg)*(b-avg),0)/Math.max(1, elaScores.length);


let score = 0;
let reasons = [];
if (avg > 10) { score += 40; reasons.push('High average ELA across frames.'); }
if (variance > 20) { score += 30; reasons.push('Large variance in ELA across frames — inconsistent edits.'); }
if (elaScores.length === 0) { reasons.push('No frames extracted or ELA failed.'); }


if (score > 100) score = 100;


// cleanup
fs.unlinkSync(filePath);
files.forEach(f => fs.unlinkSync(path.join(outDir, f)));
fs.rmdirSync(outDir);


res.json({ type: 'video', score, reasons, avgEla: avg, elaScores });
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Frame analysis failed' });
}
})
.on('error', (err) => {
console.error('ffmpeg error', err);
res.status(500).json({ error: 'FFmpeg failed' });
});
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Server running on', PORT));
