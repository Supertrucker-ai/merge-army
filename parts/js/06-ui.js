// ===== UI (DOM overlays, HUD) =====
const $=id=>document.getElementById(id);
let paused=false,uiBack='title',lastHud=0;
const ICONS={Moon:'🌕',Mars:'🔴',Egypt:'🇪🇬',Venus:'🟠',Jupiter:'🟤',Japan:'🇯🇵',Saturn:'🪐',Uranus:'🔵',France:'🇫🇷',Neptune:'🌀',Mercury:'⚪',Brazil:'🇧🇷',Pluto:'🪨','Asteroid Belt':'☄️',Australia:'🇦🇺',Antarctica:'🐧'};
function showOv(id){for(const o of ['ovTitle','ovWin','ovLose','ovUp','ovMap','ovQuiz'])$(o).classList.toggle('on',o===id);
  paused=(id==='ovUp'||id==='ovMap'||id==='ovQuiz'||id==='ovTitle')}
function hideOv(){showOv(null);paused=false}
function curOv(){for(const o of ['ovTitle','ovWin','ovLose','ovUp','ovMap','ovQuiz'])if($(o).classList.contains('on'))return o;return null}
let toastT=0;
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),1800)}
const Hooks={
  levelStart(){$('lvlN').textContent='Level '+S.level;$('lvlName').textContent=(ICONS[S.theme.n]||'')+' '+S.theme.n;$('starBtn').classList.add('hidden');$('boostBadge').classList.add('hidden');S.armyShown=0},
  toast,
  merged(t){$('army').classList.remove('pulse');void $('army').offsetWidth;$('army').classList.add('pulse')},
  wave(i,k){toast('⚔️ Wave '+i+' of '+k+' is coming!')},
  boss(n){toast('⚠️ '+n+' appears!')},
  starReady(v){$('starBtn').classList.toggle('hidden',!v)},
  showWin(){
    $('winSub').textContent='You beat the '+S.plan.boss.name+' on '+S.theme.n+'!';
    $('winCoins').innerHTML='You earned <i class="coin"></i> '+fmt(Math.round(S.earned));
    $('winFact').textContent='🌍 Fun fact: '+S.theme.fact;
    $('winNext').textContent='Next Level '+(S.level+1)+' ▶';
    showOv('ovWin');paused=false;
  },
  showLose(){$('loseCoins').innerHTML='Your coins are safe: <i class="coin"></i> '+fmt(SV.coins);showOv('ovLose');paused=false}
};
// ----- upgrades -----
const UPS=[
 {k:'gate',ic:'🚪',nm:'Gate Power',cost:l=>Math.round(30*Math.pow(1.7,l)),desc:l=>'Every × gate gets +1 bigger and every + gate gets +5! Now: ×2 gate = ×'+(2+l)},
 {k:'speed',ic:'⚡',nm:'Spawn Speed',cost:l=>Math.round(25*Math.pow(1.6,l)),desc:l=>'New spawners drop faster and everything fires faster. Now: drop every '+(8/(1+.1*l)).toFixed(1)+'s, fire +'+(5*l)+'%'},
 {k:'wall',ic:'🧱',nm:'Wall HP',cost:l=>Math.round(20*Math.pow(1.5,l)),desc:l=>'A stronger wall that takes more bonks. Now: +'+(25*l)+'% wall HP'},
 {k:'start',ic:'🏁',nm:'Starting Spawners',cost:l=>Math.round(40*Math.pow(1.9,l)),desc:l=>'Start every level with more spawners! Now: '+(2+l)+' spawners worth of army'},
 {k:'coin',ic:'🪙',nm:'Coin Boost',cost:l=>Math.round(50*Math.pow(1.8,l)),desc:l=>'Earn more coins from battles. Now: +'+(10*l)+'% coins'}
];
function buyUpgrade(k){
  const d=UPS.find(u=>u.k===k),l=U(k),c=d.cost(l);
  if(SV.coins<c){Snd.bad();toast('Need more coins!');return}
  SV.coins-=c;SV.up[k]=l+1;Snd.buy();
  if(k==='wall'&&S.plan){const nm=wallMaxFor(S.level);S.wallHP+=nm-S.wallMax;S.wallMax=nm}
  saveNow();renderUpgrades();
}
function renderUpgrades(){
  $('upCoins').textContent=fmt(SV.coins);const list=$('upList');list.innerHTML='';
  for(const d of UPS){const l=U(d.k),c=d.cost(l),el=document.createElement('div');el.className='item';el.dataset.k=d.k;
    el.innerHTML='<div class="ic">'+d.ic+'</div><div class="tx"><div class="nm">'+d.nm+'<span class="lv">Lv '+l+'</span></div><div class="ds">'+d.desc(l)+'</div></div>';
    const b=document.createElement('button');b.className=SV.coins>=c?'':'poor';b.dataset.k=d.k;b.innerHTML='<span>Buy</span><span><i class="coin"></i> '+fmt(c)+'</span>';
    b.addEventListener('click',()=>{Snd.unlock();buyUpgrade(d.k)});el.appendChild(b);list.appendChild(el)}
  const n=document.createElement('div');n.className='item';n.innerHTML='<div class="ic">♾️</div><div class="tx"><div class="nm">No limits!</div><div class="ds">You can buy every upgrade again and again, forever. Coins are never lost, even when you lose a level.</div></div>';list.appendChild(n);
}
function openUpgrades(){uiBack=curOv()||(S.mode==='play'?null:'ovTitle');renderUpgrades();showOv('ovUp');Snd.click()}
function closeSheet(){Snd.click();if(uiBack&&uiBack!=='ovUp')showOv(uiBack);else hideOv();if(uiBack==='ovWin'||uiBack==='ovLose')paused=false}
function renderMap(){
  const list=$('mapList');list.innerHTML='';
  const hi=Math.min(SV.maxLevel+2,300);
  for(let l=hi;l>=1;l--){const T=THEMES[(l-1)%THEMES.length],locked=l>SV.maxLevel,el=document.createElement('div');el.className='item'+(locked?' locked':'')+(l===S.level&&S.mode==='play'?' cur':'');
    el.innerHTML='<div class="ic">'+(locked?'🔒':ICONS[T.n]||'🌍')+'</div><div class="tx"><div class="nm">Level '+l+' · '+T.n+'</div><div class="ds">'+(locked?'Win earlier levels to unlock!':T.fact)+'</div></div>';
    if(!locked){const b=document.createElement('button');b.textContent='Play';b.dataset.level=l;b.addEventListener('click',()=>{Snd.unlock();Snd.click();hideOv();startLevel(l)});el.appendChild(b)}
    list.appendChild(el)}
}
function openMap(){uiBack=curOv()||(S.mode==='play'?null:'ovTitle');renderMap();showOv('ovMap');Snd.click()}
// ----- math star question -----
let curQ=null,qDone=false;
function openQuiz(){
  if(S.mode!=='play'||!S.starReady)return;curQ=makeQuestion(S.level);qDone=false;
  $('qText').textContent=curQ.q;$('qText').style.fontSize=curQ.q.length>24?'24px':'30px';$('qMsg').textContent='';
  const a=$('qAns');a.innerHTML='';a.classList.toggle('small',!!curQ.small);
  for(const c of curQ.choices){const b=document.createElement('button');b.textContent=c;b.dataset.v=c;b.addEventListener('click',()=>answerQuiz(b,c));a.appendChild(b)}
  $('qSkip').classList.remove('hidden');showOv('ovQuiz');Snd.click();
}
function answerQuiz(btn,c){
  if(qDone)return;
  if(c===curQ.ans){qDone=true;btn.classList.add('ok');Snd.good();
    const coins=Math.ceil(coinPool(S.level)*0.12*(1+0.1*U('coin')));addCoins(coins);S.boost=Math.max(S.boost,10);S.earned+=coins;S.starReady=false;S.starT=32;
    $('qMsg').textContent='🎉 Correct! +'+coins+' coins and ×2 boost!';$('qSkip').classList.add('hidden');confetti(40);
    setTimeout(()=>{if(curOv()==='ovQuiz'){hideOv();Hooks.starReady(false)}},1300);
  }else{btn.classList.add('bad');Snd.bad();$('qMsg').textContent='Not quite - try again! 💪'}
}
// ----- HUD refresh -----
function updateHUD(dt){
  let army=0;for(const b of S.blues)army+=b.n;for(const e of S.emit)army+=e.acc;
  S.armyShown+=(army-S.armyShown)*Math.min(1,dt*10);if(Math.abs(army-S.armyShown)<1)S.armyShown=army;
  $('armyN').textContent=fmt(S.armyShown);
  $('coinN').textContent=fmt(SV.coins);
  const cost=buyCost(),poor=SV.coins<cost,full=emptySlots().length===0;
  $('buyCost').textContent=fmt(cost);$('buyBtn').classList.toggle('poor',poor&&!full);$('buyBtn').classList.toggle('full',full);
  $('buyBtn').querySelector('.t').textContent=full?'Merge to make room!':'Buy Spawner';
  const bb=$('boostBadge');bb.classList.toggle('hidden',!(S.boost>0));if(S.boost>0)$('boostT').textContent=Math.ceil(S.boost);
  let afford=false;for(const d of UPS)if(SV.coins>=d.cost(U(d.k)))afford=true;
  $('upBtn').classList.toggle('glow',afford&&S.mode!=='play'?true:afford&&S.t>5&&S.level>1);
  $('sndBtn').textContent=SV.sound?'🔊':'🔇';
}
function wireUI(){
  const tap=(id,fn)=>$(id).addEventListener('click',e=>{Snd.unlock();fn(e)});
  tap('playBtn',()=>{Snd.click();hideOv();startLevel(SV.level)});
  tap('tUp',openUpgrades);tap('tMap',openMap);tap('upBtn',openUpgrades);tap('mapBtn',openMap);
  tap('upClose',closeSheet);tap('mapClose',closeSheet);
  tap('buyBtn',()=>{buySpawner()});
  tap('sndBtn',()=>{SV.sound=!SV.sound;markDirty();saveNow();if(SV.sound)Snd.click()});
  tap('winNext',()=>{Snd.click();hideOv();startLevel(S.level+1)});
  tap('winUp',openUpgrades);
  tap('loseRetry',()=>{Snd.click();hideOv();startLevel(S.level)});
  tap('loseUp',openUpgrades);
  tap('starBtn',openQuiz);
  tap('qSkip',()=>{Snd.click();hideOv()});
  $('logoName').textContent=GAME_NAME;
}
