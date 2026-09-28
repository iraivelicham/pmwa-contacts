// "Install app" prompt for the GitHub Pages copy only (injected by publish-site.sh).
// Android/desktop Chrome & Edge: real install via beforeinstallprompt.
// iPhone/iPad Safari: no install API exists, so show Add-to-Home-Screen steps.
(function () {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) return;

  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const KEY = 'pmwa_install_dismissed';
  const SNOOZE_DAYS = 3;
  let deferred = null;

  function snoozed() {
    try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < SNOOZE_DAYS * 864e5; } catch (e) { return false; }
  }
  function snooze() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }

  const css = document.createElement('style');
  css.textContent = `
    .pmwa-inst { position: fixed; left: 12px; right: 12px; bottom: 12px; z-index: 9999; max-width: 460px; margin: 0 auto;
      background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.18);
      padding: 12px; display: flex; gap: 12px; align-items: center; font: 13px/1.4 Inter, system-ui, sans-serif; color: #111827;
      animation: pmwaUp .25s ease-out; }
    @keyframes pmwaUp { from { transform: translateY(20px); opacity: 0; } }
    .pmwa-inst img { width: 44px; height: 44px; border-radius: 10px; flex: none; }
    .pmwa-inst .t { flex: 1; min-width: 0; }
    .pmwa-inst b { display: block; font-size: 14px; }
    .pmwa-inst .s { color: #4b5563; font-size: 12px; }
    .pmwa-inst .s b { display: inline; font-size: inherit; color: #111827; }
    .pmwa-inst .go { background: #1f6f43; color: #fff; border: 0; border-radius: 8px; padding: 9px 14px; font: 600 13px Inter, system-ui, sans-serif; cursor: pointer; }
    .pmwa-inst .x { background: none; border: 0; color: #9ca3af; font-size: 20px; line-height: 1; padding: 4px; cursor: pointer; align-self: flex-start; }
    .pmwa-inst .ios { display: inline-block; vertical-align: -3px; width: 16px; height: 16px; }`;
  document.head.appendChild(css);

  const SHARE_ICON = '<svg class="ios" viewBox="0 0 24 24" fill="none" stroke="#0a84ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  let bar = null;

  function hideBar() { if (bar) { bar.remove(); bar = null; } }
  function showBar(force) {
    if (bar || (!force && snoozed())) return;
    bar = document.createElement('div');
    bar.className = 'pmwa-inst';
    bar.innerHTML = ios
      ? `<img src="icon-192.png" alt=""><div class="t"><b>Install PMWA Contacts</b>
           <span class="s">Tap ${SHARE_ICON} <b>Share</b>, then <b>Add to Home Screen</b></span></div>
         <button class="x" aria-label="Close">&times;</button>`
      : `<img src="icon-192.png" alt=""><div class="t"><b>Install PMWA Contacts</b>
           <span class="s">Open it like an app from your home screen</span></div>
         <button class="go">Install</button><button class="x" aria-label="Close">&times;</button>`;
    bar.querySelector('.x').onclick = () => { snooze(); hideBar(); };
    const go = bar.querySelector('.go');
    if (go) go.onclick = install;
    document.body.appendChild(bar);
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    hideBar();
    if (outcome !== 'accepted') snooze();
    updateTopBtn();
  }

  // Button in the app's top bar, visible whenever installing is possible.
  let topBtn = null;
  function updateTopBtn() {
    const can = ios || deferred;
    const anchor = document.getElementById('btnReload');
    if (can && !topBtn && anchor) {
      topBtn = document.createElement('button');
      topBtn.className = 'btn';
      topBtn.title = 'Install app';
      topBtn.innerHTML = '<i class="fa-solid fa-mobile-screen-button"></i><span class="lbl">Install app</span>';
      topBtn.onclick = () => (deferred ? install() : showBar(true));
      anchor.parentNode.insertBefore(topBtn, anchor);
    } else if (!can && topBtn) { topBtn.remove(); topBtn = null; }
  }

  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    updateTopBtn();
    showBar(false);
  });
  addEventListener('appinstalled', () => { deferred = null; hideBar(); updateTopBtn(); });
  addEventListener('DOMContentLoaded', () => {
    updateTopBtn();
    if (ios) setTimeout(() => showBar(false), 1500);
  });
})();
