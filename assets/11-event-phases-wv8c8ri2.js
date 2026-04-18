var e=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<title>Tutorial: Event Phases — VC Event Manager</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#1a1a2e;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:24px 16px 40px}
h1.page-head{color:#fff;font-size:15px;font-weight:600;margin-bottom:20px;opacity:.7;letter-spacing:.5px;text-transform:uppercase}
.phone{width:340px;background:#0f0e14;border-radius:44px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08);position:relative;display:flex;flex-direction:column}
.notch{background:#0f0e14;height:36px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px}
.notch-pill{width:100px;height:8px;background:#1a1a1a;border-radius:4px}
.screen{flex:1;overflow:hidden;position:relative;background:#0f0e14;min-height:600px}
.slide{position:absolute;inset:0;transition:opacity .35s,transform .35s;opacity:0;transform:translateX(30px);pointer-events:none;display:flex;flex-direction:column}
.slide.active{opacity:1;transform:none;pointer-events:all}
.slide.out{opacity:0;transform:translateX(-30px)}
.home-bar{height:20px;display:flex;align-items:center;justify-content:center}
.home-pill{width:100px;height:4px;background:rgba(255,255,255,.2);border-radius:2px}
.page-bg{flex:1;padding:20px;background:#0f0e14;display:flex;flex-direction:column;gap:10px;overflow-y:auto}
.back-row{display:flex;align-items:center;gap:10px}
.back-btn{width:36px;height:36px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);flex-shrink:0}
.back-btn svg{width:16px;height:16px}
.page-title{font-size:20px;font-weight:700;color:#fff}
.section-head{font-size:11px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.8px;margin-top:4px}
/* Phase timeline */
.phase-timeline{display:flex;flex-direction:column;gap:0}
.phase-row{display:flex;gap:12px;position:relative}
.phase-row:not(:last-child)::before{content:'';position:absolute;left:11px;top:24px;bottom:-2px;width:2px;background:rgba(255,255,255,.08);z-index:0}
.phase-dot{width:22px;height:22px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;z-index:1;margin-top:1px}
.phase-dot.done{background:#10b981;color:#fff}
.phase-dot.current{background:#7c5cbf;color:#fff;box-shadow:0 0 0 3px rgba(124,92,191,.3)}
.phase-dot.upcoming{background:rgba(255,255,255,.1);color:rgba(255,255,255,.4)}
.phase-info{flex:1;padding-bottom:14px}
.phase-name{font-size:13px;font-weight:600;color:rgba(255,255,255,.85)}
.phase-name.current{color:#c4b5fd}
.phase-name.done{color:rgba(255,255,255,.45)}
.phase-desc{font-size:11px;color:rgba(255,255,255,.35);margin-top:2px;line-height:1.4}
/* Phase selector (dropdown) */
.phase-select-list{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden}
.phase-option{padding:13px 16px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;cursor:pointer}
.phase-option:last-child{border-bottom:none}
.phase-opt-name{font-size:13px;color:rgba(255,255,255,.7)}
.phase-opt-active{font-size:13px;color:#c4b5fd;font-weight:600}
.phase-check{width:20px;height:20px;background:#7c5cbf;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700}
/* Current phase badge on event card */
.event-header{background:rgba(124,92,191,.1);border:1px solid rgba(124,92,191,.25);border-radius:16px;padding:16px}
.event-h-name{font-size:18px;font-weight:700;color:#fff;margin-bottom:2px}
.event-h-date{font-size:12px;color:rgba(255,255,255,.45)}
.event-h-phase{display:inline-flex;align-items:center;gap:6px;background:rgba(124,92,191,.25);border-radius:8px;padding:5px 10px;margin-top:10px}
.event-h-dot{width:7px;height:7px;border-radius:50%;background:#c4b5fd}
.event-h-phase-label{font-size:12px;font-weight:700;color:#c4b5fd}
.advance-btn{width:100%;background:#7c5cbf;color:#fff;border:none;border-radius:14px;padding:14px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
.advance-btn svg{width:14px;height:14px}
/* Archive zone */
.archive-banner{background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px}
.archive-title{font-size:13px;font-weight:600;color:#f87171}
.archive-body{font-size:12px;color:rgba(239,68,68,.6);line-height:1.5}
.archive-btn{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#f87171;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;text-align:center}
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
<h1 class="page-head">Tutorial · Event Phases</h1>

<div class="phone">
  <div class="notch"><div class="notch-pill"></div></div>
  <div class="screen">

    <!-- Slide 0: Event phase timeline overview -->
    <div class="slide active" id="slide-0">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Event Phases</div>
        </div>
        <div class="phase-timeline">
          <div class="phase-row">
            <div class="phase-dot done">✓</div>
            <div class="phase-info"><div class="phase-name done">Planning</div><div class="phase-desc">Internal setup. No public content.</div></div>
          </div>
          <div class="phase-row">
            <div class="phase-dot done">✓</div>
            <div class="phase-info"><div class="phase-name done">Save the Date</div><div class="phase-desc">Date announced. No lineup yet.</div></div>
          </div>
          <div class="phase-row">
            <div class="phase-dot current">●</div>
            <div class="phase-info"><div class="phase-name current">Lineup Phase 1</div><div class="phase-desc">First wave announced publicly.</div></div>
          </div>
          <div class="phase-row">
            <div class="phase-dot upcoming">○</div>
            <div class="phase-info"><div class="phase-name">Presale</div><div class="phase-desc">Tickets available to subscribers.</div></div>
          </div>
          <div class="phase-row">
            <div class="phase-dot upcoming">○</div>
            <div class="phase-info"><div class="phase-name">On Sale</div><div class="phase-desc">Tickets on general sale.</div></div>
          </div>
          <div class="phase-row">
            <div class="phase-dot upcoming">○</div>
            <div class="phase-info"><div class="phase-name">Lineup Phase 2</div><div class="phase-desc">Second wave announced.</div></div>
          </div>
          <div class="phase-row">
            <div class="phase-dot upcoming">○</div>
            <div class="phase-info"><div class="phase-name">Set Times Live</div><div class="phase-desc">Schedule published.</div></div>
          </div>
          <div class="phase-row">
            <div class="phase-dot upcoming">○</div>
            <div class="phase-info"><div class="phase-name">Event Day</div></div>
          </div>
          <div class="phase-row">
            <div class="phase-dot upcoming">○</div>
            <div class="phase-info"><div class="phase-name">Post-Event / Archived</div></div>
          </div>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 1: Event detail with current phase + advance button -->
    <div class="slide" id="slide-1">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">CRSSD Spring '25</div>
        </div>
        <div class="event-header">
          <div class="event-h-name">CRSSD Spring 2025</div>
          <div class="event-h-date">March 1–2, 2025 · Waterfront Park</div>
          <div class="event-h-phase">
            <div class="event-h-dot"></div>
            <div class="event-h-phase-label">Lineup Phase 1</div>
          </div>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,.4);line-height:1.5">The phase controls what's publicly visible on the website. Advancing moves the event to the next stage of the lifecycle.</div>
        <button class="advance-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Advance to Presale
        </button>
        <div style="font-size:11px;color:rgba(255,255,255,.3);text-align:center">Or select a specific phase below</div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 2: Phase selector -->
    <div class="slide" id="slide-2">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Change Phase</div>
        </div>
        <div class="phase-select-list">
          <div class="phase-option"><div class="phase-opt-name" style="color:rgba(255,255,255,.4)">Planning</div></div>
          <div class="phase-option"><div class="phase-opt-name" style="color:rgba(255,255,255,.4)">Save the Date</div></div>
          <div class="phase-option"><div class="phase-opt-active">Lineup Phase 1</div><div class="phase-check">✓</div></div>
          <div class="phase-option"><div class="phase-opt-name">Presale</div></div>
          <div class="phase-option"><div class="phase-opt-name">On Sale</div></div>
          <div class="phase-option"><div class="phase-opt-name">Lineup Phase 2</div></div>
          <div class="phase-option"><div class="phase-opt-name">Set Times Live</div></div>
          <div class="phase-option"><div class="phase-opt-name">Event Day</div></div>
          <div class="phase-option"><div class="phase-opt-name">Post-Event</div></div>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 3: Archive event -->
    <div class="slide" id="slide-3">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">CRSSD Spring '25</div>
        </div>
        <div class="event-header" style="border-color:rgba(255,255,255,.1);background:rgba(255,255,255,.04)">
          <div class="event-h-name">CRSSD Spring 2025</div>
          <div class="event-h-date">March 1–2, 2025 · Waterfront Park</div>
          <div class="event-h-phase" style="background:rgba(255,255,255,.08)">
            <div class="event-h-dot" style="background:rgba(255,255,255,.4)"></div>
            <div class="event-h-phase-label" style="color:rgba(255,255,255,.5)">Post-Event</div>
          </div>
        </div>
        <div class="archive-banner">
          <div class="archive-title">🗃 Archive This Event</div>
          <div class="archive-body">Archiving sets the event to Post-Event status and drafts all associated lineup slots. Artists remain published. This action can be undone.</div>
          <div class="archive-btn">Archive Event</div>
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,.3);line-height:1.5">Archived events move to the bottom of the event list and are excluded from the active event switcher.</div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

  </div>
</div>

<div class="step-panel">
  <div class="step-number" id="stepNum">Step 1 of 4</div>
  <div class="step-title" id="stepTitle">The Phase Lifecycle</div>
  <div class="step-body" id="stepBody">Every event moves through a fixed set of phases from Planning to Archived. The phase controls what's publicly visible on the website and signals where the event is in its lifecycle. Phases always move forward — you can jump ahead but not backward.</div>
  <div class="step-tip" id="stepTip">Phases aren't just labels — the website can conditionally show or hide content based on the current phase. For example, set times only appear once the event reaches "Set Times Live."</div>
  <div class="step-nav">
    <button class="btn-prev" id="btnPrev" onclick="prev()" disabled>← Back</button>
    <button class="btn-next" id="btnNext" onclick="next()">Next →</button>
  </div>
  <div class="progress-dots" id="dots"></div>
</div>

<script>
const steps=[
  {title:"The Phase Lifecycle",body:"Every event moves through a fixed set of phases from Planning to Archived. The phase controls what's publicly visible on the website and signals where the event is in its lifecycle. Phases always move forward — you can jump ahead but not backward.",tip:"Phases aren't just labels — the website can conditionally show or hide content based on the current phase. For example, set times only appear once the event reaches Set Times Live."},
  {title:"Advancing the Phase",body:"From the event detail page, tap <strong>Advance to [Next Phase]</strong> to move forward one step. The button always shows the next phase in the sequence, so there's no guesswork. The change writes directly to WordPress via the REST API.",tip:"Advancing the phase is immediate — there's no confirmation step. Make sure your content is ready before advancing, especially for public-facing phases like Lineup Phase 1."},
  {title:"Jump to Any Phase",body:"If you need to skip ahead — or set a specific phase rather than advancing sequentially — tap the phase name to open the full phase picker. Select any phase in the list. This is useful when setting up an event for the first time.",tip:"You can also go back one phase if you advanced by mistake — just tap the phase picker and select the previous one. The phase isn't locked until Archived."},
  {title:"Archiving an Event",body:"Once an event has wrapped, use <strong>Archive Event</strong> to close it out. Archiving sets the phase to Post-Event and drafts all lineup slots (but leaves artists published). Archived events drop out of the active switcher and move to the bottom of the list.",tip:"Archiving doesn't delete anything — it's a status change. Artists stay published on the site. Lineup slots go to Draft so they stop appearing in the schedule display."}
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