var e=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<title>Tutorial: Logging In — VC Event Manager</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#1a1a2e;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:24px 16px 40px}
h1.page-head{color:#fff;font-size:15px;font-weight:600;margin-bottom:20px;opacity:.7;letter-spacing:.5px;text-transform:uppercase}

/* Phone */
.phone{width:340px;background:#0f0e14;border-radius:44px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08);position:relative;display:flex;flex-direction:column}
.notch{background:#0f0e14;height:36px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px}
.notch-pill{width:100px;height:8px;background:#1a1a1a;border-radius:4px}
.screen{flex:1;overflow:hidden;position:relative;background:#0f0e14;min-height:580px}
.slide{position:absolute;inset:0;transition:opacity .35s,transform .35s;opacity:0;transform:translateX(30px);pointer-events:none;display:flex;flex-direction:column}
.slide.active{opacity:1;transform:none;pointer-events:all}
.slide.out{opacity:0;transform:translateX(-30px)}
.home-bar{height:20px;display:flex;align-items:center;justify-content:center}
.home-pill{width:100px;height:4px;background:rgba(255,255,255,.2);border-radius:2px}

/* Welcome screen */
.welcome-bg{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;background:linear-gradient(160deg,#0f0e14 0%,#1e1b2e 50%,#0f0e14 100%)}
.app-icon{width:72px;height:72px;background:linear-gradient(135deg,#7c5cbf,#5b4a9e);border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;box-shadow:0 12px 32px rgba(124,92,191,.4)}
.app-icon svg{width:36px;height:36px;color:#fff}
.app-name{font-size:22px;font-weight:700;color:#fff;margin-bottom:6px}
.app-tagline{font-size:13px;color:rgba(255,255,255,.5);text-align:center;line-height:1.5;margin-bottom:40px}
.btn-primary{width:100%;background:#7c5cbf;color:#fff;border:none;border-radius:14px;padding:16px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:10px}
.btn-ghost{width:100%;background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:16px;font-size:15px;font-weight:500;cursor:pointer}

/* Login screen */
.login-screen{flex:1;display:flex;flex-direction:column;padding:32px 20px 20px;background:#0f0e14}
.login-back{width:36px;height:36px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:28px;color:rgba(255,255,255,.5)}
.login-back svg{width:16px;height:16px}
.login-title{font-size:24px;font-weight:700;color:#fff;margin-bottom:6px}
.login-sub{font-size:13px;color:rgba(255,255,255,.5);margin-bottom:32px;line-height:1.5}
.field-label{font-size:12px;color:rgba(255,255,255,.5);font-weight:500;margin-bottom:6px}
.field-input{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px 16px;font-size:15px;color:#fff;margin-bottom:16px}
.field-input.focused{border-color:#7c5cbf;background:rgba(124,92,191,.08)}
.divider-or{display:flex;align-items:center;gap:12px;margin:20px 0}
.divider-or span{font-size:12px;color:rgba(255,255,255,.3);white-space:nowrap}
.divider-or::before,.divider-or::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.1)}
.btn-google{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px;font-size:14px;font-weight:500;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px}
.google-dot{width:18px;height:18px;background:linear-gradient(135deg,#4285f4,#34a853,#fbbc05,#ea4335);border-radius:50%}

/* Authenticated / home */
.auth-screen{flex:1;background:#0f0e14;display:flex;flex-direction:column}
.top-bar{padding:16px 16px 12px;display:flex;align-items:center;justify-content:space-between}
.site-badge{display:flex;align-items:center;gap:8px}
.site-dot{width:28px;height:28px;background:#7c5cbf;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}
.site-name{font-size:13px;font-weight:600;color:#fff}
.site-chevron{font-size:11px;color:rgba(255,255,255,.4);margin-left:2px}
.gear-icon{width:32px;height:32px;background:rgba(255,255,255,.06);border-radius:9px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5)}
.gear-icon svg{width:16px;height:16px}
.home-greeting{padding:8px 16px 20px}
.home-title{font-size:22px;font-weight:700;color:#fff}
.home-sub{font-size:13px;color:rgba(255,255,255,.4);margin-top:3px}
.module-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px}
.module-tile{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px;position:relative}
.tile-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:10px}
.tile-label{font-size:13px;font-weight:600;color:#fff}
.tile-desc{font-size:11px;color:rgba(255,255,255,.4);margin-top:3px;line-height:1.4}

/* Step panel */
.step-panel{width:340px;background:#fff;border-radius:20px;padding:20px;margin-top:16px}
.step-number{font-size:11px;font-weight:700;color:#7c5cbf;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
.step-title{font-size:17px;font-weight:700;color:#111;margin-bottom:8px}
.step-body{font-size:13px;color:#6b7280;line-height:1.6;margin-bottom:16px}
.step-tip{background:#f5f0ff;border-radius:10px;padding:10px 12px;font-size:12px;color:#7c5cbf;line-height:1.5;margin-bottom:16px;display:flex;gap:8px}
.step-tip::before{content:'💡';flex-shrink:0}
.step-nav{display:flex;gap:10px}
.btn-prev{flex:1;background:#f3f4f6;color:#374151;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:600;cursor:pointer}
.btn-next{flex:2;background:#7c5cbf;color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:600;cursor:pointer}
.btn-next:disabled{background:#c4b5fd;cursor:default}
.progress-dots{display:flex;justify-content:center;gap:5px;margin-top:14px}
.dot{width:6px;height:6px;border-radius:50%;background:#e5e7eb;transition:background .2s,width .2s}
.dot.active{background:#7c5cbf;width:18px;border-radius:3px}

/* Highlight pulse */
.highlight{animation:pulse 1.4s infinite}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(124,92,191,.5)}50%{box-shadow:0 0 0 6px rgba(124,92,191,0)}}
</style>
</head>
<body>
<h1 class="page-head">Tutorial · Logging In</h1>

<div class="phone">
  <div class="notch"><div class="notch-pill"></div></div>
  <div class="screen" id="screen">

    <!-- Slide 0: Welcome -->
    <div class="slide active" id="slide-0">
      <div class="welcome-bg">
        <div class="app-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </div>
        <div class="app-name">VC Event Manager</div>
        <div class="app-tagline">Your backstage tool for managing artists, events, and content across all brands.</div>
        <button class="btn-primary">Sign In</button>
        <button class="btn-ghost">Learn More</button>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 1: Login form -->
    <div class="slide" id="slide-1">
      <div class="login-screen">
        <div class="login-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
        <div class="login-title">Sign in</div>
        <div class="login-sub">Use your hub account to access all connected sites.</div>
        <div class="field-label">Email</div>
        <div class="field-input focused">sean@crssd.com</div>
        <div class="field-label">Password</div>
        <div class="field-input">••••••••••</div>
        <button class="btn-primary" style="margin-top:8px">Sign In →</button>
        <div class="divider-or"><span>or continue with</span></div>
        <button class="btn-google"><div class="google-dot"></div> Google</button>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 2: Google OAuth -->
    <div class="slide" id="slide-2">
      <div class="login-screen">
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px">
          <div style="width:64px;height:64px;background:linear-gradient(135deg,#4285f4,#34a853);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px">G</div>
          <div style="text-align:center">
            <div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:6px">Continue with Google</div>
            <div style="font-size:13px;color:rgba(255,255,255,.5);line-height:1.5">A Google sign-in sheet will appear. Select your <strong style="color:rgba(255,255,255,.7)">@crssd.com</strong> account.</div>
          </div>
          <div style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px">
            <div style="width:36px;height:36px;background:#7c5cbf;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff">S</div>
            <div><div style="font-size:13px;font-weight:600;color:#fff">Sean Marshall</div><div style="font-size:11px;color:rgba(255,255,255,.4)">sean@crssd.com</div></div>
            <div style="margin-left:auto;width:18px;height:18px;background:#34a853;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700">✓</div>
          </div>
          <button class="btn-primary" style="width:100%">Continue as Sean →</button>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 3: Authenticated home -->
    <div class="slide" id="slide-3">
      <div class="auth-screen">
        <div class="top-bar">
          <div class="site-badge">
            <div class="site-dot">ZA</div>
            <div class="site-name">Zoo Agency</div>
            <div class="site-chevron">▾</div>
          </div>
          <div class="gear-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg></div>
        </div>
        <div class="home-greeting">
          <div class="home-title">Welcome back 👋</div>
          <div class="home-sub">Zoo Agency · 4 modules active</div>
        </div>
        <div class="module-grid">
          <div class="module-tile"><div class="tile-icon" style="background:rgba(139,92,246,.2)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div><div class="tile-label">Artists</div><div class="tile-desc">Profiles & booking</div></div>
          <div class="module-tile"><div class="tile-icon" style="background:rgba(249,115,22,.2)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div class="tile-label">Events</div><div class="tile-desc">Properties & dates</div></div>
          <div class="module-tile"><div class="tile-icon" style="background:rgba(16,185,129,.2)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><div class="tile-label">Sponsors</div><div class="tile-desc">Tiers & logos</div></div>
          <div class="module-tile"><div class="tile-icon" style="background:rgba(239,68,68,.2)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><div class="tile-label">Confidential</div><div class="tile-desc">Visibility controls</div></div>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

  </div>
</div>

<!-- Step panel -->
<div class="step-panel">
  <div class="step-number" id="stepNum">Step 1 of 4</div>
  <div class="step-title" id="stepTitle">The Welcome Screen</div>
  <div class="step-body" id="stepBody">When you first open VC Event Manager, you'll see the welcome screen. Tap <strong>Sign In</strong> to continue to the login flow.</div>
  <div class="step-tip" id="stepTip">You only need to sign in once. The app stays logged in across sessions — even after closing it.</div>
  <div class="step-nav">
    <button class="btn-prev" id="btnPrev" onclick="prev()" disabled>← Back</button>
    <button class="btn-next" id="btnNext" onclick="next()">Next →</button>
  </div>
  <div class="progress-dots" id="dots"></div>
</div>

<script>
const steps=[
  {title:"The Welcome Screen",body:"When you first open VC Event Manager, you'll see the welcome screen. Tap <strong>Sign In</strong> to continue to the login flow.",tip:"You only need to sign in once. The app stays logged in across sessions."},
  {title:"Email & Password",body:"Enter your hub email and password, then tap <strong>Sign In →</strong>. This is your main Supabase hub account — not your WordPress credentials.",tip:"Forgot your password? Use the 'Forgot password' link on the sign-in page to reset via email."},
  {title:"Google Sign-In",body:"Alternatively, tap <strong>Continue with Google</strong> to authenticate via your Google account. A popup will appear — select your @crssd.com or authorized Google account.",tip:"Google auth is the fastest option. No password to remember and sessions are more secure."},
  {title:"You're In",body:"Once authenticated, you'll land on the home screen. Your connected sites and all their content are now accessible. The active site is shown in the top bar.",tip:"If your connected sites don't appear immediately, wait a moment — they sync from the server on first login."}
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