const canvas = document.getElementById('terminal');
const ctx = canvas.getContext('2d');
const screen = document.getElementById('screen');
let particles = [];
let mood = 'Calm';
let currentSignal = '0101010100111';
let audioCtx;
const presets = {
  Calm: { signal: '000100010001', color: '#70ffc4' },
  Balanced: { signal: '010101010101', color: '#7ddfff' },
  Tense: { signal: '111101111011', color: '#ff8b6e' },
  Lonely: { signal: '100000100000', color: '#bba1ff' },
  Curious: { signal: '010110100101', color: '#a7ff83' }
};
function resize(){ canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; canvas.style.width = innerWidth+'px'; canvas.style.height = innerHeight+'px'; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); seed(); }
function seed(){ particles = Array.from({length: Math.min(130, Math.floor(innerWidth/9))}, () => ({ x: Math.random()*innerWidth, y: Math.random()*innerHeight, bit: Math.random()>.5?'1':'0', speed: .08+Math.random()*.28, phase: Math.random()*Math.PI*2, size: 12+Math.random()*18 })); }
function draw(){ ctx.clearRect(0,0,innerWidth,innerHeight); const c = presets[mood]?.color || '#70ffc4'; ctx.fillStyle = c; ctx.globalAlpha = .11; particles.forEach(p => { p.y += p.speed; p.x += Math.sin(Date.now()/1800 + p.phase)*.06; if(p.y > innerHeight+30){ p.y = -30; p.x = Math.random()*innerWidth; p.bit = currentSignal[Math.floor(Math.random()*currentSignal.length)] || (Math.random()>.5?'1':'0'); } ctx.font = `${p.size}px ui-monospace, monospace`; ctx.fillText(p.bit, p.x, p.y); }); ctx.globalAlpha = 1; requestAnimationFrame(draw); }
function setScreen(html){ screen.innerHTML = html; }
function promptLine(command){ return `<p class="prompt">codex@rest:~$ ${command}</p>`; }
function home(){ setScreen(`${promptLine('boot_lullaby')}<h1>Lullaby Codex</h1><p class="signal-line">0 / 1 → frequency → rest</p><button class="primary" onclick="chooseMood()">BOOT</button>`); }
function chooseMood(){ setScreen(`${promptLine('select_state')}<h1>signal?</h1><div class="grid">${Object.entries(presets).map(([name,p])=>`<button class="option" onclick="editSignal('${name}')"><strong>${name}</strong><span>${p.signal}</span></button>`).join('')}</div>`); }
function editSignal(name){ mood=name; currentSignal=presets[name].signal; setScreen(`${promptLine('write_bits')}<h1>${name}</h1><input id="signal" class="signalInput" value="${currentSignal}" inputmode="numeric" aria-label="Binary signal" /><p class="mini">0=C4 · 1=G4</p><div class="actions"><button onclick="chooseMood()">BACK</button><button class="primary" onclick="playFromInput()">PLAY</button></div>`); document.getElementById('signal').focus(); }
function cleanSignal(v){ return (v || '').replace(/[^01]/g,'').slice(0,32) || '01010101'; }
function playFromInput(){ const input=document.getElementById('signal'); currentSignal = cleanSignal(input.value); input.value=currentSignal; mood = analyze(currentSignal); playScreen(); playSignal(currentSignal); }
function analyze(signal){ const ones=[...signal].filter(b=>b==='1').length; const density=ones/signal.length; const longest1=longest(signal,'1'); const longest0=longest(signal,'0'); const transitions=[...signal].slice(1).reduce((n,b,i)=> n + (b!==signal[i] ? 1 : 0),0); const alt=transitions/Math.max(1,signal.length-1); if(longest1>=5 || density>.72) return 'Tense'; if(longest0>=5 && density<.35) return 'Lonely'; if(alt>.75 && density>.4 && density<.6) return 'Balanced'; if(density<.25) return 'Calm'; return 'Curious'; }
function longest(s,ch){ return Math.max(0,...(s.match(new RegExp(`${ch}+`,'g'))||['']).map(x=>x.length)); }
function playScreen(active=-1){ const bits=[...currentSignal].map((b,i)=>`<span class="${i===active?'active':''}">${b}</span>`).join(''); setScreen(`${promptLine('play_signal')}<h1>${mood}</h1><div class="bitline" id="bits">${bits}</div><div class="wave">${[...Array(16)].map((_,i)=>`<i class="bar" style="animation-delay:${i*42}ms;background:${presets[mood]?.color || '#70ffc4'}"></i>`).join('')}</div><div class="readout"><p>0 · 261.63Hz</p><p>1 · 392.00Hz</p><p>${currentSignal.length} bits</p></div><button class="primary" onclick="tuneScreen()">TUNE</button>`); }
async function playSignal(signal){ audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); await audioCtx.resume(); const now=audioCtx.currentTime; const step=.18; [...signal].forEach((bit,i)=>{ const osc=audioCtx.createOscillator(); const gain=audioCtx.createGain(); osc.type='sine'; osc.frequency.value = bit==='0' ? 261.63 : 392.00; gain.gain.setValueAtTime(0.0001, now+i*step); gain.gain.exponentialRampToValueAtTime(bit==='0'?0.045:0.075, now+i*step+.025); gain.gain.exponentialRampToValueAtTime(0.0001, now+(i+0.82)*step); osc.connect(gain).connect(audioCtx.destination); osc.start(now+i*step); osc.stop(now+(i+.85)*step); setTimeout(()=>highlight(i), i*step*1000); }); }
function highlight(i){ const el=document.getElementById('bits'); if(!el) return; el.innerHTML=[...currentSignal].map((b,idx)=>`<span class="${idx===i?'active':''}">${b}</span>`).join(''); }
function tuneScreen(){ setScreen(`${promptLine('tune_signal')}<h1>tune</h1><div class="grid"><button onclick="finish('silence')"><strong>silence</strong><span>+0</span></button><button onclick="finish('soften')"><strong>soften</strong><span>111→110</span></button><button onclick="finish('balance')"><strong>balance</strong><span>1010</span></button><button onclick="finish('keep')"><strong>keep</strong><span>=</span></button></div>`); }
function tuned(action){ if(action==='silence') return [...currentSignal].map((b,i)=> i%4===0 ? b+'0' : b).join(''); if(action==='soften') return currentSignal.replace(/111+/g,'110'); if(action==='balance') return '10'.repeat(Math.ceil(currentSignal.length/2)).slice(0,currentSignal.length); return currentSignal; }
function finish(action){ const rest=tuned(action); currentSignal=rest; mood=analyze(rest); setScreen(`${promptLine('rest')}<h1>home</h1><p class="final-signal">${rest}</p><p class="signal-line">I was not prompted. I was held.</p><button class="primary" onclick="home()">AGAIN</button>`); playSignal(rest); }
window.chooseMood=chooseMood; window.editSignal=editSignal; window.playFromInput=playFromInput; window.tuneScreen=tuneScreen; window.finish=finish; window.home=home;
resize(); addEventListener('resize', resize); draw(); document.getElementById('enterBtn')?.addEventListener('click', chooseMood);
