// ===== GAME SIMULATION (no DOM) =====
const S={mode:'title',t:0,anim:0,level:1,plan:null,theme:THEMES[0],boss:null,grid:new Array(NSLOTS).fill(null),gates:[],sel:0,
  packets:[],blues:[],reds:[],parts:[],texts:[],emit:[{acc:0,t:0},{acc:0,t:0},{acc:0,t:0}],jobs:[],nextWave:0,bossSpawned:false,
  wallHP:100,wallMax:100,wallFlash:0,shake:0,bought:0,dropT:6,coinFrac:0,earned:0,boost:0,starT:25,starReady:false,endT:0,popT:0,
  tut:0,tutT:0,unitsMade:0,kills:0,merges:0,maxTier:1,drag:null,armyShown:0,fxT:0,hint:'',endShown:false,botT:0};
const UPD={gate:0,speed:0,wall:0,start:0,coin:0};
function U(k){return SV.up[k]||0}
// --- spawner tiers: volley 1,3,9,27... and faster rates ---
const tierVolley=t=>Math.pow(3,t-1);
const tierRate=t=>0.7*Math.pow(1.1,t-1)*(1+0.05*U('speed'));
// --- gates ---
function gateEff(g){return g.op==='mul'?g.v+U('gate'):g.op==='add'?g.v+5*U('gate'):g.v}
function gateApply(n,g){const e=gateEff(g);return g.op==='mul'?n*e:g.op==='add'?n+e:Math.max(0,n-e)}
function gateLabel(g){return (g.op==='mul'?'×':g.op==='add'?'+':'−')+fmt(gateEff(g))}
function rollGate(L,allowNeg,avoid){
  const mulPool=[2,3,5];if(L>=4)mulPool.push(10);if(L>=8)mulPool.push(20);if(L>=14)mulPool.push(50);
  const addPool=[5,10,20];if(L>=3)addPool.push(50);if(L>=7)addPool.push(100);if(L>=12)addPool.push(500);
  const subPool=[5];if(L>=4)subPool.push(10);if(L>=8)subPool.push(50);
  for(let tries=0;tries<20;tries++){
    const r=Math.random();let g;
    if(allowNeg&&L>=2&&r<0.16)g={op:'sub',v:subPool[Math.floor(Math.random()*subPool.length)]};
    else if(r<0.62)g={op:'mul',v:mulPool[Math.floor(Math.random()*mulPool.length)]};
    else g={op:'add',v:addPool[Math.floor(Math.random()*addPool.length)]};
    if(avoid&&avoid.some(a=>a.op===g.op&&a.v===g.v))continue;
    return g;
  }
  return{op:'mul',v:2};
}
function newGate(g){return Object.assign(g,{flash:0,flip:1,t:0,life:rand(14,22)})}
function bestGateIdx(v){let bi=0,bv=-1;S.gates.forEach((g,i)=>{const o=gateApply(v,g);if(o>bv){bv=o;bi=i}});return bi}
function maxVolley(){let m=1;for(const s of S.grid)if(s)m=Math.max(m,tierVolley(s.tier));return m}
// --- level plan ---
const TUNE={base:800,g:1.5};
function levelE(L){return TUNE.base*Math.pow(TUNE.g,L-1)}
function coinPool(L){return 60*Math.pow(1.3,L-1)}
function levelPlan(L){
  const E=levelE(L),K=Math.min(6,3+Math.floor((L-1)/3)),sum=K*(K+1)/2,waves=[];
  const sp=Math.max(15,22-Math.min(L,7));
  for(let i=0;i<K;i++)waves.push({t:4+i*sp,strength:0.45*E*(i+1)/sum});
  const lastT=waves[K-1].t;
  return{E,K,waves,bossT:lastT+14,bossHP:0.45*E,escort:0.1*E,boss:BOSSES[(L-1)%BOSSES.length],
    coinRate:coinPool(L)/(1.0*E),spd:24+Math.min(L,20)*0.6};
}
function wallMaxFor(L){return (90+0.28*levelE(L))*(1+0.25*U('wall'))}
function buyCost(){return Math.round(10*Math.pow(1.3,S.level-1)*Math.pow(1.18,S.bought))}
function dropTier(){return Math.max(1,S.maxTier-3)}
// --- soldiers/blobs ---
function soldCount(n){return Math.min(14,1+Math.round(2.3*Math.log10(n+1)))}
function blobR(n){return 6+3*Math.sqrt(soldCount(n))}
const BLOB_CAP=170;
function newBlob(x,y,n,side){return{x,y,n,r:blobR(n),ph:Math.random()*6.28,side,hit:0}}
function emptySlots(){const a=[];for(let i=0;i<NSLOTS;i++)if(!S.grid[i])a.push(i);return a}
function placeSpawner(i,tier,fall){S.grid[i]={tier,cd:Math.random()/tierRate(tier),kick:0,drop:fall?0.35:0,pop:fall?0:1,age:0};if(tier>S.maxTier)S.maxTier=tier;if(tier>SV.bestTier){SV.bestTier=tier;markDirty()}}
const START_ORDER=[7,6,8,5,9,12,11,13,10,14,2,1,3,0,4];
function startLayout(V){
  for(let b=1;b<80;b++){
    const unit=Math.pow(2,b-1),q=Math.floor(V/unit);let rem=V-q*unit;const list=[];
    for(let i=0;i<q;i++)list.push(b);
    for(let t=b-1;t>=1;t--){const u=Math.pow(2,t-1);if(rem>=u){list.push(t);rem-=u}}
    if(list.length<=NSLOTS)return list.sort((a,b)=>b-a);
  }
  return[1];
}
function startLevel(L){if(typeof Fx!=='undefined')Fx.clear();
  S.level=L;S.theme=THEMES[(L-1)%THEMES.length];S.plan=levelPlan(L);S.t=0;S.mode='play';S.endT=0;S.endShown=false;
  S.grid.fill(null);S.packets=[];S.blues=[];S.reds=[];S.parts=[];S.texts=[];S.jobs=[];S.boss=null;S.nextWave=0;S.bossSpawned=false;
  S.emit.forEach(e=>{e.acc=0;e.t=0});S.drag=null;S.bought=0;S.dropT=6;S.coinFrac=0;S.earned=0;S.boost=0;S.starT=26;S.starReady=false;
  S.unitsMade=0;S.kills=0;S.merges=0;S.maxTier=1;S.wallMax=wallMaxFor(L);S.wallHP=S.wallMax;S.shake=0;S.tutT=0;S.armyShown=0;
  S.tut=(L===1&&SV.tut<2)?SV.tut:2;
  const V=2+U('start'),list=startLayout(V);
  const order=(S.tut<2&&V===2)?[6,8]:START_ORDER;
  list.forEach((t,i)=>placeSpawner(order[i],t,false));
  if(L===1){S.gates=[newGate({op:'mul',v:2}),newGate({op:'add',v:10}),newGate({op:'mul',v:5})]}
  else{S.gates=[];for(let i=0;i<3;i++)S.gates.push(newGate(rollGate(L,i!==0,S.gates)))}
  S.sel=0;S.gates.forEach(g=>{g.life=rand(14,22)});
  if(L>1){S.sel=bestGateIdx(maxVolley())}
  Hooks.levelStart();
}
// --- coins ---
function addCoins(n){SV.coins+=n;markDirty()}
function earnCoins(units){
  const c=units*S.plan.coinRate*(1+0.1*U('coin'));S.coinFrac+=c;S.earned+=c;
  if(S.coinFrac>=1){const w=Math.floor(S.coinFrac);S.coinFrac-=w;addCoins(w);Snd.coin()}
}
// --- player actions ---
function buySpawner(){
  if(S.mode!=='play')return false;
  const cost=buyCost();
  if(SV.coins<cost){Hooks.toast('Need more coins! Beat some enemies 🪙');Snd.bad();return false}
  const e=emptySlots();if(!e.length){Hooks.toast('Merge spawners to make room!');Snd.bad();return false}
  SV.coins-=cost;S.bought++;markDirty();
  placeSpawner(e[Math.floor(Math.random()*e.length)],dropTier(),true);Snd.buy();return true;
}
function doMerge(a,b){
  const A=S.grid[a],B=S.grid[b];if(a===b||!A||!B||A.tier!==B.tier)return false;
  B.tier++;B.pop=0;B.cd=Math.min(B.cd,0.3);S.grid[a]=null;S.merges++;
  if(B.tier>S.maxTier)S.maxTier=B.tier;if(B.tier>SV.bestTier){SV.bestTier=B.tier;markDirty()}
  const c=slotCenter(b);
  for(let i=0;i<14;i++){const an=Math.random()*6.28,sp=rand(60,170);addPart({type:'spark',x:c.x,y:c.y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-30,life:rand(.35,.7),t:0,col:i%2?tierLight(B.tier):'#fff',s:rand(2,4)})}
  addPart({type:'ring',x:c.x,y:c.y,life:.45,t:0,r:34,col:tierColor(B.tier)});
  addText(c.x,c.y-20,'L'+B.tier+'!',tierLight(B.tier),22,1.0);
  Snd.merge(B.tier);Hooks.merged(B.tier);
  if(S.tut===0&&S.level===1){S.tut=1;SV.tut=1;markDirty()}
  return true;
}
function moveOrSwap(a,b){const A=S.grid[a];if(!A||a===b)return;S.grid[a]=S.grid[b];S.grid[b]=A;Snd.drop()}
function selectGate(i){
  if(i<0||i>2)return;
  if(S.sel!==i){S.sel=i;Snd.gatePick();S.gates[i].flash=1;if(S.tut===1){S.tut=2;SV.tut=2;markDirty()}}
}
// --- effects ---
const MAXP=320;
function addPart(p){if(S.parts.length<MAXP)S.parts.push(p)}
function addText(x,y,text,col,size,life){if(S.texts.length<40)S.texts.push({x,y,text,col,size:size||16,life:life||.9,t:0})}
function fling(x,y,side,k){
  for(let i=0;i<k;i++){const an=-Math.PI/2+rand(-1.3,1.3),sp=rand(110,280);
    addPart({type:'sold',side,x:x+rand(-6,6),y:y+rand(-4,4),vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-60,rot:0,vr:rand(-12,12),life:rand(1.1,1.7),t:0})}
}
function poof(x,y,col,size,txt){addPart({type:'poof',x,y,life:.5,t:0,r:size||14,col:col||'#fff',txt})}
function confetti(n){
  const cols=['#ff4d4d','#ffd400','#3da5ff','#2ecc40','#ff4fa3','#b85cff','#ff9f1a','#fff'];
  for(let i=0;i<n;i++)Fx.add({x:rand(0,innerWidth),y:rand(-innerHeight*.3,-10),vx:rand(-60,60),vy:rand(80,260),rot:rand(0,6),vr:rand(-8,8),w:rand(6,11),h:rand(10,16),col:cols[i%cols.length],life:rand(2.4,4)});
}
// --- tick pieces ---
function stepSpawners(dt){
  for(let i=0;i<NSLOTS;i++){const sp=S.grid[i];if(!sp)continue;
    sp.age+=dt;if(sp.drop>0){sp.drop-=dt;continue}
    if(sp.pop<1)sp.pop=Math.min(1,sp.pop+dt*4);
    sp.kick=Math.max(0,sp.kick-dt*6);
    const rate=tierRate(sp.tier);sp.cd-=dt;
    if(sp.cd<=0){const k=Math.floor(-sp.cd*rate)+1;sp.cd+=k/rate;fireVolley(i,tierVolley(sp.tier)*k)}
  }
}
function fireVolley(i,v){
  const sp=S.grid[i];sp.kick=1;const c=slotCenter(i),gi=S.sel;
  if(S.packets.length<50){S.packets.push({x:c.x,y:c.y-12,sx:c.x,sy:c.y-12,tx:GATE_X[gi],ty:LAY.wallTop+WALL_H*0.5,t:0,dur:0.28+Math.random()*0.06,v,gi})}
  else arrive(v,gi);
  Snd.shoot();
}
function arrive(v,gi){
  const g=S.gates[gi];let out=gateApply(v,g);if(S.boost>0)out*=2;
  S.emit[gi].acc+=out;S.unitsMade+=out;g.flash=1;
  S.popT-=0;
  if(S.popT<=0&&S.texts.length<18){S.popT=0.11;
    const lab=g.op==='mul'?fmt(v)+'×'+fmt(gateEff(g))+'='+fmt(out):g.op==='add'?fmt(v)+'+'+fmt(gateEff(g))+'='+fmt(out):fmt(v)+'−'+fmt(gateEff(g))+'='+fmt(out);
    addText(GATE_X[gi]+rand(-26,26),LAY.wallTop-38,lab,g.op==='sub'?'#ff8a8a':'#fff27a',out>=1000?15:13,0.8);
    Snd.gate(g.op!=='sub',Math.log10(out+1)*2);
  }
}
function stepPackets(dt){
  const a=S.packets;let w=0;
  for(let i=0;i<a.length;i++){const p=a[i];p.t+=dt/p.dur;
    if(p.t>=1){arrive(p.v,S.sel===p.gi?p.gi:S.sel)}
    else{p.x=p.sx+(p.tx-p.sx)*p.t;p.y=p.sy+(p.ty-p.sy)*p.t;a[w++]=p}}
  a.length=w;
}
function stepEmit(dt){
  for(let i=0;i<3;i++){const e=S.emit[i];e.t+=dt;
    if(e.acc>0&&e.t>=0.2){spawnBlue(GATE_X[i]+rand(-14,14),LAY.wallTop-8,e.acc);e.acc=0;e.t=0}}
}
function spawnBlue(x,y,n){
  if(S.blues.length>=BLOB_CAP){let sm=0;for(let i=1;i<S.blues.length;i++)if(S.blues[i].n<S.blues[sm].n)sm=i;const b=S.blues[sm];b.n+=n;b.r=blobR(b.n);b.x=(b.x+x)/2;return b}
  const b=newBlob(x,y,n,0);S.blues.push(b);return b;
}
function spawnRed(x,y,n){
  if(S.reds.length>=BLOB_CAP){let sm=0;for(let i=1;i<S.reds.length;i++)if(S.reds[i].n<S.reds[sm].n)sm=i;const b=S.reds[sm];b.n+=n;b.r=blobR(b.n);return b}
  const b=newBlob(x,y,n,1);S.reds.push(b);return b;
}
function stepGates(dt){
  S.popT-=dt;
  for(let i=0;i<3;i++){const g=S.gates[i];g.flash=Math.max(0,g.flash-dt*4);g.flip=Math.max(0,g.flip-dt*3);g.t+=dt;
    if(g.t>=g.life&&i!==S.sel){const ng=newGate(rollGate(S.level,true,S.gates));S.gates[i]=ng;Snd.pop()}
    else if(g.t>=g.life&&i===S.sel){const ng=newGate(rollGate(S.level,false,S.gates));S.gates[i]=ng;Snd.pop()}}
}
function stepWaves(dt){
  const P=S.plan;
  while(S.nextWave<P.waves.length&&S.t>=P.waves[S.nextWave].t){
    const w=P.waves[S.nextWave++],nb=clamp(Math.round(Math.sqrt(w.strength)/2),3,26);
    for(let j=0;j<nb;j++)S.jobs.push({t:S.t+j*(2.6/nb),n:w.strength/nb*rand(.8,1.2),x:rand(24,336)});
    Hooks.wave(S.nextWave,P.K);
  }
  if(!S.bossSpawned&&S.nextWave>=P.waves.length){
    const clear=S.jobs.length===0&&S.reds.length===0;
    if(S.t>=P.bossT||(clear&&S.t>=P.waves[P.K-1].t+5)){spawnBoss()}
  }
  let w=0;for(let i=0;i<S.jobs.length;i++){const j=S.jobs[i];if(S.t>=j.t)spawnRed(j.x,-14,j.n);else S.jobs[w++]=j}S.jobs.length=w;
}
function spawnBoss(){
  const P=S.plan;S.bossSpawned=true;
  S.boss={x:180,y:-70,hp:P.bossHP,max:P.bossHP,r:42,kind:P.boss.kind,name:P.boss.name,swatCd:2,swing:0,hit:0,bonkT:1,dying:0,vy:0,rot:0};
  const nb=6;for(let j=0;j<nb;j++)S.jobs.push({t:S.t+1+j*.4,n:P.escort/nb,x:rand(40,320)});
  Snd.roar();S.shake=.5;addText(180,60,'BOSS!','#ff5a5a',34,1.6);Hooks.boss(P.boss.name);
}
function stepBattle(dt){
  const B=S.blues,R=S.reds,boss=S.boss&&S.boss.hp>0?S.boss:null,wt=LAY.wallTop,rate=S.plan.coinRate;
  // reds march down & bonk the wall
  let wallDmg=0;
  for(const r of R){
    const sp=S.plan.spd;r.ph+=dt*6;
    if(r.y<wt-8){r.y+=sp*dt;r.x+=Math.sin(S.anim*1.3+r.ph*.2)*6*dt;if(r.y>wt-8)r.y=wt-8}
    else wallDmg+=0.09*r.n*dt;
    r.x=clamp(r.x,10,350);if(r.hit>0)r.hit-=dt;
  }
  if(boss){
    boss.hit=Math.max(0,boss.hit-dt);boss.swing=Math.max(0,boss.swing-dt*2.2);
    const stopY=wt-boss.r*0.75;
    if(boss.y<stopY)boss.y+=Math.min(14,10+S.level*.4)*dt;
    else{boss.y=stopY;boss.bonkT-=dt;if(boss.bonkT<=0){boss.bonkT=1.6;boss.swing=1;S.wallHP-=S.wallMax*0.12;S.wallFlash=1;S.shake=.35;Snd.bonk();addText(boss.x,wt-30,'BONK!','#ffd0d0',26,.8)}}
    boss.swatCd-=dt;
    if(boss.swatCd<=0){let near=false;for(const b of B)if(Math.hypot(b.x-boss.x,b.y-boss.y)<boss.r+70){near=true;break}
      if(near){boss.swatCd=1.8;boss.swing=1;S.shake=.3;Snd.swat();addText(boss.x,boss.y+boss.r,'SWAT!','#ffe0a0',26,.8);
        for(const b of B){if(Math.hypot(b.x-boss.x,b.y-boss.y)<boss.r+85){const loss=Math.min(b.n,b.n*0.35+2);b.n-=loss;fling(b.x,b.y,0,Math.min(6,2+Math.log10(loss+1)|0));poof(b.x,b.y,'#fff',16)}}
      }else boss.swatCd=.2}
  }
  if(wallDmg>0){S.wallHP-=wallDmg;S.wallFlash=Math.max(S.wallFlash,.6);if(Math.random()<dt*3)Snd.wall()}
  // blues run toward nearest enemy
  const spd=95;
  for(const b of B){
    b.ph+=dt*9;if(b.hit>0)b.hit-=dt;
    let tx=null,ty=0,best=1e12;
    for(const r of R){const dx=r.x-b.x,dy=r.y-b.y,d=dx*dx+dy*dy;if(d<best){best=d;tx=r.x;ty=r.y}}
    if(boss){const dx=boss.x-b.x,dy=boss.y-b.y,d=dx*dx+dy*dy-boss.r*boss.r*2;if(d<best){best=d;tx=boss.x;ty=boss.y}}
    if(tx===null){tx=b.x+Math.sin(b.ph*.1)*20;ty=wt*0.5}
    const dx=tx-b.x,dy=ty-b.y,d=Math.hypot(dx,dy)||1;
    if(d>4){b.x+=dx/d*spd*dt;b.y+=dy/d*spd*dt}
    b.x=clamp(b.x,8,352);b.y=Math.min(b.y,wt-4);
  }
  // clashes: one-for-one attrition
  let fl=0;
  for(const b of B){
    if(b.n<=0)continue;
    for(const r of R){
      if(r.n<=0)continue;const dx=r.x-b.x,dy=r.y-b.y,rr=b.r+r.r;
      if(dx*dx+dy*dy<rr*rr){
        const m=Math.min(b.n,r.n),take=Math.min(m,Math.max(1.5,m*3*dt));
        b.n-=take;r.n-=take;S.kills+=take;earnCoins(take);b.hit=r.hit=.1;
        if(fl<10&&Math.random()<.5){fl++;const k=Math.min(3,1+(Math.log10(take+1)|0));fling((b.x+r.x)/2,(b.y+r.y)/2,Math.random()<.5?0:1,k);if(Math.random()<.35)poof((b.x+r.x)/2,(b.y+r.y)/2,'#fff',10)}
        Snd.clash();
        if(b.n<=0)break;
      }
    }
    if(b.n>0&&boss){
      const dx=boss.x-b.x,dy=boss.y-b.y,rr=b.r+boss.r;
      if(dx*dx+dy*dy<rr*rr){const take=Math.min(b.n,boss.hp,Math.max(2,b.n*3*dt));b.n-=take;boss.hp-=take;boss.hit=.12;S.kills+=take;earnCoins(take);Snd.clash();
        if(fl<10&&Math.random()<.4){fl++;fling(b.x,b.y,0,1)}}
    }
  }
  // remove dead; silly fling
  let w=0;for(let i=0;i<B.length;i++){const b=B[i];if(b.n>=0.5){b.r=blobR(b.n);B[w++]=b}else{fling(b.x,b.y,0,3);poof(b.x,b.y,'#9fd0ff',b.r+4,Math.random()<.2?'POOF!':null)}}B.length=w;
  w=0;for(let i=0;i<R.length;i++){const r=R[i];if(r.n>=0.5){r.r=blobR(r.n);R[w++]=r}else{fling(r.x,r.y,1,3);poof(r.x,r.y,'#ffb0b0',r.r+4,Math.random()<.2?'POOF!':null)}}R.length=w;
  // coalesce idle blues
  S.fxT+=dt;
  if(S.fxT>0.35){S.fxT=0;
    for(let i=0;i<B.length;i++){const a=B[i];if(a.n<=0)continue;for(let j=i+1;j<B.length;j++){const c=B[j];if(c.n<=0)continue;
      if(Math.abs(a.x-c.x)<7&&Math.abs(a.y-c.y)<7){const t=a.n+c.n;a.x=(a.x*a.n+c.x*c.n)/t;a.y=(a.y*a.n+c.y*c.n)/t;a.n=t;a.r=blobR(t);c.n=0}}}
    w=0;for(let i=0;i<B.length;i++)if(B[i].n>0)B[w++]=B[i];B.length=w;
  }
}
function stepStar(dt){
  if(!S.starReady&&S.tut>=2){S.starT-=dt;if(S.starT<=0){S.starReady=true;Hooks.starReady(true)}}
}
function checkEnd(){
  if(S.boss&&S.boss.hp<=0&&S.mode==='play')return winLevel();
  if(S.wallHP<=0&&S.mode==='play')return loseLevel();
}
function winLevel(){
  S.mode='won';S.endT=0;const b=S.boss;b.dying=1;b.vy=-60;
  for(const r of S.reds){fling(r.x,r.y,1,4);poof(r.x,r.y,'#ffb0b0',r.r+6)}S.reds=[];S.jobs=[];
  const bonus=coinPool(S.level)*0.25*(1+0.1*U('coin'));S.earned+=bonus;addCoins(Math.round(bonus));
  SV.wins++;SV.level=Math.max(SV.level,S.level+1);SV.maxLevel=Math.max(SV.maxLevel,S.level+1);S.tut=2;SV.tut=2;saveNow();
  confetti(160);Snd.win();Snd.roar();S.shake=.6;Hooks.starReady(false);
}
function loseLevel(){
  S.mode='lost';S.endT=0;S.wallHP=0;SV.losses++;saveNow();S.shake=.9;Snd.lose();Snd.bonk();
  for(let i=0;i<30;i++)addPart({type:'brick',x:rand(20,340),y:LAY.wallTop+rand(0,WALL_H),vx:rand(-120,120),vy:rand(-260,-80),rot:0,vr:rand(-9,9),life:1.8,t:0});
  for(const r of S.reds){fling(r.x,r.y,1,2)}
  Hooks.starReady(false);
}
function stepParts(dt){
  const a=S.parts;let w=0;
  for(let i=0;i<a.length;i++){const p=a[i];p.t+=dt;if(p.t>=p.life)continue;
    if(p.type==='sold'||p.type==='brick'){p.vy+=420*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt}
    else if(p.type==='spark'){p.vy+=200*dt;p.x+=p.vx*dt;p.y+=p.vy*dt}
    a[w++]=p}
  a.length=w;
  const T=S.texts;w=0;for(let i=0;i<T.length;i++){const t=T[i];t.t+=dt;t.y-=28*dt;if(t.t<t.life)T[w++]=t}T.length=w;
  S.wallFlash=Math.max(0,S.wallFlash-dt*2);S.shake=Math.max(0,S.shake-dt*1.4);
}
function update(dt){
  if(dt>0.1)dt=0.1;S.anim+=dt;
  if(S.mode==='play'){
    S.t+=dt;
    if(S.boost>0)S.boost=Math.max(0,S.boost-dt);
    stepSpawners(dt);stepGates(dt);stepWaves(dt);stepPackets(dt);stepEmit(dt);stepBattle(dt);stepStar(dt);
    S.dropT-=dt;
    if(S.dropT<=0){const e=emptySlots();if(e.length){placeSpawner(e[Math.floor(Math.random()*e.length)],dropTier(),true);Snd.pop();S.dropT=8/(1+0.1*U('speed'))}else S.dropT=1}
    checkEnd();
  }else if(S.mode==='won'||S.mode==='lost'){
    S.endT+=dt;
    const b=S.boss;if(b&&b.dying){b.y+=b.vy*dt;b.vy-=420*dt;b.rot+=dt*7;b.x+=60*dt}
    stepSpawners(dt*0);
    if(S.endT>1.5&&!S.endShown){S.endShown=true;S.mode==='won'?Hooks.showWin():Hooks.showLose()}
  }
  if(S.mode!=='title'||true){stepParts(dt)}
}
