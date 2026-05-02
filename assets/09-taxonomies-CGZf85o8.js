var e=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<title>Tutorial: Tags & Taxonomies — VC Event Manager</title>
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
/* Taxonomy list items */
.tax-item{display:flex;align-items:center;justify-content:space-between;padding:13px 14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px}
.tax-name{font-size:14px;font-weight:600;color:rgba(255,255,255,.85)}
.tax-count{font-size:12px;color:rgba(255,255,255,.35)}
.tax-chevron{color:rgba(255,255,255,.25);font-size:12px}
/* Genre chips in selector */
.genre-grid{display:flex;flex-wrap:wrap;gap:8px}
.g-chip{padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);background:rgba(255,255,255,.05);cursor:pointer}
.g-chip.sel{background:rgba(124,92,191,.2);border-color:#7c5cbf;color:#c4b5fd}
.g-chip.add{border-style:dashed;color:rgba(255,255,255,.3)}
/* Search field */
.search-field{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:11px 14px}
.search-field svg{width:15px;height:15px;color:rgba(255,255,255,.3);flex-shrink:0}
.search-field span{font-size:14px;color:rgba(255,255,255,.3)}
/* New genre form */
.new-genre-form{background:rgba(124,92,191,.08);border:1px solid rgba(124,92,191,.2);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px}
.new-genre-input{background:rgba(255,255,255,.06);border:1px solid rgba(124,92,191,.4);border-radius:10px;padding:11px 12px;font-size:14px;color:#fff}
.new-genre-btn{background:#7c5cbf;color:#fff;border:none;border-radius:10px;padding:11px;font-size:14px;font-weight:600;cursor:pointer}
/* Stage list */
.stage-item{display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px}
.stage-color{width:10px;height:10px;border-radius:50%}
.stage-info{flex:1}
.stage-name{font-size:14px;font-weight:600;color:rgba(255,255,255,.85)}
.stage-count{font-size:11px;color:rgba(255,255,255,.35);margin-top:1px}
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
<h1 class="page-head">Tutorial · Tags & Taxonomies</h1>

<div class="phone">
  <div class="notch"><div class="notch-pill"></div></div>
  <div class="screen">

    <!-- Slide 0: Taxonomy list -->
    <div class="slide active" id="slide-0">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Genres & Stages</div>
        </div>
        <div class="section-head">Taxonomies</div>
        <div class="tax-item">
          <div>
            <div class="tax-name">Genres</div>
            <div class="tax-count">18 genres defined</div>
          </div>
          <div class="tax-chevron">→</div>
        </div>
        <div class="tax-item">
          <div>
            <div class="tax-name">Stages</div>
            <div class="tax-count">4 stages defined</div>
          </div>
          <div class="tax-chevron">→</div>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,.4);line-height:1.6;margin-top:4px">Genres and Stages are shared across all artists and lineup slots on this site. Set them up here first, then assign them when creating content.</div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 1: Genre selector on artist -->
    <div class="slide" id="slide-1">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Genres</div>
        </div>
        <div class="search-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <span>Search genres…</span>
        </div>
        <div class="genre-grid">
          <div class="g-chip sel">Techno</div>
          <div class="g-chip sel">Deep House</div>
          <div class="g-chip">House</div>
          <div class="g-chip">Minimal</div>
          <div class="g-chip">Melodic Techno</div>
          <div class="g-chip">Electronica</div>
          <div class="g-chip">Ambient</div>
          <div class="g-chip">B2B</div>
          <div class="g-chip">Bass</div>
          <div class="g-chip">Indie Dance</div>
          <div class="g-chip add">+ New Genre</div>
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,.3)">Selected genres appear on the artist's public profile and power the genre filter on the website.</div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 2: Adding a new genre -->
    <div class="slide" id="slide-2">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">New Genre</div>
        </div>
        <div class="new-genre-form">
          <div style="font-size:13px;color:#c4b5fd;font-weight:600">Add a new genre</div>
          <div class="new-genre-input">Afro House</div>
          <div class="new-genre-btn">Add Genre</div>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,.4);line-height:1.6">New genres are created as WordPress taxonomy terms. They become available immediately across all artists on this site.</div>
        <div class="section-head" style="margin-top:4px">Existing Genres</div>
        <div class="genre-grid">
          <div class="g-chip">Techno</div>
          <div class="g-chip">Deep House</div>
          <div class="g-chip">House</div>
          <div class="g-chip">Minimal</div>
          <div class="g-chip">Melodic Techno</div>
          <div class="g-chip">Electronica</div>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 3: Stages list -->
    <div class="slide" id="slide-3">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Stages</div>
        </div>
        <div class="stage-item">
          <div class="stage-color" style="background:#7c5cbf"></div>
          <div class="stage-info">
            <div class="stage-name">Ocean Stage</div>
            <div class="stage-count">12 lineup slots</div>
          </div>
          <div style="color:rgba(255,255,255,.25);font-size:12px">→</div>
        </div>
        <div class="stage-item">
          <div class="stage-color" style="background:#0ea5e9"></div>
          <div class="stage-info">
            <div class="stage-name">City Stage</div>
            <div class="stage-count">11 lineup slots</div>
          </div>
          <div style="color:rgba(255,255,255,.25);font-size:12px">→</div>
        </div>
        <div class="stage-item">
          <div class="stage-color" style="background:#10b981"></div>
          <div class="stage-info">
            <div class="stage-name">Harbor Stage</div>
            <div class="stage-count">8 lineup slots</div>
          </div>
          <div style="color:rgba(255,255,255,.25);font-size:12px">→</div>
        </div>
        <div class="stage-item" style="border-style:dashed;background:transparent">
          <div style="font-size:13px;color:rgba(255,255,255,.3)">+ Add Stage</div>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,.4);line-height:1.6;margin-top:4px">Stages appear in the lineup slot editor and power the stage-filter view on the website.</div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

  </div>
