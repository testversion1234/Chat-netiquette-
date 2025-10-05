// bot_diag_harness.js — Sichtbares Diagnose-Overlay für den Netiquette-Bot
// Keine Layoutänderung an deiner Seite — nur ein kleines Overlay oben rechts.
// Einbinden NACH deinen bestehenden Skripten.

(function(){
  const S = (css) => Object.assign(document.createElement('style'), {textContent: css});
  const box = document.createElement('div');
  const css = `
  .botdiag{position:fixed;top:10px;right:10px;z-index:99999;background:#111;color:#fff;
    font: 12px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    padding:10px 12px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.3);max-width:320px}
  .botdiag b{color:#9ae6b4}
  .botdiag .err{color:#feb2b2}
  .botdiag button{margin-top:8px;padding:6px 10px;border:0;border-radius:6px;cursor:pointer}
  .botdiag .ok{background:#2f855a;color:#fff}
  .botdiag .warn{background:#975a16;color:#fff;margin-left:6px}
  `;
  document.head.appendChild(S(css));
  box.className = 'botdiag';
  box.innerHTML = `<div><b>Bot-Diagnose</b></div><div id="botdiag-status">Prüfe…</div>
  <div style="margin-top:6px">
    <button class="ok" id="btnPing">Ping (addBot)</button>
    <button class="warn" id="btnCoach">Coach-Test</button>
  </div>`;
  document.body.appendChild(box);

  function el(id){ return document.getElementById(id); }
  function exists(x){ return typeof x !== 'undefined' && x !== null; }

  function htmlEscape(s){ return String(s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }

  function detect(){
    const issues = [];
    const chat = el('chatbox') || el('chat');
    const input = el('userText') || el('input');
    const send = el('sendBtn') || el('sendbtn') || el('send_button');

    if (!chat) issues.push('❌ Kein Chat-Container (#chatbox oder #chat) gefunden.');
    if (!input) issues.push('❌ Kein Eingabefeld (#userText oder #input) gefunden.');
    if (!send) issues.push('❌ Kein Senden-Button (#sendBtn) gefunden.');

    const hasAddBot = typeof window.addBot === 'function';
    const hasAnalyze = typeof window.analyzeMessage === 'function';
    const hasHandle = typeof window.handleSend === 'function';

    if (!hasAddBot) issues.push('❌ Funktion addBot() fehlt.');
    if (!hasAnalyze) issues.push('❌ Funktion analyzeMessage() fehlt.');
    if (!hasHandle) issues.push('❌ Funktion handleSend() fehlt (oder nicht global).');

    const hasCoach = typeof window.askCoach === 'function';

    // Build status
    const lines = [];
    lines.push(hasAddBot ? '✅ addBot() gefunden' : '<span class="err">addBot() fehlt</span>');
    lines.push(hasAnalyze ? '✅ analyzeMessage() gefunden' : '<span class="err">analyzeMessage() fehlt</span>');
    lines.push(hasHandle ? '✅ handleSend() gefunden' : '<span class="err">handleSend() fehlt</span>');
    lines.push(chat ? '✅ Chat-Container ok' : '<span class="err">Chat-Container fehlt</span>');
    lines.push(input ? '✅ Eingabefeld ok' : '<span class="err">Eingabefeld fehlt</span>');
    lines.push(send ? '✅ Senden-Button ok' : '<span class="err">Senden-Button fehlt</span>');
    lines.push(hasCoach ? '✅ askCoach() geladen' : '⚠️ askCoach() nicht geladen (optional)');
    if (issues.length === 0) {
      lines.unshift('🎉 Alles Grundlegende verdrahtet.');
    } else {
      lines.unshift('⚠️ Probleme erkannt:');
      issues.forEach(m => lines.push('<span class="err">'+htmlEscape(m)+'</span>'));
    }
    el('botdiag-status').innerHTML = lines.join('<br/>');

    // Wire test buttons
    const btnPing = el('btnPing');
    if (btnPing) {
      btnPing.onclick = () => {
        try {
          if (typeof window.addBot === 'function') {
            window.addBot('🔔 Ping aus bot_diag_harness.js');
          } else {
            alert('addBot() ist nicht definiert.');
          }
        } catch(e) { alert('Ping-Fehler: '+e.message); }
      };
    }
    const btnCoach = el('btnCoach');
    if (btnCoach) {
      btnCoach.onclick = async () => {
        try {
          if (typeof window.askCoach === 'function') {
            const t = await window.askCoach('Sag „Hallo“ in einem Satz, höflich.');
            if (typeof window.addBot === 'function') {
              window.addBot('Coach-Test: ' + (t || '(leer)'));
            } else {
              alert('Coach-Antwort: '+t);
            }
          } else {
            alert('askCoach() ist nicht definiert (das ist nur optional).');
          }
        } catch(e) { alert('Coach-Fehler: '+e.message); }
      };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detect);
  } else {
    detect();
  }
})();
