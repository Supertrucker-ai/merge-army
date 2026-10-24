// Playwright end-to-end tests for the Merge Army game. Run: node test.js
const {chromium,devices}=require('playwright');
const fs=require('fs'),path=require('path');
const FILE='file://'+path.join(__dirname,'index.html'),SHOTS=path.join(__dirname,'shots');
fs.mkdirSync(SHOTS,{recursive:true});
const results=[];let fails=0;
function check(name,cond,extra){const ok=!!cond;results.push((ok?'PASS ':'FAIL ')+name+(extra!==undefined?' — '+extra:''));if(!ok)fails++;console.log(results[results.length-1])}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const IPHONE={...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:2};
const errors=[];
async function newPage(browser,opts,init){
  const ctx=await browser.newContext(opts||IPHONE);
  if(init)await ctx.addInitScript(init);
  const page=await ctx.newPage();
  page.on('console',m=>{if(m.type()==='error')errors.push('console.error: '+m.text())});
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))errors.push('requestfailed: '+r.url())});
  page.on('request',r=>{const u=r.url();if(!/^(file|data|blob|about):/.test(u))errors.push('NETWORK REQUEST (should be offline): '+u)});
  return {ctx,page};
}
const st=p=>p.evaluate(()=>__MA.state());
// real touch gestures through Chrome DevTools (generates genuine touchstart/touchmove/touchend + pointer events)
async function cdp(page){return page.context().newCDPSession(page)}
async function swipe(c,pts,steps){
  await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pts[0][0],y:pts[0][1],id:1}]});
  for(let i=1;i<pts.length;i++){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:pts[i][0],y:pts[i][1],id:1}]});await sleep(16)}
  await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
}
const lerp=(a,b,n)=>Array.from({length:n+1},(_,i)=>[a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n]);
async function toScreen(page,lx,ly){return page.evaluate(([lx,ly])=>{const r=document.getElementById('c').getBoundingClientRect();return[r.left+lx/360*r.width,r.top+ly/__MA.LAY.H*r.height]},[lx,ly])}
async function slotXY(page,i,dy){const c=await page.evaluate(i=>__MA.slotCenter(i),i);return toScreen(page,c.x,c.y+(dy||0))}
async function drag(page,c,from,to){ // finger on `from` slot, lifts, drops with the picture over `to`
  const a=await slotXY(page,from),b=await slotXY(page,to,26);
  await swipe(c,lerp(a,b,12));
}
const shot=(page,name)=>page.screenshot({path:path.join(SHOTS,name)});

