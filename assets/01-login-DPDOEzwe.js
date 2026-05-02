var e=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<title>Tutorial: Logging In — VC Event Manager</title>
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
.bar-logo{width:32px;height:32px;border-radius:10px;background:#f3f1f8;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#7c2dff}
.bar-name{font-size:14px;font-weight:600;color:#111827}
.bar-chevron{color:#9ca3af;font-size:10px;margin-left:2px}
.bar-avatar{width:36px;height:36px;border-radius:50%;background:#d97706;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0}
.bottom-nav{background:#2d0b6a;border-radius:14px;margin:0 8px 8px;height:56px;display:flex;align-items:center;justify-content:space-around;flex-shrink:0;padding:0 4px}
.nav-item{display:flex;flex-direction:column;align-items:center;gap:2px;opacity:.4;padding:4px 0;flex:1}
.nav-item.active{opacity:1}
.nav-label{font-size:9px;color:#fff;font-weight:500}
.page-content{flex:1;padding:20px;display:flex;flex-direction:column;overflow-y:auto;background:#f9f8fc}
.welcome-screen{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px 24px;background:#f9f8fc}
.welcome-logo{width:72px;height:72px;background:#ede5ff;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:4px}
.welcome-title{font-size:22px;font-weight:700;color:#111827;text-align:center}
.welcome-sub{font-size:13px;color:#6b7280;text-align:center;line-height:1.5;max-width:220px;margin-bottom:8px}
.btn-primary{width:100%;background:#7c2dff;color:#fff;border:none;border-radius:14px;padding:15px;font-size:15px;font-weight:600;cursor:pointer}
.btn-ghost{background:transparent;border:none;color:#7c2dff;font-size:14px;font-weight:600;cursor:pointer;padding:10px}
.field-group{margin-bottom:12px}
.field-label{font-size:12px;color:#6b7280;font-weight:500;margin-bottom:5px}
.field-input{background:#fff;border:1px solid #e8e5f0;border-radius:12px;padding:13px 14px;font-size:14px;color:#1f2937;width:100%}
.field-input.focused{border-color:#7c2dff;background:#faf5ff}
.divider{display:flex;align-items:center;gap:10px;color:#9ca3af;font-size:12px;margin:14px 0}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:#e8e5f0}
.btn-google{width:100%;background:#fff;border:1px solid #e8e5f0;border-radius:14px;padding:14px;font-size:14px;font-weight:600;color:#374151;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
.site-row{background:#fff;border:1px solid #e8e5f0;border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;margin-bottom:8px}
.site-avatar{width:44px;height:44px;border-radius:50%;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff}
.site-info{flex:1}.site-name-txt{font-size:14px;font-weight:600;color:#111827}.site-url-txt{font-size:11px;color:#9ca3af;margin-top:2px}
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
</style>
</head>
<body>
<h1 class="page-head">Tutorial · Logging In</h1>
<div class="phone">
  <div class="notch"><div class="notch-pill"></div></div>
  <div class="screen">
    <!-- Slide 0: Welcome -->
    <div class="slide active" id="slide-0">
      <div class="welcome-screen">
        <div class="welcome-logo">🎪</div>
        <div class="welcome-title">Brand Events Hub</div>
        <div class="welcome-sub">Manage your festival content across all your brands, in one place.</div>
        <button class="btn-primary">Sign In</button>
        <button class="btn-ghost">Create Account</button>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>
    <!-- Slide 1: Email login -->
    <div class="slide" id="slide-1">
      <div class="page-content">
        <div style="margin-bottom:20px;margin-top:4px"><div style="font-size:22px;font-weight:700;color:#111827">Sign In</div><div style="font-size:13px;color:#6b7280;margin-top:4px">Access your festival content</div></div>
        <div class="field-group"><div class="field-label">Email</div><div class="field-input focused">sean@crssd.com</div></div>
        <div class="field-group"><div class="field-label">Password</div><div class="field-input">••••••••••</div></div>
        <button class="btn-primary" style="margin-top:4px">Sign In</button>
        <div class="divider">or</div>
        <button class="btn-google"><span style="font-size:16px;font-weight:700;color:#4285f4">G</span> Continue with Google</button>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>
    <!-- Slide 2: Google -->
    <div class="slide" id="slide-2">
      <div class="page-content">
        <div style="margin-bottom:20px;margin-top:4px"><div style="font-size:22px;font-weight:700;color:#111827">Sign In</div></div>
        <button class="btn-google" style="border-color:#7c2dff;background:#faf5ff;color:#7c2dff;font-size:15px;padding:16px;font-weight:700"><span style="font-size:16px;font-weight:700;color:#4285f4">G</span> Continue with Google</button>
        <div style="background:#fff;border:1px solid #e8e5f0;border-radius:12px;padding:12px;margin-top:12px;font-size:12px;color:#6b7280;line-height:1.5">You'll be redirected to Google to verify your account. No separate password needed.</div>
        <div class="divider" style="margin-top:16px">or sign in with email</div>
        <button class="btn-google"><span style="font-size:16px">✉️</span> Email &amp; Password</button>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>
    <!-- Slide 3: Authenticated home -->
    <div class="slide" id="slide-3">
      <div class="app-bar"><div class="bar-left"><div class="bar-logo">VC</div><div class="bar-name">Brand Events Hub <span class="bar-chevron">›</span></div></div><div class="bar-avatar">SM</div></div>
      <div class="page-content" style="padding-top:14px">
        <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px">Your Sites</div>
        <div class="site-row"><div class="site-avatar" style="background:#1a3a5c">CR</div><div class="site-info"><div class="site-name-txt">CRSSD Festival</div><div class="site-url-txt">crssdfest.com</div></div><span style="color:#d1d5db">›</span></div>
        <div class="site-row"><div class="site-avatar" style="background:#2d1b4e">PN</div><div class="site-info"><div class="site-name-txt">Proper NYE</div><div class="site-url-txt">propernye.com</div></div><span style="color:#d1d5db">›</span></div>
        <button style="width:100%;border:2px dashed #e8e5f0;border-radius:12px;padding:14px;font-size:13px;color:#9ca3af;background:transparent;margin-top:4px">+ Add another site</button>
      </div>
      <div class="bottom-nav">
        <div class="nav-item active"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg><div class="nav-label">Home</div></div>
        <div class="nav-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><div class="nav-label">Search</div></div>
        <div class="nav-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg><div class="nav-label">Add Site</div></div>
        <div class="nav-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg><div class="nav-label">Favorites</div></div>
        <div class="nav-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg><div class="nav-label">Settings</div></div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>
  </div>
</div>
<div class="step-panel">
  <div class="step-number" id="stepNum">Step 1 of 4</div>
  <div class="step-title" id="stepTitle">Open the App</div>
  <div class="step-body" id="stepBody">When you first open the app, you'll see the welcome screen. If this is your first time, tap <strong>Create Account</strong> — otherwise tap <strong>Sign In</strong>.</div>
  <div class="step-tip" id="stepTip">Your account is separate from your WordPress credentials. It's the master key that syncs your connected sites across all your devices.</div>
  <div class="step-nav"><button class="btn-prev" id="btnPrev" onclick="prev()" disabled>← Back</button><button class="btn-next" id="btnNext" onclick="next()">Next →</button></div>
  <div class="progress-dots" id="dots"></div>
</div>
<script>
const steps=[
  {title:"Open the App",body:"When you first open the app, you'll see the welcome screen. If this is your first time, tap <strong>Create Account</strong> — otherwise tap <strong>Sign In</strong>.",tip:"Your account is separate from your WordPress credentials. It's the master key that syncs your connected sites across all your devices."},
  {title:"Sign In with Email",body:"Enter your email and password, then tap <strong>Sign In</strong>. Your session persists — you won't need to sign in again unless you explicitly sign out from Settings.",tip:"If you forget your password, use the forgot password link. A reset email will be sent to your account address."},
  {title:"Or Use Google",body:"Tap <strong>Continue with Google</strong> for one-tap sign-in. You'll be redirected to Google briefly, then returned to the app already authenticated.",tip:"Google sign-in and email/password sign-in share the same account as long as you use the same email address."},
  {title:"You're In",body:"Once authenticated, you'll see your connected sites on the home screen. Tap any site to open its dashboard. Your sites sync automatically across all devices.",tip:"Your site credentials are stored in your account, not locally. Sign in on a new device and all your connected sites appear automatically."}
];
let current=0;
const dots=document.getElementById('dots');
steps.forEach((_,i)=>{const d=document.createElement('div');d.className='dot'+(i===0?' active':'');dots.appendChild(d)});
function render(){window.scrollTo(0,0);const s=steps[current];document.getElementById('stepNum').textContent=\`Step \${current+1} of \${steps.length}\`;document.getElementById('stepTitle').textContent=s.title;document.getElementById('stepBody').innerHTML=s.body;document.getElementById('stepTip').textContent=s.tip;document.getElementById('btnPrev').disabled=current===0;document.getElementById('btnNext').textContent=current===steps.length-1?'Done ✓':'Next →';document.querySelectorAll('.dot').forEach((d,i)=>{d.className='dot'+(i===current?' active':'')});document.querySelectorAll('.slide').forEach((s,i)=>{s.className='slide'+(i===current?' active':i<current?' out':'')});}
function next(){if(current<steps.length-1){current++;render();}}
function prev(){if(current>0){current--;render();}}
render();
<\/script>
</body>
</html>
`;export{e as default};