var e=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<title>Tutorial: Tags & Taxonomies — VC Event Manager</title>
<style>

*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0eff5;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:24px 16px 40px}
h1.page-head{color:#4b4567;font-size:15px;font-weight:600;margin-bottom:20px;opacity:.7;letter-spacing:.5px;text-transform:uppercase}
.phone{width:340px;background:#1c1c1e;border-radius:44px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.25),0 0 0 1px rgba(0,0,0,.15);display:flex;flex-direction:column}
.notch{background:#1c1c1e;height:36px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px}
.notch-pill{width:100px;height:8px;background:#333;border-radius:4px}
.screen{flex:1;overflow:hidden;position:relative;background:#f9f8fc;min-height:580px}
.slide{position:absolute;inset:0;transition:opacity .35s,transform .35s;opacity:0;transform:translateX(30px);pointer-events:none;display:flex;flex-direction:column}
.slide.active{opacity:1;transform:none;pointer-events:all}
.slide.out{opacity:0;transform:translateX(-30px)}
.home-bar{height:22px;display:flex;align-items:center;justify-content:center;background:#f9f8fc}
.home-pill{width:120px;height:5px;background:#e8e5f0;border-radius:3px}
.app-bar{height:56px;background:rgba(255,255,255,.95);border-bottom:1px solid #e8e5f0;display:flex;align-items:center;justify-content:space-between;padding:0 16px;flex-shrink:0}
.bar-left{display:flex;align-items:center;gap:8px;flex:1}
.bar-logo{width:32px;height:32px;border-radius:10px;background:#f3f1f8;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#7c2dff;overflow:hidden}
.bar-name{font-size:14px;font-weight:600;color:#111827}
.bar-chevron{color:#9ca3af;font-size:10px;margin-left:2px}
.bar-avatar{width:36px;height:36px;border-radius:50%;background:#d97706;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0}
.bottom-nav{background:#2d0b6a;border-radius:14px;margin:0 8px 8px;height:56px;display:flex;align-items:center;justify-content:space-around;flex-shrink:0;padding:0 4px}
.nav-item{display:flex;flex-direction:column;align-items:center;gap:2px;opacity:.4;padding:4px 0;flex:1}
.nav-item.active{opacity:1}
.nav-label{font-size:9px;color:#fff;font-weight:500}
.page-content{flex:1;padding:16px;display:flex;flex-direction:column;overflow-y:auto;background:#f9f8fc}
.step-panel{width:340px;background:#fff;border-radius:20px;padding:20px;margin-top:16px;position:relative;z-index:1}
.step-number{font-size:11px;font-weight:700;color:#7c2dff;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
.step-title{font-size:17px;font-weight:700;color:#111;margin-bottom:8px}
.step-body{font-size:13px;color:#6b7280;line-height:1.6;margin-bottom:16px}
.step-tip{background:#f5f0ff;border-radius:10px;padding:10px 12px;font-size:12px;color:#7c2dff;line-height:1.5;margin-bottom:16px}
.step-tip::before{content:'💡 '}
.step-nav{display:flex;gap:10px}
.btn-prev{flex:1;background:#f3f4f6;color:#374151;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:600;cursor:pointer}
.btn-next{flex:2;background:#7c2dff;color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:600;cursor:pointer}
.progress-dots{display:flex;justify-content:center;gap:5px;margin-top:14px}
.dot{width:6px;height:6px;border-radius:50%;background:#e5e7eb;transition:all .2s}
.dot.active{background:#7c2dff;width:18px;border-radius:3px}
.card{background:#fff;border:1px solid #e8e5f0;border-radius:14px;padding:12px 14px;margin-bottom:8px}
.card-row{display:flex;align-items:center;gap:10px}
.section-label{font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px;margin-top:4px}
.field-group{margin-bottom:10px}
.field-label{font-size:11px;color:#6b7280;font-weight:500;margin-bottom:4px}
.field-input{background:#fff;border:1px solid #e8e5f0;border-radius:10px;padding:11px 12px;font-size:13px;color:#1f2937;width:100%}
.field-input.focused{border-color:#7c2dff;background:#faf5ff}
.field-val{background:#f9f8fc;border:1px solid #e8e5f0;border-radius:10px;padding:10px 12px;font-size:13px;color:#374151}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600}
.badge-green{background:#dcfce7;color:#16a34a}
.badge-amber{background:#fef9c3;color:#ca8a04}
.badge-gray{background:#f3f4f6;color:#6b7280}
.badge-purple{background:#ede5ff;color:#7c2dff}
.mod-tile{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f3f4f6}
.toggle{width:44px;height:26px;border-radius:13px;position:relative;flex-shrink:0}
.toggle.on{background:#7c2dff}
.toggle.off{background:#d1d5db}
.toggle::after{content:'';width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:3px;transition:.2s}
.toggle.on::after{left:21px}
.toggle.off::after{left:3px}
.btn-primary{background:#7c2dff;color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:600;cursor:pointer;width:100%}
.btn-ghost{background:transparent;border:1px solid #e8e5f0;border-radius:12px;padding:11px;font-size:13px;font-weight:600;color:#374151;cursor:pointer;width:100%}
.status-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.status-dot.green{background:#16a34a}
.status-dot.amber{background:#ca8a04}
.phase-pill{display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#ede5ff;color:#7c2dff}
.list-item{background:#fff;border:1px solid #e8e5f0;border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:8px}
.avatar-sq{border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.upload-zone{border:2px dashed #c4b5fd;border-radius:14px;padding:28px 16px;display:flex;flex-direction:column;align-items:center;gap:6px;background:#faf8ff;margin-bottom:12px}
.tag-chip{display:inline-flex;align-items:center;gap:4px;background:#f3f1f8;border-radius:20px;padding:4px 10px;font-size:11px;color:#5b21b6;margin:2px}
.progress-bar-outer{background:#e8e5f0;border-radius:4px;height:6px;margin:6px 0 10px}
.progress-bar-inner{background:#7c2dff;border-radius:4px;height:6px}

</style>
</head>
<body>
<h1 class="page-head">Tutorial · Tags & Taxonomies</h1>
<div class="phone">
  <div class="notch"><div class="notch-pill"></div></div>
  <div class="screen">

    <!-- Slide 0: Home taxonomy tiles -->
    <div class="slide active" id="slide-0">
      <div class="app-bar">
  <div class="bar-left">
    <div class="bar-logo">CF</div>
    <span class="bar-name">CRSSD Festival</span>
    <span class="bar-chevron">▾</span>
  </div>
  <div class="bar-avatar">SM</div>
</div>
      <div class="page-content">
        <div style="font-size:16px;font-weight:700;color:#111;margin-bottom:14px">Taxonomies</div>
        <div class="list-item"><div style="width:40px;height:40px;border-radius:12px;background:#06b6d420;display:flex;align-items:center;justify-content:center;font-size:20px">🏷</div><div style="flex:1"><div style="font-size:13px;font-weight:600;color:#111">Genres</div><div style="font-size:11px;color:#9ca3af">14 genres</div></div><span style="font-size:12px;color:#9ca3af">→</span></div><div class="list-item"><div style="width:40px;height:40px;border-radius:12px;background:#6366f120;display:flex;align-items:center;justify-content:center;font-size:20px">🎪</div><div style="flex:1"><div style="font-size:13px;font-weight:600;color:#111">Stages</div><div style="font-size:11px;color:#9ca3af">3 stages</div></div><span style="font-size:12px;color:#9ca3af">→</span></div>
      </div>
      <div class="bottom-nav"><div class="nav-item active" style="color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg><span class="nav-label">Home</span></div><div class="nav-item" style="color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><span class="nav-label">Search</span></div><div class="nav-item" style="color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span class="nav-label">Faves</span></div><div class="nav-item" style="color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg><span class="nav-label">Settings</span></div></div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>
    <!-- Slide 1: Genre list -->
    <div class="slide" id="slide-1">
      <div class="app-bar">
  <div class="bar-left">
    <div class="bar-logo">CF</div>
    <span class="bar-name">CRSSD Festival</span>
    <span class="bar-chevron">▾</span>
  </div>
  <div class="bar-avatar">SM</div>
</div>
      <div class="page-content">
        <div style="font-size:16px;font-weight:700;color:#111;margin-bottom:14px">Genres</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:14px">
          <span class="tag-chip">House</span><span class="tag-chip">Techno</span><span class="tag-chip">Electronic</span><span class="tag-chip">Deep House</span><span class="tag-chip">Disco</span><span class="tag-chip">Afrobeat</span><span class="tag-chip">Bass</span><span class="tag-chip">Ambient</span><span class="tag-chip">UK Garage</span><span class="tag-chip">Trance</span>
        </div>
        <button class="btn-ghost" style="font-size:12px;padding:10px">+ Add Genre</button>
      </div>
      <div class="bottom-nav"><div class="nav-item active" style="color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg><span class="nav-label">Home</span></div><div class="nav-item" style="color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><span class="nav-label">Search</span></div><div class="nav-item" style="color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span class="nav-label">Faves</span></div><div class="nav-item" style="color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg><span class="nav-label">Settings</span></div></div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>
    <!-- Slide 2: Adding a new genre -->
    <div class="slide" id="slide-2">
      <div class="app-bar">
  <div class="bar-left">
    <div class="bar-logo">CF</div>
    <span class="bar-name">CRSSD Festival</span>
    <span class="bar-chevron">▾</span>
  </div>
  <div class="bar-avatar">SM</div>
</div>
      <div class="page-content">
        <div style="font-size:16px;font-weight:700;color:#111;margin-bottom:14px">Add Genre</div>
        <div class="field-group">
          <div class="field-label">Genre Name</div>
          <div class="field-input focused">Neo Soul</div>
        </div>
        <div class="field-group">
          <div class="field-label">Slug (auto-generated)</div>
          <div class="field-val" style="color:#9ca3af">neo-soul</div>
        </div>
        <button class="btn-primary" style="margin-top:6px">Save Genre</button>
        <div style="margin-top:12px;font-size:11px;color:#6b7280;line-height:1.5">This genre becomes available as a tag option on all artist and lineup records across the site.</div>
      </div>
      <div class="bottom-nav"><div class="nav-item active" style="color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg><span class="nav-label">Home</span></div><div class="nav-item" style="color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><span class="nav-label">Search</span></div><div class="nav-item" style="color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span class="nav-label">Faves</span></div><div class="nav-item" style="color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg><span class="nav-label">Settings</span></div></div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

  </div>
</div>
<div class="step-panel" id="panel-0" style="display:block">
  <div class="step-number">Step 1 of 3</div>
  <div class="step-title">Genres & Stages</div>
  <div class="step-body">The <strong>Genres</strong> and <strong>Stages</strong> modules manage the taxonomy terms used across all artist and lineup records.</div>
  
  <div class="step-nav">
    <button class="btn-prev" id="btn-prev" style="visibility:hidden">← Back</button>
    <button class="btn-next" id="btn-next">Next →</button>
  </div>
  <div class="progress-dots"><div class="dot active"></div><div class="dot"></div><div class="dot"></div></div>
</div>
<div class="step-panel" id="panel-1" style="display:none">
  <div class="step-number">Step 2 of 3</div>
  <div class="step-title">Managing Genres</div>
  <div class="step-body">Tap <strong>Genres</strong> to see all genre tags in use. These are WordPress taxonomy terms — any genre you add here is immediately available in artist and lineup forms.</div>
  
  <div class="step-nav">
    <button class="btn-prev" id="btn-prev" style="visibility:visible">← Back</button>
    <button class="btn-next" id="btn-next">Next →</button>
  </div>
  <div class="progress-dots"><div class="dot"></div><div class="dot active"></div><div class="dot"></div></div>
</div>
<div class="step-panel" id="panel-2" style="display:none">
  <div class="step-number">Step 3 of 3</div>
  <div class="step-title">Adding a New Term</div>
  <div class="step-body">Tap <strong>+ Add Genre</strong>, enter the name, and save. The slug is auto-generated from the name. Same flow works for Stages.</div>
  <div class="step-tip">Terms added here sync directly to WordPress. They appear instantly as options in any field that references that taxonomy.</div>
  <div class="step-nav">
    <button class="btn-prev" id="btn-prev" style="visibility:visible">← Back</button>
    <button class="btn-next" id="btn-next">Done ✓</button>
  </div>
  <div class="progress-dots"><div class="dot"></div><div class="dot"></div><div class="dot active"></div></div>
</div>
<script>

var cur = 0, total = 3;
var slides, panels;
function show(n) {
  if (n < 0 || n >= total) return;
  slides[cur].className = 'slide out';
  panels[cur].style.display = 'none';
  cur = n;
  slides[cur].className = 'slide active';
  panels[cur].style.display = 'block';
  window.scrollTo(0, 0);
}
function init() {
  slides = document.querySelectorAll('.slide');
  panels = document.querySelectorAll('.step-panel');
  document.querySelectorAll('.btn-prev').forEach(function(b) {
    b.addEventListener('click', function() { show(cur - 1); });
  });
  document.querySelectorAll('.btn-next').forEach(function(b) {
    b.addEventListener('click', function() {
      if (cur === total - 1) { window.parent.postMessage('tutorial-done', '*'); } else { show(cur + 1); }
    });
  });
}
window.addEventListener('DOMContentLoaded', init);

<\/script>
</body>
</html>`;export{e as default};