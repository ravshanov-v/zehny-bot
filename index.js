<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Zehnly</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: #FAF7F1;
    --surface: #FFFFFF;
    --surface-2: #F0EAE0;
    --text-primary: #241E33;
    --text-muted: #8A8296;
    --gold: #C98A1F;
    --gold-soft: rgba(201, 138, 31, 0.12);
    --gold-dim: #E3D3B0;
    --success: #1F9D74;
    --success-soft: rgba(31, 157, 116, 0.10);
    --danger: #D8425C;
    --danger-soft: rgba(216, 66, 92, 0.10);
    --border-default: #EAE3D6;
  }
  [data-theme="dark"] {
    --ink: #120E1C;
    --surface: #1E1830;
    --surface-2: #2A2244;
    --text-primary: #F3EFFB;
    --text-muted: #8D82AC;
    --gold: #F5B942;
    --gold-soft: rgba(245, 185, 66, 0.14);
    --gold-dim: #6B5A2E;
    --success: #33D6A6;
    --success-soft: rgba(51, 214, 166, 0.10);
    --danger: #FF5C7A;
    --danger-soft: rgba(255, 92, 122, 0.10);
    --border-default: #2A2244;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: var(--ink);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    height: 100%;
    overflow-x: hidden;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.2s ease, color 0.2s ease;
  }
  #app {
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
    padding: 20px 20px 32px;
    display: flex;
    flex-direction: column;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
  }
  .topbar .category {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 15px;
    letter-spacing: 0.02em;
    color: var(--text-primary);
  }
  .score-chip {
    background: var(--gold-soft);
    border-radius: 20px;
    padding: 6px 14px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 14px;
    color: var(--gold);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .synapse-trail {
    display: flex;
    align-items: center;
    margin-bottom: 32px;
    gap: 0;
  }
  .synapse-node {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--surface-2);
    flex-shrink: 0;
    transition: background 0.35s ease, box-shadow 0.35s ease;
    position: relative;
    z-index: 2;
  }
  .synapse-node.lit {
    background: var(--gold);
    box-shadow: 0 0 0 4px var(--gold-soft);
  }
  .synapse-node.wrong {
    background: var(--danger);
    box-shadow: 0 0 0 4px var(--danger-soft);
  }
  .synapse-node.current {
    background: var(--text-primary);
    transform: scale(1.3);
  }
  .synapse-link {
    flex: 1;
    height: 2px;
    background: var(--surface-2);
    transition: background 0.35s ease;
  }
  .synapse-link.lit { background: var(--gold-dim); }

  .question-eyebrow {
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 500;
    margin-bottom: 10px;
    letter-spacing: 0.02em;
  }
  .question-text {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 24px;
    line-height: 1.35;
    margin-bottom: 28px;
    min-height: 100px;
  }

  .answers {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .answer-btn {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--surface);
    border: 1.5px solid var(--border-default);
    border-radius: 16px;
    padding: 16px 18px;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: var(--text-primary);
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;
    -webkit-user-select: none;
    user-select: none;
  }
  .answer-btn:active { transform: scale(0.98); }
  .answer-btn .badge {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--surface-2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 13px;
    color: var(--text-muted);
    flex-shrink: 0;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .answer-btn.correct {
    border-color: var(--success);
    background: var(--success-soft);
  }
  .answer-btn.correct .badge {
    background: var(--success);
    color: #FFFFFF;
  }
  .answer-btn.wrong {
    border-color: var(--danger);
    background: var(--danger-soft);
  }
  .answer-btn.wrong .badge {
    background: var(--danger);
    color: #FFFFFF;
  }
  .answer-btn.disabled { pointer-events: none; }
  .answer-btn.faded { opacity: 0.4; }
  .answer-btn.tapped { animation: tapPulse 0.3s ease; }
  @keyframes tapPulse {
    0% { transform: scale(1); }
    40% { transform: scale(0.96); }
    100% { transform: scale(1); }
  }

  .result {
    display: none;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .result.active { display: flex; }
  .result-ring {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    border: 6px solid var(--surface-2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    position: relative;
  }
  .result-score {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 40px;
    color: var(--gold);
  }
  .result-total {
    font-size: 16px;
    color: var(--text-muted);
    font-weight: 500;
  }
  .result-tier {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 20px;
    margin-bottom: 8px;
  }
  .result-sub {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 32px;
  }
  .restart-btn {
    background: var(--gold);
    color: #FFFFFF;
    border: none;
    border-radius: 14px;
    padding: 14px 20px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    flex: 1;
  }
  .restart-btn:active { transform: scale(0.97); }

  .loading-text {
    text-align: center;
    color: var(--text-muted);
    font-size: 14px;
    margin-top: 60px;
  }
  .error-text {
    text-align: center;
    color: var(--danger);
    font-size: 14px;
    margin-top: 60px;
  }

  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; }
  }
</style>
</head>
<body>
<div id="app">

  <div class="topbar" id="quizScreen" style="display:none;">
    <div class="category" id="categoryLabel"></div>
    <div class="score-chip">⬤ <span id="scoreValue">0</span></div>
  </div>

  <div class="synapse-trail" id="synapseTrail" style="display:none;"></div>

  <div class="question-eyebrow" id="questionEyebrow" style="display:none;">Savol 1/20</div>
  <div class="question-text" id="questionText" style="display:none;"></div>

  <div class="answers" id="answersContainer" style="display:none;"></div>

  <div class="loading-text" id="loadingText">Yuklanmoqda...</div>

  <div class="result" id="resultScreen">
    <div class="result-ring">
      <div>
        <div class="result-score" id="finalScore">0</div>
        <div class="result-total" id="finalTotal">/ 20</div>
      </div>
    </div>
    <div class="result-tier" id="resultTier"></div>
    <div class="result-sub" id="resultSub"></div>
    <div id="resultButtons" style="display: flex; gap: 12px; width: 100%;">
      <button class="restart-btn" onclick="playMore()">🔄 Yana o'ynash</button>
      <button class="restart-btn" onclick="finishSession()" style="background: var(--surface-2); color: var(--text-primary);">🏁 Tugatish</button>
    </div>
  </div>

</div>

<script>
function applyTheme() {
  let scheme = 'light';
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.colorScheme) {
    scheme = window.Telegram.WebApp.colorScheme;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    scheme = 'dark';
  }
  document.documentElement.setAttribute('data-theme', scheme);
}

