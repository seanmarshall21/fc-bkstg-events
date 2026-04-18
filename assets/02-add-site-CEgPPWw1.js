var e=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<title>Tutorial: Adding a Site — VC Event Manager</title>
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
.back-row{display:flex;align-items:center;gap:10px;margin-bottom:24px}
.back-btn{width:36px;height:36px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);flex-shrink:0}
.back-btn svg{width:16px;height:16px}
.page-title{font-size:20px;font-weight:700;color:#fff}
.field-group{margin-bottom:16px}
.field-label{font-size:12px;color:rgba(255,255,255,.5);font-weight:500;margin-bottom:6px}
.field-input{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:13px 14px;font-size:14px;color:#fff;display:flex;align-items:center;justify-content:space-between}
.field-input.focused{border-color:#7c5cbf;background:rgba(124,92,191,.08)}
.field-input.filled{border-color:rgba(255,255,255,.2)}
.field-hint{font-size:11px;color:rgba(255,255,255,.3);margin-top:5px;line-height:1.4}
.field-tag{font-size:11px;background:rgba(124,92,191,.3);color:#c4b5fd;border-radius:6px;padding:2px 7px;font-weight:600}
.btn-connect{width:100%;background:#7c5cbf;color:#fff;border:none;border-radius:14px;padding:15px;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:8px}
.btn-connect svg{width:16px;height:16px}
.success-screen{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;gap:16px}
.success-icon{width:64px;height:64px;background:linear-gradient(135deg,#10b981,#34d399);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px}
.success-title{font-size:20px;font-weight:700;color:#fff;text-align:center}
.success-body{font-size:13px;color:rgba(255,255,255,.5);text-align:center;line-height:1.6}
.site-card{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px}
.site-ava{width:40px;height:40px;background:#7c5cbf;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0}
.site-info{flex:1}
.site-name{font-size:14px;font-weight:600;color:#fff}
.site-url{font-size:11px;color:rgba(255,255,255,.4)}
.site-check{width:22px;height:22px;background:#10b981;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700}
/* WP admin guide */
.wp-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;margin-bottom:10px}
.wp-step{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px}
.wp-step:last-child{margin-bottom:0}
.wp-num{width:22px;height:22px;background:#7c5cbf;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;margin-top:1px}
.wp-text{font-size:12px;color:rgba(255,255,255,.6);line-height:1.5}
.wp-text strong{color:rgba(255,255,255,.9)}
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
<h1 class="page-head">Tutorial · Adding a Site</h1>

<div class="phone">
  <div class="notch"><div class="notch-pill"></div></div>
  <div class="screen">

    <!-- Slide 0: WP admin instructions -->
    <div class="slide active" id="slide-0">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Connect a Site</div>
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,.5);margin-bottom:16px;line-height:1.5">First, generate an Application Password in WordPress:</div>
        <div class="wp-card">
          <div class="wp-step"><div class="wp-num">1</div><div class="wp-text">In WordPress, go to <strong>Users → Profile</strong></div></div>
          <div class="wp-step"><div class="wp-num">2</div><div class="wp-text">Scroll to <strong>Application Passwords</strong> at the bottom</div></div>
          <div class="wp-step"><div class="wp-num">3</div><div class="wp-text">Enter a name like <strong>"VC Event Manager"</strong> and click <strong>Add New</strong></div></div>
          <div class="wp-step"><div class="wp-num">4</div><div class="wp-text">Copy the generated password — it only shows once</div></div>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 1: URL entry -->
    <div class="slide" id="slide-1">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Connect a Site</div>
        </div>
        <div class="field-group">
          <div class="field-label">Site URL</div>
          <div class="field-input focused"><span>https://zooagency.com</span></div>
          <div class="field-hint">The full URL of your WordPress site, including https://</div>
        </div>
        <div class="field-group">
          <div class="field-label">Username</div>
          <div class="field-input"><span style="color:rgba(255,255,255,.3)">WordPress username</span></div>
        </div>
        <div class="field-group">
          <div class="field-label">Application Password</div>
          <div class="field-input"><span style="color:rgba(255,255,255,.3)">XXXX XXXX XXXX XXXX</span></div>
          <div class="field-hint">Generate one at WP Admin → Users → Profile → Application Passwords</div>
        </div>
        <button class="btn-connect" style="opacity:.4" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Connect Site</button>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 2: All filled -->
    <div class="slide" id="slide-2">
      <div class="page-bg">
        <div class="back-row">
          <div class="back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="page-title">Connect a Site</div>
        </div>
        <div class="field-group">
          <div class="field-label">Site URL</div>
          <div class="field-input filled"><span>https://zooagency.com</span><span class="field-tag">✓</span></div>
        </div>
        <div class="field-group">
          <div class="field-label">Username</div>
          <div class="field-input filled"><span>sean</span><span class="field-tag">✓</span></div>
        </div>
        <div class="field-group">
          <div class="field-label">Application Password</div>
          <div class="field-input filled"><span>•••• •••• •••• ••••</span><span class="field-tag">✓</span></div>
        </div>
        <button class="btn-connect"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Connect Site</button>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

    <!-- Slide 3: Success -->
    <div class="slide" id="slide-3">
      <div class="page-bg">
        <div class="success-screen">
          <div class="success-icon">✓</div>
          <div class="success-title">Site Connected!</div>
          <div class="success-body">Zoo Agency is now connected. Your content modules are ready to use.</div>
          <div class="site-card">
            <div class="site-ava">ZA</div>
            <div class="site-info">
              <div class="site-name">Zoo Agency</div>
              <div class="site-url">zooagency.com · sean</div>
            </div>
            <div class="site-check">✓</div>
          </div>
          <button class="btn-connect">Go to Dashboard →</button>
        </div>
      </div>
      <div class="home-bar"><div class="home-pill"></div></div>
    </div>

  </div>
</div>

<div class="step-panel">
  <div class="step-number" id="stepNum">Step 1 of 4</div>
  <div class="step-title" id="stepTitle">Get Your App Password First</div>
  <div class="step-body" id="stepBody">Before connecting, you need an Application Password from WordPress. Go to <strong>WP Admin → Users → Profile</strong>, scroll to Application Passwords, create one named "VC Event Manager", and copy it.</div>
  <div class="step-tip" id="stepTip">Application passwords are different from your login password. They're specifically for API access and can be revoked anytime without affecting your WP login.</div>
  <div class="step-nav">
    <button class="btn-prev" id="btnPrev" onclick="prev()" disabled>← Back</button>
    <button class="btn-next" id="btnNext" onclick="next()">Next →</button>
  </div>
  <div class="progress-dots" id="dots"></div>
</div>

<script>
const steps=[
  {title:"Get Your App Password First",body:"Before connecting, you need an Application Password from WordPress. Go to <strong>WP Admin → Users → Profile</strong>, scroll to Application Passwords, create one named \\"VC Event Manager\\", and copy it.",tip:"Application passwords are different from your login password. They're for API access and can be revoked anytime without affecting your WP login."},
  {title:"Enter the Site URL",body:"Type the full URL of your WordPress site, including <strong>https://</strong>. For Zoo Agency that's <code>https://zooagency.com</code>. Don't include a trailing slash.",tip:"The app will automatically verify the URL connects to a valid WordPress installation with the vc-event-properties plugin active."},
  {title:"Fill In All Three Fields",body:"Enter your WordPress <strong>username</strong> (not email) and the <strong>Application Password</strong> you just generated. All three fields must be filled before the Connect button becomes active.",tip:"Your credentials are stored securely in your Supabase account — never locally on the device. This means they sync across all your devices automatically."},
  {title:"Connected!",body:"Once connected, Zoo Agency appears in your site list. From here you can switch between connected sites using the top bar. You can connect multiple sites — CRSSD, Proper NYE, Rodeo, etc.",tip:"You can remove a site anytime from Settings → Danger Zone without affecting the WordPress site itself."}
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