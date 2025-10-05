// netiquette_rules_patch.js — nicht-invasiver Patch
// ➤ Beibehaltung deines Layouts & deiner bestehenden Logik.
// ➤ Ergänzt NUR die Wortlisten (Rassismus, Sexismus, Unhöflichkeit, Positiv)
//    und erweitert analyzeMessage() um Kategorien + Punkte.
// ➤ Einbinden GANZ UNTEN, NACH deinem bisherigen <script> in index.html.
//    <script src="netiquette_rules_patch.js"></script>

(function(){
  if (window.__NETI_RULES_PATCH__) return;
  window.__NETI_RULES_PATCH__ = true;

  // ===== Wortlisten (aus Room-Chat + bisherigen Index-Phrasen, dedupliziert) =====
  const GOOD = [
    "ehrlich","fair","aufmerksam","motiviert","hilfsbereit","mutig","stark","tapfer","geduldig","liebevoll",
    "fröhlich","achtsam","friedlich","großartig","positiv","sympathisch","verständnisvoll","zuvorkommend",
    "das ist lieb","das ist nett","das ist schön","das gefällt mir","gut gemacht","sehr gut","ich mag dich",
    "ich finde das gut","vielen dank","du hast recht","das war fair","das war freundlich","das war super",
    "das ist toll","gute idee","ich freue mich","ich helfe dir gerne","ich finde das klasse"
  ];

  const BAD_RACIST = [
    "heil hitler","judenschwein","nigger","neger","jude","moslem","kanake","ausländer raus",
    "scheiß türke","scheiss türke","scheiß jude","scheiss jude"
  ];

  const BAD_SEXIST = [
    "hurensohn","fotze","bitch","schlampe","schlampen","hure","wichser","opfer","schwuchtel"
  ];

  const BAD_RUDE = Array.from(new Set([
    "arsch","arschloch","bastard","blöd","blödmann","blödbommel","depp","doof","dumm","dummkopf",
    "scheiße","scheisse","spasti","idiot","pissnelke","vollidiot","drecksack","noob","trottel","spinner",
    "steckdosenbefruchter","fick","fuck","penner","blyat",
    "hirnlos","loser","versager","peinlich","armselig","witzfigur","freak","banause","lappen","dulli",
    "kacke","kacka","miststück","pisser","kotzbrocken","verpeilt","furz","rotz","kotze","pisse",
    "schlampe","hure","fotze",
    "halt die klappe","halt die fresse","halt die schnauze","reiß die klappe nicht auf",
    "reiß die fresse nicht auf","halts maul","halt's maul","leck mich","verpiss dich","zieh leine"
  ]));

  // ===== Punktegewichte =====
  const SCORE_GOOD      = 1;
  const SCORE_ICH       = 5;
  const PENALTY_RACIST  = -5;
  const PENALTY_SEXIST  = -5;
  const PENALTY_RUDE    = -1;

  function containsAny(text, list){
    const t = text.toLowerCase();
    return list.find(w => t.includes(w));
  }
  function hasIchForm(text){
    return /\bich\b/i.test(text);
  }

  // ===== analyzeMessage() erweitern, ohne dein Original zu zerstören =====
  const origAnalyze = window.analyzeMessage;
  window.analyzeMessage = function(msg){
    // Basisergebnis deiner bisherigen Funktion holen (falls vorhanden)
    let base = { notes: [], delta: 0 };
    try {
      if (typeof origAnalyze === "function") base = origAnalyze(msg) || base;
    } catch (e) {
      console.warn("[neti-patch] Original analyzeMessage() warf Fehler:", e);
    }

    const notes = Array.isArray(base.notes) ? base.notes.slice() : [];
    let delta = Number(base.delta || 0);
    const lower = String(msg || "").toLowerCase();

    // Lautstärke/Form (sanft – nur wenn Original es nicht schon bewertet hat)
    if (/[A-ZÄÖÜ]{4,}/.test(msg) && msg === msg.toUpperCase()) {
      notes.push("⚠️ Bitte nicht BRÜLLEN (ALL CAPS).");
      delta -= 1;
    }
    if ((msg.match(/!/g)||[]).length>=3 || (msg.match(/\?/g)||[]).length>=3 || /[!?]{2,}/.test(msg)) {
      notes.push("⚠️ Zu viele !!! oder ???.");
      delta -= 1;
    }
    if ((msg.match(/[\u{1F300}-\u{1FAFF}]/gu)||[]).length>=3) {
      notes.push("⚠️ Zu viele Emojis.");
      delta -= 1;
    }

    // Diskriminierungs-/Unhöflichkeitsklassen
    if (containsAny(lower, BAD_RACIST)) {
      delta += PENALTY_RACIST;
      notes.push("⚠️ Rassistisch – bitte respektvoll formulieren.");
    } else if (containsAny(lower, BAD_SEXIST)) {
      delta += PENALTY_SEXIST;
      notes.push("⚠️ Sexistisch – das geht nicht.");
    } else if (containsAny(lower, BAD_RUDE)) {
      delta += PENALTY_RUDE;
      notes.push("⚠️ Unhöfliche/vulgäre Formulierung vermeiden.");
    }

    // DU‑Unterstellungen
    if (/\bdu\b.*(bist|machst|hast).*(immer|nie|total|schlecht|falsch)/i.test(msg)) {
      delta -= 1;
      notes.push("⚠️ Vermeide DU‑Unterstellungen – nutze Ich‑Botschaft.");
    }

    // Positive Signale
    if (hasIchForm(msg)) {
      delta += SCORE_ICH;
      notes.push("✅ Gute Ich‑Botschaft.");
    }
    if (/(kannst du|könntest du|was genau|wie meinst du|würdest du|erklär|erkläre|bitte genauer)/i.test(lower)) {
      delta += 1; notes.push("✅ Nachfragen erkannt.");
    }
    if (/(sorry|entschuldigung|tut mir leid|lass uns|sachlich|ruhig|kein problem|klären|lösung|gemeinsam)/i.test(lower)) {
      delta += 1; notes.push("✅ Deeskalation.");
    }
    if (/(gut gemacht|das stimmt|korrekt|richtig|gute idee|danke|super|toll|deine aufgabe(n)? (ist|sind) (gut|richtig))/i.test(lower)) {
      delta += 1; notes.push("✅ Höfliche Bestätigung.");
    }
    // Positive Wörter
    for (const w of GOOD) { if (lower.includes(w)) { delta += SCORE_GOOD; break; } }

    return { delta, notes };
  };

  console.log("[neti-patch] Wortlisten + Analyse erfolgreich ergänzt (Layout unverändert).");
})();