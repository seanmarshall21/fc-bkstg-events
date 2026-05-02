var e=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<title>Tutorial: Module Visibility — VC Event Manager</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#1a1a2e;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:24px 16px 40px}
h1.page-head{color:#fff;font-size:15px;font-weight:600;margin-bottom:20px;opacity:.7;letter-spacing:.5px;text-transform:uppercase}
.phone{width:340px;background:#0f0e14;border-radius:44px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08);display:flex;flex-direction:column}
.notch{background:#0f0e14;height:36px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px}
.notch-pill{width:100px;height:8px;background:#1a1a1a;border-radius:4px}
.screen{flex:1;overflow:hidden;position:relative;background:#0f0e14;min-height:580px}
.slide{position:absolute;inset:0;transition:opacity .35s,transform .35s;opacity:0;transform:translateX(30px);pointer-events:none;display:flex;flex-direction:column}
.slide.active{opacity:1;transform:none;pointer-events:all}
.slide.out{opacity:0;transform:translateX(-30px)}
.home-bar{height:20px;display:flex;align-items:center;justify-content:center}
.home-pill{width:100px;height:4px;background:rgba(255,255,255,.2);border-radius:2px}
/* Dashboard */
.dash{flex:1;background:#0f0e14;overflow:hidden}
.top-bar{padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between}
.site-badge{display:flex;align-items:center;gap:8px}
.site-dot{width:28px;height:28px;background:#7c5cbf;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}
.site-name{font-size:13px;font-weight:600;color:#fff}
.chevron{font-size:10px;color:rgba(255,255,255,.4);margin-left:2px}
.gear{width:32px;height:32px;background:rgba(255,255,255,.06);border-radius:9px;display:flex;align-items:center;justify-content:center}
.gear svg{width:16px;height:16px;color:rgba(255,255,255,.5)}
.module-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:6px 14px 14px}
.tile{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;transition:opacity .3s}
.tile.dim{opacity:.25}
.tile-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;font-size:16px}
.tile-label{font-size:12px;font-weight:600;color:#fff}
.tile-desc{font-size:10px;color:rgba(255,255,255,.4);margin-top:2px}
/* Settings */
.settings{flex:1;background:#f7f6f5;overflow:hidden}
.settings-head{padding:16px;background:#f7f6f5}
.settings-title{font-size:18px;font-weight:700;color:#111}
.settings-section{padding:0 16px;margin-bottom:16px}
.section-label{font-size:12px;font-weight:600;color:#6b7280;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px}
.module-row{background:#fff;border-radius:12px;padding:12px;margin-bottom:6px;display:flex;align-items:center;gap:10px;transition:opacity .3s}
.module-row.off{opacity:.4}
.row-icon{font-size:16px;width:24px;text-align:center;flex-shrink:0}
.row-label{flex:1;font-size:13px;font-weight:500;color:#111}
.row-check{width:20px;height:20px;border-radius:50%;background:#7c5cbf;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0}
.row-check.off{background:#e5e7eb}
.row-drag{font-size:16px;color:#9ca3af;margin-left:4px}
.show-all{font-size:12px;color:#7c5cbf;font-weight:600;float:right}
.hint-text{font-size:11px;color:#9ca3af;margin-top:6px}
/* Panel */
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
<h1 class="page-head">Tutorial · Module Visibility & Order</h1>
<div class="phone">
  <div class="notch"><div class="notch-pill"></div></div>
  <div class="screen">

    <!-- Slide 0: Full dashboard -->
    <div class="slide active" id="slide-0">
      <div class="dash">
        <div class="top-bar">
          <div class="site-badge"><div class="site-dot">ZA</div><div class="site-name">Zoo Agency</div><div class="chevron">▾</div></div>
          <div class="gear"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
        </div>
        <div class="module-grid">
          <div class="tile"><div class="tile-icon" style="background:rgba(139,92,246,.15)">🎵</div><div class="tile-label">Artists</div><div class="tile-desc">Profiles & booking</div></div>
          <div class="tile"><div class="tile-icon" style="background:rgba(249,115,22,.15)">📅</div><div class="tile-label">Events</div><div class="tile-desc">Properties & dates</div></div>
          <div class="tile"><div class="tile-icon" style="background:rgba(16,185,129,.15)">🤝</div><div class="tile-label">Sponsors</div><div class="tile-desc">Tiers & logos</div></div>
          <div class="tile"><div class="tile-icon" style="background:rgba(239,68,68,.15)">🔒</div><div class="tile-label">Confidential</div><div class="tile-desc">Visibility controls</div></div>
          <div class="tile"><div class="tile-icon" style="background:rgba(251,191,36,.15)">🎨</div><div class="tile-label">Event Styles</div><div class="tile-desc">Colors & logos</div></div>
          <div class="tile"><div class="tile-icon" style="background:rgba(6,182,212,.15)">🏷️</div><div class="tile-label">Genres</div><div class="tile-desc">Tag management</div></div>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 1: Settings page -->
    <div class="slide" id="slide-1">
      <div class="settings">
        <div class="settings-head">
          <div class="settings-title">Settings</div>
        </div>
        <div class="settings-section">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div class="section-label">Visible Sections</div>
            <div class="show-all">Show All</div>
          </div>
          <div class="module-row"><div class="row-icon">🎵</div><div class="row-label">Artists</div><div class="row-check">✓</div><div class="row-drag">⠿</div></div>
          <div class="module-row"><div class="row-icon">📅</div><div class="row-label">Events</div><div class="row-check">✓</div><div class="row-drag">⠿</div></div>
          <div class="module-row"><div class="row-icon">🤝</div><div class="row-label">Sponsors</div><div class="row-check">✓</div><div class="row-drag">⠿</div></div>
          <div class="module-row"><div class="row-icon">🔒</div><div class="row-label">Confidential</div><div class="row-check">✓</div><div class="row-drag">⠿</div></div>
          <div class="module-row off"><div class="row-icon">🎨</div><div class="row-label">Event Styles</div><div class="row-check off"></div><div class="row-drag">⠿</div></div>
          <div class="module-row off"><div class="row-icon">🏷️</div><div class="row-label">Genres</div><div class="row-check off"></div><div class="row-drag">⠿</div></div>
          <div class="hint-text">Tap to show/hide · Long-press to reorder</div>
        </div>
      </div>
      <div class="home-bar" style="background:#f7f6f5"><div class="home-pill" style="background:rgba(0,0,0,.15)"></div></div>
    </div>

    <!-- Slide 2: After hiding some tiles -->
    <div class="slide" id="slide-2">
      <div class="dash">
        <div class="top-bar">
          <div class="site-badge"><div class="site-dot">ZA</div><div class="site-name">Zoo Agency</div><div class="chevron">▾</div></div>
          <div class="gear"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
        </div>
        <div class="module-grid">
          <div class="tile"><div class="tile-icon" style="background:rgba(139,92,246,.15)">🎵</div><div class="tile-label">Artists</div><div class="tile-desc">Profiles & booking</div></div>
          <div class="tile"><div class="tile-icon" style="background:rgba(249,115,22,.15)">📅</div><div class="tile-label">Events</div><div class="tile-desc">Properties & dates</div></div>
          <div class="tile"><div class="tile-icon" style="background:rgba(16,185,129,.15)">🤝</div><div class="tile-label">Sponsors</div><div class="tile-desc">Tiers & logos</div></div>
          <div class="tile"><div class="tile-icon" style="background:rgba(239,68,68,.15)">🔒</div><div class="tile-label">Confidential</div><div class="tile-desc">Visibility controls</div></div>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

  </div>
</div>

<div class="step-panel">
  <div class="step-number" id="stepNum">Step 1 of 3</div>
  <div class="step-title" id="stepTitle">Your Dashboard Modules</div>
  <div class="step-body" id="stepBody">The home screen shows tiles for every available content module — Artists, Events, Sponsors, Confidentiality, Event Styles, Genres, and more. Each tile takes you into that section.</div>
  <div class="step-tip" id="stepTip">Each site can have a different module configuration. Zoo Agency might show different modules than CRSSD.</div>
  <div class="step-nav">
    <button class="btn-prev" id="btnPrev" onclick="prev()" disabled>← Back</button>
    <button class="btn-next" id="btnNext" onclick="next()">Next →</button>
  </div>
  <div class="progress-dots" id="dots"></div>
</div>
<script>
const steps=[
  {title:"Your Dashboard Modules",body:"The home screen shows tiles for every enabled content module — Artists, Events, Sponsors, Confidentiality, Event Styles, Genres, and more. Each tile navigates into that section.",tip:"Each site can have a different module configuration. Zoo Agency might show different modules than CRSSD."},
  {title:"Manage Visibility in Settings",body:"Go to <strong>Settings → Visible Sections</strong> to control which modules appear on your dashboard. <strong>Tap any row</strong> to toggle it on or off. Disabled rows appear faded.",tip:"Changes are saved automatically and sync across all your devices via Supabase."},
  {title:"Clean, Focused Dashboard",body:"After hiding unused modules, your dashboard is cleaner and faster to navigate. You can always restore hidden modules from Settings — tap <strong>Show All</strong> to re-enable everything at once.",tip:"Long-press any row in the Settings list to drag and reorder modules. The order you set here is the order they appear on the home screen."}
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