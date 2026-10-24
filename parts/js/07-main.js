// ===== MAIN LOOP + test hooks =====
function bestGateMix(){
  let bi=0,bv=-1;S.gates.forEach((g,i)=>{let tot=0;for(const s of S.grid)if(s)tot+=tierRate(s.tier)*gateApply(tierVolley(s.tier),g);if(tot>bv){bv=tot;bi=i}});return bi;
}
function botAct(maxM){maxM=maxM||30; // plays like a kid who knows the rules (used by tests)
  if(S.mode!=='play')return;
  for(let guard=0;guard<maxM;guard++){
    let did=false;const by={};
    S.grid.forEach((s,i)=>{if(s&&s.drop<=0)(by[s.tier]=by[s.tier]||[]).push(i)});
    for(const t of Object.keys(by).map(Number).sort((a,b)=>a-b)){if(by[t].length>=2){doMerge(by[t][0],by[t][1]);did=true;break}}
    if(!did)break;
  }
  if(S.tut===0)S.tut=1;
  selectGate(bestGateMix());
  if(SV.coins>=buyCost()&&emptySlots().length>1)buySpawner();
}
function snapshot(){
  let army=0,red=0;for(const b of S.blues)army+=b.n;for(const r of S.reds)red+=r.n;
  return{mode:S.mode,level:S.level,theme:S.theme.n,t:S.t,coins:SV.coins,army,blueBlobs:S.blues.length,redBlobs:S.reds.length,red,
    wallHP:S.wallHP,wallMax:S.wallMax,boss:S.boss?{hp:S.boss.hp,max:S.boss.max,name:S.boss.name,kind:S.boss.kind,y:S.boss.y}:null,
    grid:S.grid.map(s=>s?s.tier:0),gates:S.gates.map(g=>({op:g.op,v:g.v,eff:gateEff(g),label:gateLabel(g)})),sel:S.sel,bought:S.bought,buyCost:buyCost(),
    up:Object.assign({},SV.up),save:JSON.parse(JSON.stringify(SV)),earned:S.earned,kills:S.kills,unitsMade:S.unitsMade,merges:S.merges,maxTier:S.maxTier,tut:S.tut,
    parts:S.parts.length,pending:S.emit.reduce((a,e)=>a+e.acc,0),confetti:Fx.count(),paused,overlay:curOv(),boost:S.boost,starReady:S.starReady,storage:Store.kind,wave:S.nextWave,waves:S.plan?S.plan.K:0,bossSpawned:S.bossSpawned};
}
function advance(sec,opts){
  opts=opts||{};const dt=1/30;let acc=0;
  for(let t=0;t<sec;t+=dt){
    if(opts.bot){acc+=dt;if(acc>=(opts.period||0.4)){acc=0;botAct(opts.maxM)}}
    update(dt);
    if(opts.stopAtEnd&&S.mode!=='play'&&S.endShown)break;
  }
  return snapshot();
}
function stressArmy(blobsPerSide,nPer){
  S.blues.length=0;S.reds.length=0;
  for(let i=0;i<blobsPerSide;i++){const b=newBlob(rand(10,350),rand(40,LAY.wallTop-30),nPer,0);S.blues.push(b);const r=newBlob(rand(10,350),rand(20,LAY.wallTop-60),nPer,1);S.reds.push(r)}
  for(let i=0;i<260;i++)fling(rand(20,340),rand(60,300),i%2,1);
}
function benchFrames(n){
  const t0=performance.now();let upd=0,rnd=0;
  for(let i=0;i<n;i++){const a=performance.now();update(1/60);const b=performance.now();render();const c=performance.now();upd+=b-a;rnd+=c-b}
  // force raster to be included
  ctx.getImageData(0,0,1,1);
  return{total:(performance.now()-t0)/n,update:upd/n,render:rnd/n};
}
window.__MA={TUNE,resetProgress:()=>{SV.up={gate:0,speed:0,wall:0,start:0,coin:0};SV.coins=0;saveNow()},setReached:n=>{SV.maxLevel=n;SV.level=n;saveNow()},quiz:()=>curQ,audio:()=>Snd.ctx()&&Snd.ctx().state,state:snapshot,advance,bot:botAct,startLevel:l=>{hideOv();startLevel(l)},buy:buySpawner,merge:doMerge,selectGate,stressArmy,benchFrames,
  gateApply:(n,op,v)=>gateApply(n,{op,v}),setGates:a=>{S.gates=a.map(g=>newGate({op:g.op,v:g.v}))},place:(i,t)=>placeSpawner(i,t,false),clearGrid:()=>S.grid.fill(null),
  giveCoins:n=>{addCoins(n);saveNow()},setWallHP:v=>{S.wallHP=v;S.wallMax=Math.max(S.wallMax,v)},fmt,slotCenter,slotRect,LAY,GATE_X,tierVolley,tierRate,
  spawnBoss:()=>{if(!S.bossSpawned)spawnBoss()},saveNow,reload:()=>loadSave(),UPS,buyUpgrade,openUpgrades,openMap,levelPlan,makeQuestion,
  forceStar:()=>{S.starReady=true;Hooks.starReady(true)},killReds:()=>{S.reds.length=0;S.jobs.length=0},setBossHP:v=>{if(S.boss)S.boss.hp=v},GAME_NAME,
  rates:()=>({volley:tierVolley,rate:tierRate}),theme:()=>S.theme};
let lastTs=0,hudAcc=0;
function frame(ts){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,Math.max(0,(ts-lastTs)/1000)||0.016);lastTs=ts;
  if(!paused)update(dt);
  Fx.step(dt);render();Fx.draw();
  hudAcc+=dt;if(hudAcc>.06){updateHUD(hudAcc);hudAcc=0}
  maybeSave();
}
function boot(){
  loadSave();wireUI();resize();
  startLevel(SV.level);S.mode='title';
  showOv('ovTitle');$('playBtn').textContent=SV.level>1?'▶ PLAY Level '+SV.level:'▶ PLAY';
  updateHUD(1);
  window.addEventListener('resize',()=>{resize()});window.addEventListener('orientationchange',()=>setTimeout(resize,200));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)saveNow()});window.addEventListener('pagehide',saveNow);
  requestAnimationFrame(frame);
}
boot();
