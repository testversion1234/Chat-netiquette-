// netiquette_rules_patch_v2.js — Kategorien + striktes Ahnden (Layout unverändert)
(function(){
  if (window.__NETI_RULES_PATCH_V2__) return;
  window.__NETI_RULES_PATCH_V2__ = true;

  function normalize(s){ return String(s||"").toLowerCase(); }
  function containsAny(t, list){ t=t.toLowerCase(); return list.find(w=>t.includes(w)); }
  function hasIch(t){ return /\bich\b/i.test(t); }
  function addBotSafe(msg){
    try {
      if (typeof window.addBot === "function") return window.addBot(msg);
      const chat = document.getElementById('chatbox') || document.getElementById('chat');
      if (chat){
        const d = document.createElement('div'); d.className = 'bot'; d.textContent = msg;
        const row = document.createElement('div'); row.className = 'row'; row.appendChild(d);
        chat.appendChild(row); chat.scrollTop = chat.scrollHeight;
      }
    } catch(e){ console.warn("[neti-patch] addBotSafe fail:", e); }
  }

  // Wortlisten (aus Room-Chat konsolidiert + Ergänzungen Homophobie)
  const BAD_RACIST = [
    "heil hitler","judenschwein","nigger","neger","jude","moslem","kanake","ausländer raus",
    "scheiß türke","scheiss türke","scheiß jude","scheiss jude"
  ];
  const BAD_SEXIST = [
    "hurensohn","fotze","bitch","schlampe","schlampen","hure","wichser"
  ];
  const HOMOPHOB = [
    "homo","lesbisch","lesbe","schwul","schwuchtel"
  ];
  const BAD_RUDE = Array.from(new Set([
    "arsch","arschloch","bastard","blöd","blödmann","blödbommel","depp","doof","dumm","dummkopf",
    "scheiße","scheisse","spasti","idiot","pissnelke","vollidiot","drecksack","noob","trottel","spinner",
    "steckdosenbefruchter","fick","fuck","penner","blyat","hirnlos","loser","versager","peinlich","armselig",
    "witzfigur","freak","banause","lappen","dulli","kacke","kacka","miststück","pisser","kotzbrocken",
    "verpeilt","furz","rotz","kotze","pisse","halt die klappe","halt die fresse","halt die schnauze",
    "reiß die klappe nicht auf","reiß die fresse nicht auf","halts maul","halt's maul","leck mich","verpiss dich","zieh leine"
  ]));
  const GOOD = [
    "ehrlich","fair","aufmerksam","motiviert","hilfsbereit","mutig","stark","tapfer","geduldig","liebevoll",
    "fröhlich","achtsam","friedlich","großartig","positiv","sympathisch","verständnisvoll","zuvorkommend",
    "das ist lieb","das ist nett","das ist schön","das gefällt mir","gut gemacht","sehr gut","ich mag dich",
    "ich finde das gut","vielen dank","du hast recht","das war fair","das war freundlich","das war super",
    "das ist toll","gute idee","ich freue mich","ich helfe dir gerne","ich finde das klasse"
  ];

  const PENALTY_HATE = -5; // Rassismus / Sexismus / Homophobie
  const PENALTY_RUDE = -1;
  const BONUS_ICH    =  5;
  const BONUS_OTHER  =  1;

  const origAnalyze = window.analyzeMessage;
  window.analyzeMessage = function(msg){
    let base = { notes: [], delta: 0 };
    try { if (typeof origAnalyze === "function") base = origAnalyze(msg) || base; } catch(e){}

    const notes = Array.isArray(base.notes)? base.notes.slice(): [];
    let delta = Number(base.delta||0);
    const lower = normalize(msg);
    let blocked = false;

    // Strenge Kategorien zuerst (blockierend)
    if (containsAny(lower, BAD_RACIST))   { delta += PENALTY_HATE; notes.push("⚠️ Rassistisch – Nachricht wird nicht gesendet."); blocked = true; }
    else if (containsAny(lower, BAD_SEXIST))  { delta += PENALTY_HATE; notes.push("⚠️ Sexistisch – Nachricht wird nicht gesendet."); blocked = true; }
    else if (containsAny(lower, HOMOPHOB))    { delta += PENALTY_HATE; notes.push("⚠️ Homophob – Nachricht wird nicht gesendet."); blocked = true; }
    else if (containsAny(lower, BAD_RUDE))    { delta += PENALTY_RUDE; notes.push("⚠️ Unhöflich/vulgär – bitte anders formulieren."); }

    // Form (soft)
    if (/[A-ZÄÖÜ]{4,}/.test(msg) && msg === msg.toUpperCase()) { delta -= 1; notes.push("⚠️ Bitte nicht BRÜLLEN (ALL CAPS)."); }
    if ((msg.match(/!/g)||[]).length>=3 || (msg.match(/\?/g)||[]).length>=3 || /[!?]{2,}/.test(msg)) { delta -= 1; notes.push("⚠️ Zu viele !!! oder ???."); }

    // Positive Muster
    if (hasIch(lower)) { delta += BONUS_ICH; notes.push("✅ Gute Ich‑Botschaft."); }
    if (/(kannst du|könntest du|was genau|wie meinst du|würdest du|erklär|erkläre|bitte genauer)/i.test(lower)) { delta += BONUS_OTHER; notes.push("✅ Nachfragen erkannt."); }
    if (/(sorry|entschuldigung|tut mir leid|lass uns|sachlich|ruhig|kein problem|klären|lösung|gemeinsam)/i.test(lower)) { delta += BONUS_OTHER; notes.push("✅ Deeskalation."); }
    if (/(gut gemacht|das stimmt|korrekt|richtig|gute idee|danke|super|toll|deine aufgabe(n)? (ist|sind) (gut|richtig))/i.test(lower)) { delta += BONUS_OTHER; notes.push("✅ Höfliche Bestätigung."); }
    for (const w of GOOD) { if (lower.includes(w)) { delta += BONUS_OTHER; break; } }

    return { delta, notes, blocked };
  };

  // Sanfter Hook für handleSend: blockierte Nachrichten NICHT anzeigen
  const chat   = document.getElementById('chatbox') || document.getElementById('chat');
  const input  = document.getElementById('userText') || document.getElementById('input');
  const scoreEl= document.getElementById('score') || document.getElementById('scoreBox') || null;

  function setScore(delta){
    if (!scoreEl) return;
    const cur = Number(scoreEl.textContent||0); scoreEl.textContent = String(cur + delta);
  }
  function addYouSafe(text){
    const d=document.createElement('div'); d.className='you'; d.textContent=text;
    const row=document.createElement('div'); row.className='row'; row.appendChild(d);
    chat.appendChild(row); chat.scrollTop=chat.scrollHeight;
  }

  const origHandle = window.handleSend;
  window.handleSend = async function(){
    const text = (input && input.value||"").trim();
    if (!text) return;
    const res = window.analyzeMessage(text);

    if (res.blocked){
      setScore(res.delta);
      addBotSafe(res.notes.join(" "));
      input.value = "";
      return; // NICHT anzeigen
    }

    // Sonst normal weiter – entweder dein Original oder unser Fallback
    if (typeof origHandle === "function"){
      return origHandle(); // nutzt dieselbe Eingabe, deine Logik bleibt
    } else {
      addYouSafe(text);
      setScore(res.delta);
      addBotSafe((res.notes.length? res.notes.join(" "): "👍 Sehr höflich!"));
      input.value = "";
    }
  };

  // Enter-Key an das (neue) handleSend hängen (idempotent)
  if (input){
    input.addEventListener('keydown', function(e){ if (e.key === 'Enter') window.handleSend(); });
  }
  const sendBtn= document.getElementById('sendBtn') || document.getElementById('sendbtn') || document.getElementById('send_button');
  if (sendBtn){
    sendBtn.addEventListener('click', function(){ window.handleSend(); });
  }

  console.log("[neti-patch v2] Kategorien aktiv (Rassismus/Sexismus/Homophobie/Unhöflich) — Layout unverändert.");
})();
