const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let lang = 'de';

const tools = ['meteor', 'explosion', 'fire', 'placeTree', 'placeHouse'];
let currentTool = 'meteor';

let score = 0;

const mapWidth = canvas.width;
const mapHeight = canvas.height;

// Spielzustand: zerstörte Stellen, platzierte Objekte
let destroyedSpots = [];
let placedObjects = [];

const toolButtons = document.querySelectorAll('#tools button');
toolButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentTool = btn.getAttribute('data-tool');
  });
});

const scoreEl = document.getElementById('score');

const langBtn = document.getElementById('btnToggleLang');
langBtn.addEventListener('click', () => {
  if(lang === 'de') {
    lang = 'en';
    langBtn.textContent = 'Wechsel zu Deutsch';
  } else {
    lang = 'de';
    langBtn.textContent = 'Switch to English';
  }
  updateTexts();
});

function updateTexts() {
  if(lang === 'de') {
    document.querySelector('h1').textContent = 'TerraSim Demo';
    scoreEl.parentElement.querySelector('h2').textContent = 'Punkte: ';
    scoreEl.textContent = score;
    document.getElementById('exportAHS').textContent = '.ahs exportieren';
  } else {
    document.querySelector('h1').textContent = 'TerraSim Demo';
    scoreEl.parentElement.querySelector('h2').textContent = 'Score: ';
    scoreEl.textContent = score;
    document.getElementById('exportAHS').textContent = 'Export .ahs';
  }
}
updateTexts();

function draw() {
  // Hintergrund
  ctx.fillStyle = '#446633';
  ctx.fillRect(0, 0, mapWidth, mapHeight);

  // Zeichne zerstörte Spots
  destroyedSpots.forEach(spot => {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(100,0,0,0.6)';
    ctx.arc(spot.x, spot.y, spot.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Zeichne platzierte Objekte
  placedObjects.forEach(obj => {
    if(obj.type === 'tree') {
      ctx.fillStyle = 'green';
      ctx.fillRect(obj.x - 5, obj.y - 10, 10, 20);
    } else if(obj.type === 'house') {
      ctx.fillStyle = 'brown';
      ctx.fillRect(obj.x - 15, obj.y - 15, 30, 30);
    }
  });

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if(currentTool === 'meteor') {
    destroyedSpots.push({x,y,size:20});
    score += 10;
  } else if(currentTool === 'explosion') {
    destroyedSpots.push({x,y,size:30});
    score += 15;
  } else if(currentTool === 'fire') {
    destroyedSpots.push({x,y,size:40});
    score += 20;
  } else if(currentTool === 'placeTree') {
    placedObjects.push({type:'tree', x, y});
    score += 5;
  } else if(currentTool === 'placeHouse') {
    placedObjects.push({type:'house', x, y});
    score += 7;
  }
  updateTexts();
});

// .ahs Speicherfunktion (einfaches "verschleiern" mit Base64 + Symbolumwandlung)
function encodeAHS(data) {
  let json = JSON.stringify(data);
  let b64 = btoa(json);
  // Beispiel: Ersetze Base64-Zeichen durch eigene Symbole (nur zum Beispiel)
  const map = {'A':'Δ', 'B':'β', 'C':'©', 'D':'δ', 'E':'€', 'F':'φ', 'G':'γ', 'H':'η',
               'I':'ι', 'J':'ξ', 'K':'κ', 'L':'λ', 'M':'μ', 'N':'ν', 'O':'ο', 'P':'π',
               'Q':'θ', 'R':'ρ', 'S':'σ', 'T':'τ', 'U':'υ', 'V':'ν', 'W':'ω', 'X':'χ',
               'Y':'ψ', 'Z':'ζ', '+':'+', '/':'/'};
  let result = '';
  for(let ch of b64) {
    if(map[ch]) result += map[ch];
    else result += ch;
  }
  return '⟦AHS_BEGIN⟧\n' + result + '\n⟦AHS_END⟧';
}

function decodeAHS(text) {
  const map = {'Δ':'A', 'β':'B', '©':'C', 'δ':'D', '€':'E', 'φ':'F', 'γ':'G', 'η':'H',
               'ι':'I', 'ξ':'J', 'κ':'K', 'λ':'L', 'μ':'M', 'ν':'V', 'ο':'O', 'π':'P',
               'θ':'Q', 'ρ':'R', 'σ':'S', 'τ':'T', 'υ':'U', 'ν':'N', 'ω':'W', 'χ':'X',
               'ψ':'Y', 'ζ':'Z'};
  let b64 = '';
  for(let ch of text) {
    if(map[ch]) b64 += map[ch];
    else b64 += ch;
  }
  return atob(b64);
}

const exportBtn = document.getElementById('exportAHS');
const importInput = document.getElementById('importAHS');

exportBtn.addEventListener('click', () => {
  const data = {destroyedSpots, placedObjects, score, lang};
  const encoded = encodeAHS(data);
  const blob = new Blob([encoded], {type:'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'terraSim_save.ahs';
  a.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    const text = evt.target.result;
    if(text.includes('⟦AHS_BEGIN⟧') && text.includes('⟦AHS_END⟧')) {
      const core = text.split('⟦AHS_BEGIN⟧')[1].split('⟦AHS_END⟧')[0].trim();
      const jsonStr = decodeAHS(core);
      try {
        const data = JSON.parse(jsonStr);
        destroyedSpots = data.destroyedSpots || [];
        placedObjects = data.placedObjects || [];
        score = data.score || 0;
        lang = data.lang || 'de';
        updateTexts();
      } catch {
        alert('Fehler beim Laden der .ahs Datei');
      }
    } else {
      alert('Ungültiges .ahs Format');
    }
  };
  reader.readAsText(file);
});