// Har bir mavzu qaysi data faylida saqlanganini shu yerda ro'yxatga olamiz.
// Yangi mavzu (masalan Matematika) qo'shilganda faqat shu ro'yxatga bitta qator qo'shiladi.
const mavzuFayllari = {
  sport: 'data/sport.json',
  kino: 'data/kino.json',
  faktlar: 'data/faktlar.json',
  texnologiya: 'data/texnologiya.json',
  ingliz: 'data/ingliz.json',
  tarix_5_7: 'data/tarix_5_7.json',
  tarix_7_9: 'data/tarix_7_9.json',
  tarix_9_11: 'data/tarix_9_11.json',
  cefr_a1_a2: 'data/cefr_a1_a2.json',
  matematika_5_7: 'data/matematika_5_7.json',
  matematika_7_9: 'data/matematika_7_9.json',
  matematika_9_11: 'data/matematika_9_11.json',
  fizika_5_7: 'data/fizika_5_7.json',
  fizika_7_9: 'data/fizika_7_9.json',
  fizika_9_11: 'data/fizika_9_11.json',
  kimyo_7_9: 'data/kimyo_7_9.json',
  kimyo_9_11: 'data/kimyo_9_11.json'
};

function getMavzuFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const m = params.get('mavzu');
  return mavzuFayllari[m] ? m : 'sport';
}

const activeMavzu = getMavzuFromUrl();

const BATCH_SIZE = 20;
let questions = [];
let mavzuLabel = '';
let pool = [];
let poolPos = 0;
let order = [];
let index = 0;
let score = 0;
let sessionScore = 0;
let sessionAnswered = 0;
let results = [];

