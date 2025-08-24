const fileInput = document.getElementById('fileInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const output = document.getElementById('output');


analyzeBtn.onclick = async () => {
const f = fileInput.files[0];
if (!f) return alert('Pick a file first');
const fd = new FormData();
fd.append('file', f);
const url = f.type.startsWith('video/') ? '/analyze-video' : '/analyze-image';
output.innerHTML = '<em>Analyzing...</em>';
try {
const res = await fetch(url, { method: 'POST', body: fd });
const json = await res.json();
renderResult(json);
} catch (e) {
output.innerHTML = '<b>Error:</b> ' + e.message;
}
}


function renderResult(r) {
const score = r.score || 0;
const isLikelyFake = score > 50;
output.innerHTML = `
<div class="result ${isLikelyFake ? 'high' : 'low'}">
<h3>Result — ${isLikelyFake ? 'Suspected Deepfake' : 'Low suspicion'}</h3>
<p><b>Score:</b> ${score}/100</p>
<p><b>Reasons:</b></p>
<ul>
${ (r.reasons || []).map(x=>`<li>${x}</li>`).join('\n') }
</ul>
<pre style="white-space:pre-wrap">${JSON.stringify(r, null, 2)}</pre>
</div>
`;
}
