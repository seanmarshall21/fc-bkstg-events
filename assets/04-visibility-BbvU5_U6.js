var e=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<title>Tutorial: Visibility & Confidential — VC Event Manager</title>
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
.page-bg{flex:1;padding:24px 20px 20px;background:#0f0e14;display:flex;flex-direction:column;overflow-y:auto}
.back-row{display:flex;align-items:center;gap:10px;margin-bottom:20px}
.back-btn{width:36px;height:36px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);flex-shrink:0}
.back-btn svg{width:16px;height:16px}
.page-title{font-size:20px;font-weight:700;color:#fff}
/* Settings-style list */
.section-label{font-size:11px;font-weight:600;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.8px;margin:16px 0 8px}
.settings-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden;margin-bottom:4px}
.setting-row{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06)}
.setting-row:last-child{border-bottom:none}
.setting-label{font-size:14px;color:rgba(255,255,255,.85)}
.setting-sub{font-size:11px;color:rgba(255,255,255,.35);margin-top:2px}
.toggle{width:42px;height:24px;border-radius:12px;position:relative;flex-shrink:0;transition:background .2s}
.toggle.on{background:#7c5cbf}
.toggle.off{background:rgba(255,255,255,.15)}
.toggle-thumb{position:absolute;top:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.toggle.on .toggle-thumb{left:21px}
.toggle.off .toggle-thumb{left:3px}
/* Confidential screen */
.conf-screen{flex:1;display:flex;flex-direction:column;padding:24px 20px}
.conf-banner{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:14px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px}
.conf-icon{font-size:20px;flex-shrink:0}
.conf-text{font-size:12px;color:rgba(239,68,68,.9);line-height:1.5}
.conf-text strong{color:#f87171}
.conf-list-item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:12px 14px;margin-bottom:8px}
.conf-item-name{font-size:13px;font-weight:600;color:rgba(255,255,255,.8)}
.conf-item-sub{font-size:11px;color:rgba(255,255,255,.3);margin-top:2px}
.lock-badge{font-size:10px;font-weight:700;background:rgba(239,68,68,.2);color:#f87171;border-radius:6px;padding:2px 7px;margin-left:6px}
/* Artist detail with confidential field */
.detail-screen{flex:1;display:flex;flex-direction:column;padding:24px 20px;gap:12px}
.detail-photo{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#7c5cbf,#a78bfa);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;margin-bottom:4px;align-self:center}
.detail-name{font-size:18px;font-weight:700;color:#fff;text-align:center}
.detail-origin{font-size:12px;color:rgba(255,255,255,.4);text-align:center;margin-bottom:8px}
.field-row{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 14px}
.field-row-label{font-size:11px;color:rgba(255,255,255,.4);margin-bottom:3px}
.field-row-value{font-size:13px;color:rgba(255,255,255,.85)}
.field-row.locked{border-color:rgba(239,68,68,.2);background:rgba(239,68,68,.05)}
.field-row.locked .field-row-label{color:rgba(239,68,68,.6)}
.field-row.locked .field-row-value{color:#f87171}
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
<h1 class="page-head">Tutorial · Visibility & Confidential</h1>

<div class="phone">
  <div class="notch"><div class="notch-pill"></div></div>
  <div class="screen">

    <!-- Slide 0: Settings visibility toggles -->
    <div class="slide active" id="slide-0">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Settings</div>
        </div>
        <div class="section-label">Module Visibility</div>
        <div class="settings-card">
          <div class="setting-row">
            <div><div class="setting-label">Artists</div></div>
            <div class="toggle on"><div class="toggle-thumb"></div></div>
          </div>
          <div class="setting-row">
            <div><div class="setting-label">Lineup</div></div>
            <div class="toggle on"><div class="toggle-thumb"></div></div>
          </div>
          <div class="setting-row">
            <div><div class="setting-label">Sponsors</div></div>
            <div class="toggle off"><div class="toggle-thumb"></div></div>
          </div>
          <div class="setting-row">
            <div><div class="setting-label">Events</div></div>
            <div class="toggle on"><div class="toggle-thumb"></div></div>
          </div>
        </div>
        <div class="section-label">Access</div>
        <div class="settings-card">
          <div class="setting-row">
            <div>
              <div class="setting-label">Confidential Mode</div>
              <div class="setting-sub">Hides sensitive internal fields</div>
            </div>
            <div class="toggle off"><div class="toggle-thumb"></div></div>
          </div>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 1: Confidential mode ON -->
    <div class="slide" id="slide-1">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Settings</div>
        </div>
        <div class="section-label">Module Visibility</div>
        <div class="settings-card">
          <div class="setting-row">
            <div><div class="setting-label">Artists</div></div>
            <div class="toggle on"><div class="toggle-thumb"></div></div>
          </div>
          <div class="setting-row">
            <div><div class="setting-label">Lineup</div></div>
            <div class="toggle on"><div class="toggle-thumb"></div></div>
          </div>
          <div class="setting-row">
            <div><div class="setting-label">Sponsors</div></div>
            <div class="toggle off"><div class="toggle-thumb"></div></div>
          </div>
          <div class="setting-row">
            <div><div class="setting-label">Events</div></div>
            <div class="toggle on"><div class="toggle-thumb"></div></div>
          </div>
        </div>
        <div class="section-label">Access</div>
        <div class="settings-card">
          <div class="setting-row">
            <div>
              <div class="setting-label">Confidential Mode</div>
              <div class="setting-sub">Hides sensitive internal fields</div>
            </div>
            <div class="toggle on"><div class="toggle-thumb"></div></div>
          </div>
        </div>
        <div class="conf-banner" style="margin-top:12px">
          <div class="conf-icon">🔒</div>
          <div class="conf-text"><strong>Confidential Mode On</strong> — Internal fees, notes, and deal terms are hidden across all modules.</div>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 2: Confidential view — artist list with redacted fields -->
    <div class="slide" id="slide-2">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Artist Detail</div>
        </div>
        <div class="detail-photo">D</div>
        <div class="detail-name">DJ Deepgroove</div>
        <div class="detail-origin">Los Angeles, CA</div>
        <div class="field-row">
          <div class="field-row-label">Booking Status</div>
          <div class="field-row-value">Confirmed ✓</div>
        </div>
        <div class="field-row">
          <div class="field-row-label">Stage</div>
          <div class="field-row-value">Main Stage</div>
        </div>
        <div class="field-row">
          <div class="field-row-label">Set Time</div>
          <div class="field-row-value">Saturday 9:00 PM – 11:00 PM</div>
        </div>
        <div class="field-row locked">
          <div class="field-row-label">Booking Fee <span class="lock-badge">CONFIDENTIAL</span></div>
          <div class="field-row-value">•••••••</div>
        </div>
        <div class="field-row locked">
          <div class="field-row-label">Internal Notes <span class="lock-badge">CONFIDENTIAL</span></div>
          <div class="field-row-value">•••••••••••••</div>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 3: Confidential section in nav -->
    <div class="slide" id="slide-3">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">CRSSD Festival</div>
        </div>
        <div class="section-label">Content Modules</div>
        <div class="settings-card" style="margin-bottom:12px">
          <div class="setting-row">
            <div class="setting-label">Artists</div>
            <div style="color:rgba(255,255,255,.3);font-size:12px">42 →</div>
          </div>
          <div class="setting-row">
            <div class="setting-label">Lineup</div>
            <div style="color:rgba(255,255,255,.3);font-size:12px">38 →</div>
          </div>
          <div class="setting-row">
            <div class="setting-label">Sponsors</div>
            <div style="color:rgba(255,255,255,.3);font-size:12px">12 →</div>
          </div>
        </div>
        <div class="section-label">Internal</div>
        <div class="settings-card">
          <div class="setting-row" style="border-color:rgba(239,68,68,.15)">
            <div>
              <div class="setting-label" style="color:#f87171">🔐 Confidential</div>
              <div class="setting-sub">Deal terms, fees, private notes</div>
            </div>
            <div style="color:rgba(239,68,68,.4);font-size:12px">→</div>
          </div>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

  </div>
</div>

<div class="step-panel">
  <div class="step-number" id="stepNum">Step 1 of 4</div>
  <div class="step-title" id="stepTitle">Module Visibility Toggles</div>
  <div class="step-body" id="stepBody">In <strong>Settings → Module Visibility</strong>, you can turn individual modules on or off. If a module isn't relevant for your site, hiding it keeps the interface clean without removing any data.</div>
  <div class="step-tip" id="stepTip">Visibility settings are per-device. Turning off Sponsors on your phone doesn't affect what your colleagues see on theirs.</div>
  <div class="step-nav">
    <button class="btn-prev" id="btnPrev" onclick="prev()" disabled>← Back</button>
    <button class="btn-next" id="btnNext" onclick="next()">Next →</button>
  </div>
  <div class="progress-dots" id="dots"></div>
</div>

<script>
const steps=[
  {title:"Module Visibility Toggles",body:"In <strong>Settings → Module Visibility</strong>, you can turn individual modules on or off. If a module isn't relevant for your site, hiding it keeps the interface clean without removing any data.",tip:"Visibility settings are per-device. Turning off Sponsors on your phone doesn't affect what your colleagues see on theirs."},
  {title:"Confidential Mode",body:"Flip <strong>Confidential Mode</strong> on when you're showing the app to someone who shouldn't see internal details — booking fees, deal terms, or private production notes. A red banner confirms it's active.",tip:"This is perfect for artist-facing meetings or sponsor walkthroughs. Everything still saves normally — you're just hiding certain fields from view."},
  {title:"What Gets Hidden",body:"With Confidential Mode on, fields tagged as internal — like <strong>Booking Fee</strong> and <strong>Internal Notes</strong> — are replaced with ••••• in artist and event detail views. Public-facing fields like stage and set time remain visible.",tip:"Which fields are confidential is controlled by the ACF field group setup in WordPress. Any field can be marked internal by adding it to the right group."},
  {title:"Confidential Section",body:"The <strong>Confidential</strong> section in the site dashboard gives direct access to sensitive data — deal terms, fees, and private notes — all in one place. It's separate from the main content modules so it's easy to keep off-screen.",tip:"You can require a device passcode to access the Confidential section — set this up in Settings → Security."}
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