async function init() {
  try {
    const res = await fetch(mavzuFayllari[activeMavzu]);
    if (!res.ok) throw new Error('Fayl topilmadi: ' + res.status);
    const data = await res.json();
    questions = data.savollar;
    mavzuLabel = data.label;
  } catch (err) {
    document.getElementById('loadingText').textContent = "Savollarni yuklashda xatolik yuz berdi. Qaytadan urinib ko'ring.";
    document.getElementById('loadingText').className = 'error-text';
    console.error(err);
    return;
  }

  document.getElementById('loadingText').style.display = 'none';
  document.getElementById('quizScreen').style.display = 'flex';
  document.getElementById('synapseTrail').style.display = 'flex';
  document.getElementById('questionEyebrow').style.display = 'block';
  document.getElementById('questionText').style.display = 'block';
  document.getElementById('answersContainer').style.display = 'flex';

  document.getElementById('categoryLabel').textContent = mavzuLabel;
  startBatch();
}

function nextBatch() {
  if (pool.length === 0) pool = shuffle(questions);

  let batch = [];
  while (batch.length < BATCH_SIZE) {
    if (poolPos >= pool.length) {
      pool = shuffle(questions);
      poolPos = 0;
    }
    batch.push(pool[poolPos]);
    poolPos++;
  }
  return batch;
}

function startBatch() {
  order = nextBatch();
  index = 0;
  score = 0;
  results = [];
  buildTrail();
  renderQuestion();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTrail() {
  const trail = document.getElementById('synapseTrail');
  trail.innerHTML = '';
  order.forEach((_, i) => {
    const node = document.createElement('div');
    node.className = 'synapse-node';
    node.id = 'node-' + i;
    trail.appendChild(node);
    if (i < order.length - 1) {
      const link = document.createElement('div');
      link.className = 'synapse-link';
      link.id = 'link-' + i;
      trail.appendChild(link);
    }
  });
}

function updateTrail() {
  order.forEach((_, i) => {
    const node = document.getElementById('node-' + i);
    node.classList.remove('current', 'lit', 'wrong');
    if (results[i] === true) node.classList.add('lit');
    else if (results[i] === false) node.classList.add('wrong');
    else if (i === index) node.classList.add('current');

    if (i < order.length - 1) {
      const link = document.getElementById('link-' + i);
      link.classList.toggle('lit', results[i] !== undefined);
    }
  });
}

function renderQuestion() {
  const q = order[index];
  document.getElementById('questionEyebrow').textContent = `Savol ${index + 1}/${order.length}`;
  document.getElementById('questionText').textContent = q.savol;
  document.getElementById('scoreValue').textContent = score;

  const container = document.getElementById('answersContainer');
  container.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  q.variantlar.forEach((variant, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.innerHTML = `<span class="badge">${letters[i]}</span><span>${variant}</span>`;
    btn.onclick = () => selectAnswer(i, btn);
    container.appendChild(btn);
  });

  updateTrail();
}

function selectAnswer(choice, btnEl) {
  const q = order[index];
  const buttons = document.querySelectorAll('.answer-btn');
  buttons.forEach(b => b.classList.add('disabled'));

  const correct = choice === q.togri;
  results[index] = correct;

  btnEl.classList.add('tapped');

  buttons.forEach((b, i) => {
    const badge = b.querySelector('.badge');
    if (i === q.togri) {
      b.classList.add('correct');
      badge.textContent = '✓';
    } else if (i === choice && !correct) {
      b.classList.add('wrong');
      badge.textContent = '✗';
    } else {
      b.classList.add('faded');
    }
  });

  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.notificationOccurred(correct ? 'success' : 'error');
  }

  if (correct) {
    score++;
    document.getElementById('scoreValue').textContent = score;
  }

  updateTrail();

  setTimeout(() => {
    index++;
    if (index >= order.length) {
      showResult();
    } else {
      renderQuestion();
    }
  }, 900);
}