</div>

<div class="step-panel">
  <div class="step-number" id="stepNum">Step 1 of 4</div>
  <div class="step-title" id="stepTitle">What Are Taxonomies?</div>
  <div class="step-body" id="stepBody">Genres and Stages are <strong>taxonomies</strong> — shared lists that artists and lineup slots draw from. They live in your WordPress database and power filtering on the live website. Set them up once and they're available across all content.</div>
  <div class="step-tip" id="stepTip">Taxonomies are site-specific — CRSSD and Proper NYE have separate genre lists, since each site has its own WordPress install.</div>
  <div class="step-nav">
    <button class="btn-prev" id="btnPrev" onclick="prev()" disabled>← Back</button>
    <button class="btn-next" id="btnNext" onclick="next()">Next →</button>
  </div>
  <div class="progress-dots" id="dots"></div>
</div>

<script>
const steps=[
  {title:"What Are Taxonomies?",body:"Genres and Stages are <strong>taxonomies</strong> — shared lists that artists and lineup slots draw from. They live in your WordPress database and power filtering on the live website. Set them up once and they're available across all content.",tip:"Taxonomies are site-specific — CRSSD and Proper NYE have separate genre lists, since each site has its own WordPress install."},
  {title:"Assigning Genres to Artists",body:"When editing an artist, the <strong>Genres</strong> section shows all available genre terms as tappable chips. Selected genres appear highlighted in purple. You can select multiple genres — the artist will appear in all those genre filter groups on the site.",tip:"Genre chips are pulled live from the WordPress taxonomy. If you add a genre in WP Admin, it'll appear in the app immediately on next load."},
  {title:"Adding New Genres",body:"Tap <strong>+ New Genre</strong> in the genre selector to create a new term directly from the app. Type the name and tap Add — it's created in WordPress instantly. No WP Admin needed. New genres appear for all artists on the site right away.",tip:"Genre names should be consistent — 'Deep House' and 'deep-house' are treated as separate terms. Use the same casing every time."},
  {title:"Managing Stages",body:"The <strong>Stages</strong> taxonomy powers lineup slot assignment. Each lineup slot is assigned to a stage, which controls which stage page it appears on. Add, rename, or reorder stages here. The count shows how many slots are currently assigned to each stage.",tip:"Stage names appear on the live website, so finalize them before publishing lineup slots. Renaming a stage updates everywhere it's referenced automatically."}
];
let current=0;
const dots=document.getElementById('dots');
steps.forEach((_,i)=>{const d=document.createElement('div');d.className='dot'+(i===0?' active':'');dots.appendChild(d)});
function render(){
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