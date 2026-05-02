var e=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<title>Tutorial: Adding Events — VC Event Manager</title>
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
.page-bg{flex:1;padding:20px;background:#0f0e14;display:flex;flex-direction:column;overflow-y:auto;gap:10px}
.back-row{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.back-btn{width:36px;height:36px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);flex-shrink:0}
.back-btn svg{width:16px;height:16px}
.page-title{font-size:20px;font-weight:700;color:#fff}
.section-head{font-size:11px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.8px;margin-top:4px}
/* Event list */
.event-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px}
.event-card.active-event{border-color:#7c5cbf;background:rgba(124,92,191,.1)}
.event-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:2px}
.event-dot.green{background:#10b981}
.event-dot.purple{background:#7c5cbf}
.event-dot.amber{background:#fbbf24}
.event-info{flex:1}
.event-name{font-size:14px;font-weight:600;color:#fff}
.event-date{font-size:11px;color:rgba(255,255,255,.4);margin-top:2px}
.event-phase{font-size:10px;font-weight:700;background:rgba(124,92,191,.25);color:#c4b5fd;border-radius:6px;padding:2px 7px;margin-top:4px;display:inline-block}
/* Form fields */
.field-group{display:flex;flex-direction:column;gap:4px}
.field-label{font-size:12px;color:rgba(255,255,255,.5);font-weight:500}
.field-input{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 14px;font-size:14px;color:#fff}
.field-input.focused{border-color:#7c5cbf;background:rgba(124,92,191,.08)}
.field-input.filled{border-color:rgba(255,255,255,.2);color:rgba(255,255,255,.9)}
.field-hint{font-size:11px;color:rgba(255,255,255,.3);line-height:1.4}
.row-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
/* Add button */
.fab{position:absolute;right:20px;bottom:28px;width:48px;height:48px;background:#7c5cbf;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;box-shadow:0 4px 16px rgba(124,92,191,.5)}
/* Save button */
.save-btn{width:100%;background:#7c5cbf;color:#fff;border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:600;cursor:pointer;margin-top:4px}
/* Event switcher top bar */
.top-switcher{display:flex;align-items:center;justify-content:space-between;padding:12px 20px 0;background:#0f0e14}
.switcher-pill{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:7px 12px;display:flex;align-items:center;gap:6px;flex:1;max-width:220px}
.switcher-label{font-size:12px;font-weight:600;color:#fff;flex:1}
.switcher-chevron{color:rgba(255,255,255,.4);font-size:10px}
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
<h1 class="page-head">Tutorial · Adding Events</h1>

<div class="phone">
  <div class="notch"><div class="notch-pill"></div></div>
  <div class="screen">

    <!-- Slide 0: Event list (active switcher) -->
    <div class="slide active" id="slide-0">
      <div class="top-switcher">
        <div class="switcher-pill">
          <div class="event-dot purple"></div>
          <div class="switcher-label">CRSSD Spring '25</div>
          <div class="switcher-chevron">▾</div>
        </div>
        <div style="width:36px;height:36px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.4);font-size:11px;font-weight:700;margin-left:10px">SS</div>
      </div>
      <div class="page-bg" style="padding-top:12px">
        <div class="section-head">Active</div>
        <div class="event-card active-event">
          <div class="event-dot purple"></div>
          <div class="event-info">
            <div class="event-name">CRSSD Spring '25</div>
            <div class="event-date">March 1–2, 2025 · Waterfront Park</div>
            <div class="event-phase">Lineup Phase 1</div>
          </div>
        </div>
        <div class="section-head">Upcoming</div>
        <div class="event-card">
          <div class="event-dot amber"></div>
          <div class="event-info">
            <div class="event-name">CRSSD Fall '25</div>
            <div class="event-date">September 27–28, 2025</div>
            <div class="event-phase">Planning</div>
          </div>
        </div>
        <div class="event-card">
          <div class="event-dot amber"></div>
          <div class="event-info">
            <div class="event-name">Proper NYE 2025</div>
            <div class="event-date">December 31, 2025</div>
            <div class="event-phase">Planning</div>
          </div>
        </div>
      </div>
      <div class="fab">+</div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 1: New event form — empty -->
    <div class="slide" id="slide-1">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">New Event</div>
        </div>
        <div class="section-head">Basic Info</div>
        <div class="field-group">
          <div class="field-label">Event Name</div>
          <div class="field-input focused"><span style="color:rgba(255,255,255,.3)">e.g. CRSSD Fall 2025</span></div>
        </div>
        <div class="row-2">
          <div class="field-group">
            <div class="field-label">Start Date</div>
            <div class="field-input"><span style="color:rgba(255,255,255,.3)">MM/DD/YYYY</span></div>
          </div>
          <div class="field-group">
            <div class="field-label">End Date</div>
            <div class="field-input"><span style="color:rgba(255,255,255,.3)">MM/DD/YYYY</span></div>
          </div>
        </div>
        <div class="field-group">
          <div class="field-label">Venue / Location</div>
          <div class="field-input"><span style="color:rgba(255,255,255,.3)">Venue name</span></div>
        </div>
        <div class="field-group">
          <div class="field-label">Initial Phase</div>
          <div class="field-input"><span style="color:rgba(255,255,255,.3)">Planning ▾</span></div>
          <div class="field-hint">You can advance this later. Most events start in Planning.</div>
        </div>
        <button class="save-btn" style="opacity:.4" disabled>Create Event</button>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 2: New event form — filled -->
    <div class="slide" id="slide-2">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">New Event</div>
        </div>
        <div class="section-head">Basic Info</div>
        <div class="field-group">
          <div class="field-label">Event Name</div>
          <div class="field-input filled">CRSSD Fall 2025</div>
        </div>
        <div class="row-2">
          <div class="field-group">
            <div class="field-label">Start Date</div>
            <div class="field-input filled">09/27/2025</div>
          </div>
          <div class="field-group">
            <div class="field-label">End Date</div>
            <div class="field-input filled">09/28/2025</div>
          </div>
        </div>
        <div class="field-group">
          <div class="field-label">Venue / Location</div>
          <div class="field-input filled">Waterfront Park, San Diego</div>
        </div>
        <div class="field-group">
          <div class="field-label">Initial Phase</div>
          <div class="field-input filled">Planning ▾</div>
        </div>
        <button class="save-btn">Create Event</button>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 3: Event created — now active in switcher -->
    <div class="slide" id="slide-3">
      <div class="top-switcher">
        <div class="switcher-pill">
          <div class="event-dot amber"></div>
          <div class="switcher-label">CRSSD Fall 2025</div>
          <div class="switcher-chevron">▾</div>
        </div>
        <div style="width:36px;height:36px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.4);font-size:11px;font-weight:700;margin-left:10px">SS</div>
      </div>
      <div class="page-bg" style="padding-top:12px">
        <div class="event-card active-event" style="border-color:rgba(251,191,36,.3);background:rgba(251,191,36,.07)">
          <div class="event-dot amber"></div>
          <div class="event-info">
            <div class="event-name">CRSSD Fall 2025</div>
            <div class="event-date">September 27–28, 2025 · Waterfront Park</div>
            <div class="event-phase">Planning</div>
          </div>
        </div>
        <div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:12px 14px;font-size:12px;color:#34d399;line-height:1.5">
          ✓ <strong>Event created.</strong> Artists, lineup slots, and sponsors you add will be scoped to this event.
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

  </div>
</div>

<div class="step-panel">
  <div class="step-number" id="stepNum">Step 1 of 4</div>
  <div class="step-title" id="stepTitle">Events Are the Scope</div>
  <div class="step-body" id="stepBody">An <strong>Event Property</strong> is the container everything else scopes to — artists, lineup slots, sponsors. One site can have multiple events. The top bar shows which event is active. All list views filter to that event automatically.</div>
  <div class="step-tip" id="stepTip">CRSSD Spring and CRSSD Fall are two separate events on the same site. Switching events changes which artists and lineup slots you're seeing.</div>
  <div class="step-nav">
    <button class="btn-prev" id="btnPrev" onclick="prev()" disabled>← Back</button>
    <button class="btn-next" id="btnNext" onclick="next()">Next →</button>
  </div>
  <div class="progress-dots" id="dots"></div>
</div>

<script>
const steps=[
  {title:"Events Are the Scope",body:"An <strong>Event Property</strong> is the container everything else scopes to — artists, lineup slots, sponsors. One site can have multiple events. The top bar shows which event is active. All list views filter to that event automatically.",tip:"CRSSD Spring and CRSSD Fall are two separate events on the same site. Switching events changes which artists and lineup slots you're seeing."},
  {title:"Create a New Event",body:"Tap the <strong>+</strong> button on the event list screen to open the new event form. Enter the event name, start and end dates, venue, and an initial phase. Most new events start in <strong>Planning</strong>.",tip:"The event name becomes the display name everywhere — in the site switcher, dashboard header, and across all module list headers."},
  {title:"Fill In All Fields",body:"Enter the name, both dates, and venue. The <strong>Initial Phase</strong> dropdown defaults to Planning — this is right for most new events. You can advance the phase anytime from the event detail page later.",tip:"Dates drive the event timeline. Start and end date populate the event card shown to users on the website, so get them right from the start."},
  {title:"Event Now Active",body:"Once created, the new event appears in your list and can be set as the active event via the top switcher. Artists, lineup slots, and sponsors you add will automatically be scoped to whichever event is active.",tip:"You can have multiple events in Planning simultaneously. Switch between them using the top bar — the entire app context changes to that event."}
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