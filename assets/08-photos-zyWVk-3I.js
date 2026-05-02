var e=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<title>Tutorial: Photo Uploads — VC Event Manager</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#1a1a2e;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:24px 16px 40px}
h1.page-head{color:#fff;font-size:15px;font-weight:600;margin-bottom:20px;opacity:.7;letter-spacing:.5px;text-transform:uppercase}
.phone{width:340px;background:#0f0e14;border-radius:44px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08);position:relative;display:flex;flex-direction:column}
.notch{background:#0f0e14;height:36px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px}
.notch-pill{width:100px;height:8px;background:#1a1a1a;border-radius:4px}
.screen{flex:1;overflow:hidden;position:relative;background:#0f0e14;min-height:580px}
.slide{position:absolute;inset:0;transition:opacity .35s,transform .35s;opacity:0;transform:translateX(30px);pointer-events:none;display:flex;flex-direction:column}
.slide.active{opacity:1;transform:none;pointer-events:all}
.slide.out{opacity:0;transform:translateX(-30px)}
.home-bar{height:20px;display:flex;align-items:center;justify-content:center}
.home-pill{width:100px;height:4px;background:rgba(255,255,255,.2);border-radius:2px}
.page-bg{flex:1;padding:20px;background:#0f0e14;display:flex;flex-direction:column;gap:12px;overflow-y:auto}
.back-row{display:flex;align-items:center;gap:10px}
.back-btn{width:36px;height:36px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);flex-shrink:0}
.back-btn svg{width:16px;height:16px}
.page-title{font-size:20px;font-weight:700;color:#fff}
.section-head{font-size:11px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.8px;margin-top:4px}
/* Photo upload area */
.photo-zone{width:100%;aspect-ratio:16/9;border-radius:16px;border:2px dashed rgba(255,255,255,.12);background:rgba(255,255,255,.03);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer}
.photo-zone svg{width:28px;height:28px;color:rgba(255,255,255,.2)}
.photo-zone-label{font-size:13px;color:rgba(255,255,255,.3)}
.photo-zone-sub{font-size:11px;color:rgba(255,255,255,.2)}
/* Artist photo circle version */
.photo-circle-zone{width:80px;height:80px;border-radius:50%;border:2px dashed rgba(255,255,255,.15);background:rgba(255,255,255,.04);display:flex;flex-direction:column;align-items:center;justify-content:center;align-self:center;cursor:pointer}
.photo-circle-zone svg{width:22px;height:22px;color:rgba(255,255,255,.3)}
/* Filled photo */
.photo-filled-rect{width:100%;aspect-ratio:16/9;border-radius:16px;background:linear-gradient(135deg,#1e1b4b 0%,#4c1d95 50%,#7c5cbf 100%);position:relative;overflow:hidden;display:flex;align-items:flex-end}
.photo-filled-overlay{padding:10px 12px;background:linear-gradient(to top, rgba(0,0,0,.6),transparent)}
.photo-filled-name{font-size:13px;font-weight:600;color:#fff}
.photo-actions{position:absolute;top:10px;right:10px;display:flex;gap:6px}
.photo-action-btn{background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:6px 10px;font-size:11px;font-weight:600;color:#fff;cursor:pointer}
/* Progress bar */
.upload-progress{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px}
.progress-label{font-size:12px;color:rgba(255,255,255,.6);display:flex;align-items:center;justify-content:space-between}
.progress-track{height:6px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden}
.progress-fill{height:100%;background:#7c5cbf;border-radius:3px;width:72%}
.progress-fill.done{width:100%;background:#10b981}
/* Format grid */
.format-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.format-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px}
.format-card-name{font-size:12px;font-weight:700;color:rgba(255,255,255,.7);margin-bottom:2px}
.format-card-sub{font-size:11px;color:rgba(255,255,255,.35);line-height:1.4}
/* Media library row */
.media-row{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}
.media-thumb{width:64px;height:64px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,#312e81,#4c1d95);display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(255,255,255,.4)}
.media-thumb.sel{border:2px solid #7c5cbf}
/* Step panel */
.step-panel{width:340px;background:#fff;border-radius:20px;padding:20px;margin-top:16px}
.step-number{font-size:11px;font-weight:700;color:#7c5cbf;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
.step-title{font-size:17px;font-weight:700;color:#111;margin-bottom:8px}
.step-body{font-size:13px;color:#6b7280;line-height:1.6;margin-bottom:16px}
.step-tip{background:#f5f0ff;border-radius:10px;padding:10px 12px;font-size:12px;color:#7c5cbf;line-height:1.5;margin-bottom:16px}
.step-tip::before{content:'💡 '}
.step-nav{display:flex;gap:10px}
.btn-prev{flex:1;background:#f3f4f6;color:#374151;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:600;cursor:pointer}
.btn-next{flex:2;background:#7c5cbf;color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:600;cursor:pointer}
.progress-dots{display:flex;justify-content:center;gap:5px;margin-top:14px}
.dot{width:6px;height:6px;border-radius:50%;background:#e5e7eb;transition:all .2s}
.dot.active{background:#7c5cbf;width:18px;border-radius:3px}
</style>
</head>
<body>
<h1 class="page-head">Tutorial · Photo Uploads</h1>

<div class="phone">
  <div class="notch"><div class="notch-pill"></div></div>
  <div class="screen">

    <!-- Slide 0: Photo upload zone (empty) -->
    <div class="slide active" id="slide-0">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Edit Artist</div>
        </div>
        <div class="section-head">Artist Photo</div>
        <div class="photo-zone">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <div class="photo-zone-label">Tap to upload a photo</div>
          <div class="photo-zone-sub">JPG, PNG · max 10MB</div>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,.4);line-height:1.5">The photo will be uploaded directly to your WordPress media library and attached to this artist post.</div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 1: Uploading in progress -->
    <div class="slide" id="slide-1">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Edit Artist</div>
        </div>
        <div class="section-head">Artist Photo</div>
        <div class="upload-progress">
          <div class="progress-label">
            <span>Uploading artist_photo.jpg</span>
            <span style="color:#7c5cbf">72%</span>
          </div>
          <div class="progress-track"><div class="progress-fill"></div></div>
          <div style="font-size:11px;color:rgba(255,255,255,.3)">Uploading to WordPress media library…</div>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 2: Photo uploaded + preview -->
    <div class="slide" id="slide-2">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Edit Artist</div>
        </div>
        <div class="section-head">Artist Photo</div>
        <div class="photo-filled-rect">
          <div class="photo-actions">
            <div class="photo-action-btn">Replace</div>
            <div class="photo-action-btn" style="color:#f87171">Remove</div>
          </div>
          <div class="photo-filled-overlay">
            <div class="photo-filled-name">DJ Deepgroove</div>
          </div>
        </div>
        <div class="upload-progress">
          <div class="progress-label">
            <span style="color:#34d399">✓ Uploaded successfully</span>
            <span style="color:#34d399">100%</span>
          </div>
          <div class="progress-track"><div class="progress-fill done"></div></div>
          <div style="font-size:11px;color:rgba(255,255,255,.3)">Now attached to this artist in WordPress</div>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 3: Photo sizes / formats info -->
    <div class="slide" id="slide-3">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Photo Formats</div>
        </div>
        <div class="section-head">Recommended Sizes</div>
        <div class="format-grid">
          <div class="format-card">
            <div class="format-card-name">Artist Photo</div>
            <div class="format-card-sub">Square or portrait · 1:1 or 3:4 · min 800px wide</div>
          </div>
          <div class="format-card">
            <div class="format-card-name">Sponsor Logo</div>
            <div class="format-card-sub">Landscape · PNG with transparency preferred</div>
          </div>
          <div class="format-card">
            <div class="format-card-name">Event Key Art</div>
            <div class="format-card-sub">Landscape 16:9 or tall 2:3 · min 1200px</div>
          </div>
          <div class="format-card">
            <div class="format-card-name">Stage Photo</div>
            <div class="format-card-sub">Landscape 16:9 · atmosphere shots work well</div>
          </div>
        </div>
        <div style="background:rgba(124,92,191,.08);border:1px solid rgba(124,92,191,.2);border-radius:12px;padding:10px 12px;font-size:12px;color:#c4b5fd;line-height:1.5">
          WordPress auto-generates thumbnails at multiple sizes. Upload the highest-res version you have — the app and site both pull the right crop automatically.
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

  </div>
</div>

<div class="step-panel">
  <div class="step-number" id="stepNum">Step 1 of 4</div>
  <div class="step-title" id="stepTitle">Tap to Upload</div>
  <div class="step-body" id="stepBody">Every artist, event, and sponsor has a photo field. Tap the upload zone on the edit screen to open your phone's camera roll. Select the image — no resizing needed beforehand.</div>
  <div class="step-tip" id="stepTip">You can upload photos on mobile from your camera roll, or on desktop from your file system. The upload zone works the same on both.</div>
  <div class="step-nav">
    <button class="btn-prev" id="btnPrev" onclick="prev()" disabled>← Back</button>
    <button class="btn-next" id="btnNext" onclick="next()">Next →</button>
  </div>
  <div class="progress-dots" id="dots"></div>
</div>

<script>
const steps=[
  {title:"Tap to Upload",body:"Every artist, event, and sponsor has a photo field. Tap the upload zone on the edit screen to open your phone's camera roll. Select the image — no resizing needed beforehand.",tip:"You can upload photos on mobile from your camera roll, or on desktop from your file system. The upload zone works the same on both."},
  {title:"Direct Upload to WordPress",body:"The photo goes directly to your <strong>WordPress media library</strong> — the app uploads it via the REST API, not through a third-party service. You'll see a progress bar while it uploads. Larger files take longer on slower connections.",tip:"The file limit is 10MB per upload. For hi-res artist photos this is usually fine — if you have a very large RAW file, resize it to web-ready first (2000px wide is plenty)."},
  {title:"Replace or Remove",body:"Once a photo is attached, you'll see a preview with <strong>Replace</strong> and <strong>Remove</strong> buttons. Replacing uploads a new file and detaches the old one. Removing clears the field but doesn't delete the file from the WP media library.",tip:"Photos aren't deleted from WordPress when removed from an artist post. You can always reassign them from the WP media library later if needed."},
  {title:"Recommended Formats",body:"Each content type has its own ideal crop ratio. <strong>Artist photos</strong> are typically square or portrait. <strong>Sponsor logos</strong> should be PNG with a transparent background. <strong>Event key art</strong> works best at 16:9 or 2:3. WordPress generates all the sizes automatically from one upload.",tip:"Always upload the highest resolution you have. WordPress will create web-optimized versions at every needed size — 150px thumbnail, 600px medium, full size."}
];
let current=0;
const dots=document.getElementById('dots');
steps.forEach((_,i)=>{const d=document.createElement('div');d.className='dot'+(i===0?' active':'');dots.appendChild(d)});
function render(){window.scrollTo(0,0);
  const s=steps[current];
  document.getElementById('stepNum').textContent=\`Step \${current+1} of \${steps.length}\`;
  document.getElementById('stepTitle').textContent=s.title;
  document.getElementById('stepBody').innerHTML=s.body;
  document.getElementById('stepTip').textContent=s.tip;
  document.getElementById('btnPrev').disabled=current===0;
  document.getElementById('btnNext').textContent=current===steps.length-1?'Done ✓':'Next →';
  document.querySelectorAll('.dot').forEach((d,i)=>{d.className='dot'+(i===current?' active':'')});
  document.querySelectorAll('.slide').forEach((s,i)=>{s.className='slide'+(i===current?' active':i<current?' out':'')});
}
function next(){if(current<steps.length-1){current++;render();}}
function prev(){if(current>0){current--;render();}}
render();
<\/script>
</body>
</html>
`;export{e as default};