function getTierText(pct) {
  const isCefr = activeMavzu.startsWith('cefr');
  if (isCefr) {
    if (pct >= 0.85) return { tier: "Taxminan B1 darajasiga yaqinsiz", sub: "(taxminiy natija — rasmiy sertifikat emas)" };
    if (pct >= 0.6) return { tier: "Taxminan A2 darajasidasiz", sub: "(taxminiy natija — rasmiy sertifikat emas)" };
    if (pct >= 0.35) return { tier: "Taxminan A1 darajasidasiz", sub: "(taxminiy natija — rasmiy sertifikat emas)" };
    return { tier: "Boshlang'ich (Pre-A1) daraja", sub: "(taxminiy natija — rasmiy sertifikat emas)" };
  }
  if (pct >= 0.85) return { tier: "Zehn ustasi", sub: "Deyarli hammasini bildingiz." };
  if (pct >= 0.6) return { tier: "Yaxshi natija", sub: "Bilimingiz yaxshi darajada." };
  if (pct >= 0.35) return { tier: "Yomon emas", sub: "Yana urinib ko'ring, yaxshilanadi." };
  return { tier: "Boshlang'ich daraja", sub: "Ko'proq mashq qiling." };
}

function showResult() {
  sessionScore += score;
  sessionAnswered += order.length;

  document.getElementById('quizScreen').style.display = 'none';
  document.getElementById('synapseTrail').style.display = 'none';
  document.getElementById('questionEyebrow').style.display = 'none';
  document.getElementById('questionText').style.display = 'none';
  document.getElementById('answersContainer').style.display = 'none';

  const resultScreen = document.getElementById('resultScreen');
  resultScreen.classList.add('active');
  document.getElementById('finalScore').textContent = sessionScore;
  document.getElementById('finalTotal').textContent = '/ ' + sessionAnswered;

  const pct = sessionScore / sessionAnswered;
  const { tier, sub } = getTierText(pct);
  document.getElementById('resultTier').textContent = tier;
  document.getElementById('resultSub').textContent = `Bu safar: ${score}/${order.length} • ${sub}`;

  document.getElementById('resultButtons').innerHTML = `
    <button class="restart-btn" onclick="playMore()">🔄 Yana o'ynash</button>
    <button class="restart-btn" onclick="finishSession()" style="background: var(--surface-2); color: var(--text-primary);">🏁 Tugatish</button>
  `;
}

function sendResultToBot(finished) {
  try {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.sendData(JSON.stringify({
        mavzu: activeMavzu,
        ball: sessionScore,
        jami: sessionAnswered,
        tugadi: finished
      }));
    }
  } catch (e) {
    // sendData faqat klaviatura tugmasi orqali ochilgan Mini App'larda ishlaydi
  }
  if (finished) closeApp();
}

function playMore() {
  document.getElementById('quizScreen').style.display = 'flex';
  document.getElementById('synapseTrail').style.display = 'flex';
  document.getElementById('questionEyebrow').style.display = 'block';
  document.getElementById('questionText').style.display = 'block';
  document.getElementById('answersContainer').style.display = 'flex';
  document.getElementById('resultScreen').classList.remove('active');
  startBatch();
}

function finishSession() {
  const pct = sessionScore / sessionAnswered;
  const { tier } = getTierText(pct);

  document.getElementById('resultTier').textContent = "Yakuniy natijangiz";
  document.getElementById('resultSub').textContent = `${sessionAnswered} ta savoldan ${sessionScore} tasiga to'g'ri javob berdingiz. ${tier}.`;
  document.getElementById('resultButtons').innerHTML = `
    <button class="restart-btn" onclick="closeApp()">✅ Yopish</button>
  `;
}

function closeApp() {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.close();
  }
}

applyTheme();

if (window.Telegram && window.Telegram.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
  window.Telegram.WebApp.onEvent('themeChanged', applyTheme);
}

init();
</script>
</body>
</html>