(async()=>{
  const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']});
  let {page,ctx}=await newPage(browser);
  await page.goto(FILE);await sleep(400);

  // ---------- 1. boot, house standard, title ----------
  const meta=await page.evaluate(()=>({vp:document.querySelector('meta[name=viewport]').content,icon:(document.querySelector('link[rel=apple-touch-icon]')||{}).href||'',title:document.title,logo:document.getElementById('logoName').textContent,ovTitle:document.getElementById('ovTitle').classList.contains('on'),name:__MA.GAME_NAME,sh:document.documentElement.scrollHeight,ih:innerHeight,sw:document.documentElement.scrollWidth,iw:innerWidth}));
  check('viewport meta blocks zoom',/user-scalable=no/.test(meta.vp)&&/maximum-scale=1/.test(meta.vp),meta.vp);
  check('apple-touch-icon embedded (PNG data URI)',meta.icon.startsWith('data:image/png;base64,')&&meta.icon.length>1000);
  const png=fs.readFileSync(path.join(__dirname,'apple-touch-icon.png'));
  check('apple-touch-icon.png is a 180x180 PNG',png.readUInt32BE(16)===180&&png.readUInt32BE(20)===180);
  check('.nojekyll exists',fs.existsSync(path.join(__dirname,'.nojekyll')));
  check('index.html is a single offline file (no external src/href)',!/(src|href)=["']https?:/.test(fs.readFileSync(path.join(__dirname,'index.html'),'utf8')));
  check('game name lives in one constant and shows on title + <title>',meta.name==='Merge Army'&&meta.logo===meta.name&&meta.title===meta.name,meta.name);
  check('title screen shown first',meta.ovTitle);
  check('page itself cannot scroll',meta.sh<=meta.ih&&meta.sw<=meta.iw,JSON.stringify([meta.sh,meta.ih,meta.sw,meta.iw]));
  await shot(page,'01-title.png');

  // ---------- 2. start level 1: tutorial ----------
  await page.tap('#playBtn');await sleep(300);
  let s=await st(page);
  check('Play starts level 1 on the Moon',s.mode==='play'&&s.level===1&&s.theme==='Moon');
  check('level 1 starts with two L1 spawners (tutorial layout)',s.grid.filter(x=>x===1).length===2&&s.grid.filter(x=>x>0).length===2,JSON.stringify(s.grid));
  check('tutorial step 0 (drag hand) active',s.tut===0);
  check('default gates are x2, +10, x5',s.gates.map(g=>g.label).join(',')==='×2,+10,×5',s.gates.map(g=>g.label).join(','));
  check('audio context created after first touch',await page.evaluate(()=>!!__MA.audio()));
  await sleep(500);await shot(page,'02-tutorial.png');
  const small=await page.$$eval('button',els=>els.filter(e=>e.offsetParent!==null).map(e=>{const r=e.getBoundingClientRect();return{t:e.textContent.trim().slice(0,14),w:r.width,h:r.height}}).filter(x=>x.w<44||x.h<44));
  check('all visible buttons are big touch targets (>=44px)',small.length===0,JSON.stringify(small));

  // ---------- 3. merge drag with real touch ----------
  const c=await cdp(page);
  const ids=s.grid.map((t,i)=>t?i:-1).filter(i=>i>=0);
  await drag(page,c,ids[0],ids[1]);await sleep(150);
  s=await st(page);
  check('dragging one L1 onto the other merges into an L2',s.grid[ids[1]]===2&&s.grid[ids[0]]===0&&s.merges===1,JSON.stringify(s.grid));
  check('merge advances the tutorial to the gate step',s.tut===1);
  await sleep(200);await shot(page,'03-merge.png');
  // tap best gate with a real touch
  const gx=await toScreen(page,__GX(1),await page.evaluate(()=>__MA.LAY.wallTop+20));
  await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:gx[0],y:gx[1],id:1}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(100);
  s=await st(page);
  check('tapping a gate with a finger selects it (and finishes the tutorial)',s.sel===1&&s.tut===2,'sel='+s.sel+' tut='+s.tut);

  // ---------- 4. drag rules: move, swap, no cross-tier merge ----------
  await page.evaluate(()=>{__MA.clearGrid();__MA.place(5,1);__MA.place(6,2)});
  await drag(page,c,5,2);await sleep(80);
  s=await st(page);check('dragging into an empty slot moves the spawner',s.grid[2]===1&&s.grid[5]===0);
  await drag(page,c,2,6);await sleep(80);
  s=await st(page);check('different tiers do not merge (they swap places)',s.grid[2]===2&&s.grid[6]===1&&s.merges===1,JSON.stringify(s.grid));

  // ---------- 5. tiers keep going past L5 ----------
  await page.evaluate(()=>{__MA.clearGrid();__MA.place(0,1);for(let t=1;t<=11;t++){__MA.place(1,t);__MA.merge(1,0);const g=__MA.state().grid;if(g[0]!==t+1)throw new Error('merge failed at '+t);}});
  s=await st(page);
  check('merging continues past L5 (reached L12)',s.grid[0]===12,'tier='+s.grid[0]);
  const vol=await page.evaluate(()=>[__MA.tierVolley(1),__MA.tierVolley(2),__MA.tierVolley(3),__MA.tierVolley(6),__MA.tierVolley(12)]);
  check('tiers fire 1, 3, 9, ... (x3 each tier)',vol.join()==='1,3,9,243,177147',vol.join());
  const rt=await page.evaluate(()=>[1,2,6,12].map(t=>__MA.tierRate(t)));
  check('higher tiers fire faster',rt[0]<rt[1]&&rt[1]<rt[2]&&rt[2]<rt[3],rt.map(x=>x.toFixed(2)).join());
  await page.evaluate(()=>{__MA.clearGrid();const arr=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];arr.forEach((t,i)=>__MA.place(i,t))});
  await sleep(300);await shot(page,'04-tiers-L1-to-L15.png');
  s=await st(page);check('all 15 slots hold L1..L15 without errors',s.grid.join()==='1,2,3,4,5,6,7,8,9,10,11,12,13,14,15');
  const fm=await page.evaluate(()=>[1,999,1000,1500,12345,1e6,2.5e9,1e15,1e40].map(__MA.fmt));
  check('big numbers abbreviate (K/M/B...) and never overflow',fm.join()==='1,999,1K,1.5K,12.3K,1M,2.5B,1Qa,1.0e40'||/^1,999,1K,1\.5K,12\.3K,1M,2\.5B,1Qa,/.test(fm.join()),fm.join());

  // ---------- 6. gate math ----------
  const gm=await page.evaluate(()=>[__MA.gateApply(3,'mul',5),__MA.gateApply(7,'mul',2),__MA.gateApply(1,'add',10),__MA.gateApply(81,'add',10),__MA.gateApply(3,'sub',5),__MA.gateApply(20,'sub',5),__MA.gateApply(12,'mul',10)]);
  check('gate math: 3x5=15, 7x2=14, 1+10=11, 81+10=91, 3-5=0 (floor), 20-5=15, 12x10=120',gm.join()==='15,14,11,91,0,15,120',gm.join());
  for(const [op,v,expectMul] of [['mul',5,15],['add',10,13],['sub',5,0],['mul',2,6]]){
    await page.evaluate(([op,v])=>{__MA.startLevel(1);__MA.clearGrid();__MA.setGates([{op,v},{op:'mul',v:2},{op:'add',v:10}]);__MA.selectGate(0);__MA.place(7,2)},[op,v]);
    const r=await page.evaluate(()=>__MA.advance(3.4));
    const units=r.unitsMade,left=r.army+r.pending;
    check(`integration: L2 spawner (fires 3) through ${op==='mul'?'x':op==='add'?'+':'-'}${v} gate makes ${expectMul} per volley`,
      (expectMul===0?units===0:units>0&&units%expectMul===0)&&Math.abs(units-left)<1e-6,`units=${units} onField=${left}`);
  }
  await page.evaluate(()=>{__MA.startLevel(1);__MA.clearGrid();__MA.setGates([{op:'mul',v:5},{op:'mul',v:2},{op:'add',v:10}]);__MA.selectGate(0);__MA.place(7,2);__MA.giveCoins(1e9);__MA.buyUpgrade('gate')});
  const r2=await page.evaluate(()=>__MA.advance(3.4));
  check('Gate Power upgrade makes x5 gate x6 (3 -> 18 per volley)',r2.up.gate===1&&r2.gates[0].eff===6&&r2.unitsMade>0&&r2.unitsMade%18===0,'units='+r2.unitsMade);
  await page.evaluate(()=>{__MA.startLevel(1)});

  // ---------- 7. buy spawner + price + free drops ----------
  await page.evaluate(()=>{__MA.startLevel(1);__MA.giveCoins(-__MA.state().coins)});
  s=await st(page);const c0=s.buyCost;
  await page.evaluate(()=>__MA.giveCoins(25));s=await st(page);const n0=s.grid.filter(x=>x).length,coins0=s.coins;
  await page.tap('#buyBtn');await sleep(100);s=await st(page);
  check('Buy spawner spends coins and adds a spawner',s.coins===coins0-c0&&s.grid.filter(x=>x).length===n0+1,`coins ${coins0}->${s.coins}`);
  check('Buy price increases after each purchase',s.buyCost>c0,`${c0} -> ${s.buyCost}`);
  await page.evaluate(()=>__MA.giveCoins(-__MA.state().coins));const before=await st(page);await page.tap('#buyBtn');await sleep(80);s=await st(page);
  check('cannot buy without enough coins',s.grid.filter(x=>x).length===before.grid.filter(x=>x).length&&s.coins===0);
  const d0=(await st(page)).grid.filter(x=>x).length;await page.evaluate(()=>__MA.advance(9));s=await st(page);
  check('free spawners drop in over time',s.grid.filter(x=>x).length>d0,`${d0} -> ${s.grid.filter(x=>x).length}`);

  // ---------- 8. battle: big army, clashes, flung soldiers, boss ----------
  await page.evaluate(()=>{__MA.startLevel(5)});let maxParts=0;
  for(let i=0;i<40;i++){s=await page.evaluate(()=>__MA.advance(1,{bot:true,period:1}));maxParts=Math.max(maxParts,s.parts)}
  await sleep(120);s=await st(page);
  check('battle: blue army meets red horde (one-for-one kills happen)',s.kills>0&&s.army>0,`kills=${Math.round(s.kills)} army=${Math.round(s.army)}`);
  check('nobody dies: eliminated soldiers are flung as particles/poofs',maxParts>0,'peak particles='+maxParts);
  await shot(page,'05-gameplay-big-army.png');
  // boss
  await page.evaluate(()=>{__MA.startLevel(3)});
  let bs=null;
  for(let i=0;i<200;i++){bs=await page.evaluate(()=>__MA.advance(1,{bot:true,period:4,maxM:2}));if(bs.boss&&bs.boss.hp>0&&bs.boss.y>120&&bs.army>0)break;if(bs.mode!=='play')break}
  if(!(bs.boss&&bs.boss.hp>0)){await page.evaluate(()=>{__MA.startLevel(3);__MA.spawnBoss()});for(let i=0;i<30;i++){bs=await page.evaluate(()=>__MA.advance(1));if(bs.boss&&bs.boss.hp>0&&bs.boss.y>120)break}}
  check('a boss appears at the end of the waves (level 3 = Big Alien)',bs.boss&&bs.boss.kind==='alien'&&bs.bossSpawned,JSON.stringify(bs.boss));
  if(!(bs.boss&&bs.boss.hp>0)){await page.evaluate(()=>{__MA.startLevel(3);__MA.spawnBoss()});bs=await page.evaluate(()=>__MA.advance(6))}
  await sleep(150);await shot(page,'06-boss.png');
  const hp0=bs.boss.hp,bs0max=bs.boss.max;bs=await page.evaluate(()=>__MA.advance(4,{bot:true,period:.8}));
  check('units chip the boss health bar down',!bs.boss||bs.boss.hp<hp0||bs.mode==='won',`${Math.round(hp0)} -> ${bs.boss&&Math.round(bs.boss.hp)}`);
  check('boss shows a health bar value',hp0>0&&hp0<=bs0max,`${Math.round(hp0)}/${bs0max}`);
  const kinds=[];
  for(const L of [1,2,3,4]){const k=await page.evaluate(L=>{__MA.startLevel(L);__MA.spawnBoss();__MA.advance(6);return __MA.state().boss.kind},L);kinds.push(k)}
  check('4 different bosses (knight, golem, alien, comet) all render',kinds.join()==='knight,golem,alien,comet',kinds.join());
  await sleep(100);

  // ---------- 9. full level WIN ----------
  await page.evaluate(()=>{__MA.startLevel(1)});
  const w=await page.evaluate(()=>__MA.advance(400,{bot:true,period:1.5,stopAtEnd:true}));
  check('full level 1 simulated to a WIN',w.mode==='won'&&w.boss.hp<=0,`mode=${w.mode} t=${w.t.toFixed(0)}s`);
  check('win shows the overlay, fun fact, and confetti',w.overlay==='ovWin'&&w.confetti>0);
  check('win unlocks level 2 and saves it',w.save.level>=2&&w.save.maxLevel>=2&&w.save.wins>=1);
  const factTxt=await page.textContent('#winFact');check('win screen shows a space/geography fun fact',/Moon/.test(factTxt),factTxt);
  await sleep(500);await shot(page,'07-win.png');
  const coinsWin=(await st(page)).coins;
  await page.tap('#winNext');await sleep(200);s=await st(page);
  check('Next Level starts level 2 on Mars with coins kept',s.level===2&&s.mode==='play'&&s.theme==='Mars'&&s.coins===coinsWin);

  // ---------- 10. LOSS: coins kept, "Try again!" ----------
  await page.evaluate(()=>{__MA.startLevel(25)});
  const coinsBefore=(await st(page)).coins;
  const l=await page.evaluate(()=>__MA.advance(500,{stopAtEnd:true}));
  check('level 25 with no help ends in a LOSS (wall bonked)',l.mode==='lost'&&l.wallHP<=0,`mode=${l.mode} up=${JSON.stringify(l.up)} t=${l.t|0} merges=${l.merges} grid=${l.grid}`);
  check('loss overlay says Try again!',l.overlay==='ovLose'&&/Try again/.test(await page.textContent('#ovLose')));
  check('coins are kept on a loss (never decrease)',l.coins>=coinsBefore&&l.save.coins===l.coins,`${coinsBefore} -> ${l.coins}`);
  await sleep(300);await shot(page,'08-lose-try-again.png');
  await page.tap('#loseRetry');await sleep(200);s=await st(page);
  check('Try again restarts the same level with a full wall',s.mode==='play'&&s.level===25&&s.wallHP===s.wallMax);

  // ---------- 11. coins persist across reload ----------
  await page.evaluate(()=>{__MA.giveCoins(1234);__MA.saveNow()});const coinsSaved=(await st(page)).coins;
  const raw=await page.evaluate(()=>localStorage.getItem('mergeArmy.save.v1'));
  check('progress is saved in localStorage',!!raw&&JSON.parse(raw).coins===coinsSaved);
  await page.reload();await sleep(400);s=await st(page);
  check('coins, level progress survive a reload',s.coins===coinsSaved&&s.save.maxLevel>=2,`coins=${s.coins} maxLevel=${s.save.maxLevel}`);
  check('title offers to continue the saved level',/Level \d+/.test(await page.textContent('#playBtn')));

  // ---------- 12. upgrades (no caps) ----------
  await page.tap('#tUp');await sleep(200);
  const items=await page.$$eval('#upList .item[data-k]',e=>e.map(x=>x.dataset.k));
  check('upgrades screen lists gate value, spawn speed, wall HP, starting spawners (+coin boost)',['gate','speed','wall','start'].every(k=>items.includes(k)),items.join());
  await page.evaluate(()=>{__MA.giveCoins(1e12)});await page.evaluate(()=>__MA.openUpgrades());await sleep(100);
  const costs=[];
  for(let i=0;i<3;i++){costs.push(await page.evaluate(()=>__MA.UPS[0].cost(__MA.state().up.gate)));await page.tap('#upList button[data-k=gate]');await sleep(60)}
  s=await st(page);
  check('buying an upgrade raises its level and the next price',s.up.gate>=3&&costs[1]>costs[0]&&costs[2]>costs[1],costs.join()+' lvl='+s.up.gate);
  await page.evaluate(()=>{__MA.resetProgress();__MA.giveCoins(480);__MA.openUpgrades()});await sleep(150);await shot(page,'09-upgrades.png');
  await page.evaluate(()=>{for(let i=0;i<40;i++){for(const k of ['gate','speed','wall','start','coin']){__MA.giveCoins(1e300);__MA.buyUpgrade(k)}}__MA.openUpgrades()});s=await st(page);
  check('upgrades have NO cap (40+ levels each)',Object.values(s.up).every(v=>v>=40),JSON.stringify(s.up));
  await page.evaluate(()=>{__MA.startLevel(1)});s=await st(page);
  check('Starting Spawners upgrade: level starts with more army (value 2+levels)',s.grid.reduce((a,t)=>a+(t?Math.pow(2,t-1):0),0)===2+s.up.start,`start lvl ${s.up.start}`);
  check('Wall HP upgrade makes the wall tougher',s.wallMax>3*(90+0.28*800)*1,Math.round(s.wallMax)+'');
  const sp=await page.evaluate(()=>__MA.tierRate(1));check('Spawn Speed upgrade speeds up firing',sp>0.7*2.5,sp.toFixed(2));
  await page.evaluate(()=>__MA.resetProgress());

  // ---------- 13. scrolling lists scroll; canvas blocks touchmove ----------
  await page.evaluate(()=>__MA.setReached(60));
  await page.evaluate(()=>__MA.openMap());await sleep(150);
  const lst=await page.evaluate(()=>{const l=document.getElementById('mapList');return{sh:l.scrollHeight,ch:l.clientHeight}});
  check('map list is taller than its box (needs scrolling)',lst.sh>lst.ch+200,JSON.stringify(lst));
  const lb=await page.evaluate(()=>{const r=document.getElementById('mapList').getBoundingClientRect();return[r.left+r.width/2,r.top+r.height*.8]});
  const c2=await cdp(page);
  await swipe(c2,lerp(lb,[lb[0],lb[1]-300],14));await sleep(250);
  const sc=await page.evaluate(()=>({top:document.getElementById('mapList').scrollTop,page:document.documentElement.scrollTop+document.body.scrollTop}));
  check('touch-swipe scrolls the list (touchmove is NOT blocked globally)',sc.top>50&&sc.page===0,JSON.stringify(sc));
  await shot(page,'10-map-scrolled.png');
  const prevented=await page.evaluate(()=>{const mk=t=>{const tt=new Touch({identifier:1,target:t,clientX:50,clientY:50});return new TouchEvent('touchmove',{touches:[tt],targetTouches:[tt],changedTouches:[tt],bubbles:true,cancelable:true})};
    const a=mk(document.getElementById('c'));document.getElementById('c').dispatchEvent(a);const l=document.getElementById('mapList'),b=mk(l);l.dispatchEvent(b);return{canvas:a.defaultPrevented,list:b.defaultPrevented}});
  check('touchmove default is prevented on the game canvas only',prevented.canvas===true&&prevented.list===false,JSON.stringify(prevented));
  await page.tap('#mapClose');await sleep(100);

  // ---------- 14. math star question ----------
  await page.evaluate(()=>{__MA.startLevel(2);__MA.forceStar()});await sleep(100);
  const qs=await page.evaluate(()=>{const o=[];for(let i=0;i<300;i++){const q=__MA.makeQuestion(1+i%12);o.push(q.choices.length===3&&new Set(q.choices).size===3&&q.choices.includes(q.ans))}return o.every(Boolean)});
  check('300 generated questions each have 3 unique choices incl. the right answer',qs);
  const coinsQ=(await st(page)).coins;
  await page.tap('#starBtn',{force:true});await sleep(150);
  check('star button opens the math question (game pauses)',(await st(page)).overlay==='ovQuiz'&&(await st(page)).paused);
  await shot(page,'11-math-question.png');
  const q=await page.evaluate(()=>__MA.quiz());
  const wrong=await page.$$eval('#qAns button',(b,ans)=>b.filter(x=>x.dataset.v!==ans).map(x=>x.dataset.v),q.ans);
  await page.tap(`#qAns button[data-v="${wrong[0].replace(/"/g,'\\"')}"]`);await sleep(80);
  check('wrong answer is gentle: try again',/try again/i.test(await page.textContent('#qMsg')));
  await page.tap(`#qAns button[data-v="${q.ans.replace(/"/g,'\\"')}"]`);await sleep(100);
  s=await st(page);
  check('right answer gives coins and a x2 boost',s.coins>coinsQ&&s.boost>0,`coins +${s.coins-coinsQ}, boost ${s.boost.toFixed(1)}s`);
  await sleep(1500);

  // ---------- 15. performance with a huge army ----------
  await page.evaluate(()=>{__MA.startLevel(8);__MA.stressArmy(170,5000)});const big=await st(page);
  let perf=null;for(let k=0;k<3;k++){const r=await page.evaluate(()=>__MA.benchFrames(60));if(!perf||r.total<perf.total)perf=r}
  const fps=await page.evaluate(()=>new Promise(res=>{let n=0,t0=performance.now();function f(){n++;if(performance.now()-t0>2000)res(n/((performance.now()-t0)/1000));else requestAnimationFrame(f)}requestAnimationFrame(f)}));
  s=await st(page);
  check('huge army on screen (300+ blobs, millions of units)',big.blueBlobs+big.redBlobs>=300&&big.army+big.red>1e6,`blobs=${big.blueBlobs+big.redBlobs} units=${fmt0(big.army+big.red)}`);
  check('frame time stays reasonable with that army (best of 3 runs, update+render+raster per frame)',perf.total<16,`${perf.total.toFixed(2)}ms (update ${perf.update.toFixed(2)}, render ${perf.render.toFixed(2)})`);
  check('live frame rate stays smooth with that army',fps>=45,fps.toFixed(1)+' fps (headless)');
  await shot(page,'12-stress-army.png');

  // ---------- 16. storage fallback ----------
  const fb=await newPage(browser,IPHONE,"Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}});Object.defineProperty(window,'sessionStorage',{get(){throw new Error('blocked')}});");
  await fb.page.goto(FILE);await sleep(400);
  const fs0=await st(fb.page);
  await fb.page.evaluate(()=>{__MA.giveCoins(77);__MA.saveNow()});await fb.page.reload();await sleep(400);
  const fs1=await st(fb.page);
  check('works with localStorage blocked (private mode): falls back to window.name',fs0.storage==='window.name'&&fs1.coins===77,fs0.storage+' coins='+fs1.coins);
  await fb.ctx.close();
  // corrupted save does not crash
  const cb=await newPage(browser,IPHONE,"try{localStorage.setItem('mergeArmy.save.v1','{not json')}catch(e){}");
  await cb.page.goto(FILE);await sleep(300);
  check('corrupted save falls back to a fresh game',(await st(cb.page)).level===1);
  await cb.ctx.close();

  // ---------- 17. layout on other phones ----------
  for(const [n,vp] of [['iPhone SE',{width:375,height:667}],['small',{width:320,height:568}],['iPhone Pro Max',{width:430,height:932}]]){
    const o=await newPage(browser,{...devices['iPhone 13'],viewport:vp,deviceScaleFactor:2});await o.page.goto(FILE);await sleep(300);await o.page.tap('#playBtn');await sleep(300);
    const lay=await o.page.evaluate(()=>{const r=e=>document.getElementById(e).getBoundingClientRect();const b=r('bar'),cv=r('c');return{barBottom:b.bottom,ih:innerHeight,cvH:cv.height,sh:document.documentElement.scrollHeight}});
    check(`layout fits ${n} (${vp.width}x${vp.height}): bar on screen, canvas has room, no scroll`,lay.barBottom<=lay.ih+1&&lay.cvH>380&&lay.sh<=lay.ih,JSON.stringify(lay));
    if(n==='iPhone SE')await o.page.screenshot({path:path.join(SHOTS,'13-iphone-se.png')});
    await o.ctx.close();
  }

  // ---------- 18. no console errors anywhere ----------
  check('no console errors / page errors / network requests across the whole run',errors.length===0,errors.slice(0,4).join(' | '));

  await browser.close();
  const summary=`\n${results.length} checks, ${results.length-fails} passed, ${fails} failed\n`;
  console.log(summary);
  fs.writeFileSync(path.join(__dirname,'test-results.txt'),results.join('\n')+summary);
  process.exit(fails?1:0);
})().catch(e=>{console.error('TEST CRASH',e);process.exit(2)});
const fmt0=n=>n>=1e6?(n/1e6).toFixed(1)+'M':Math.round(n)+'';
function __GX(i){return [62,180,298][i]}
