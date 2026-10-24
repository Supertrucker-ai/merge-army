// ===== INPUT (pointer events on the canvas only; page scroll is blocked ONLY here) =====
function toLogical(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*LW,y:(e.clientY-r.top)/r.height*LAY.H}}
function slotAt(x,y,maxD){let best=-1,bd=maxD*maxD;for(let i=0;i<NSLOTS;i++){const c=slotCenter(i),d=(c.x-x)*(c.x-x)+(c.y-y)*(c.y-y);if(d<bd){bd=d;best=i}}return best}
function dropTarget(x,y,from){
  // the spawner is drawn 26px above the finger: accept the slot under the picture OR under the finger (prefer a same-tier match)
  const c=[slotAt(x,y-26,38),slotAt(x,y,34)].filter(i=>i>=0&&i!==from);
  const A=from!=null&&S.grid[from];
  if(A)for(const i of c)if(S.grid[i]&&S.grid[i].tier===A.tier)return i;
  return c.length?c[0]:-1;
}
let activePtr=null;
cv.addEventListener('pointerdown',e=>{
  Snd.unlock();if(S.mode!=='play'||paused||activePtr!==null)return;
  const p=toLogical(e),wt=LAY.wallTop;
  if(p.y>wt-18&&p.y<wt+WALL_H+10){let bi=0,bd=1e9;for(let i=0;i<3;i++){const d=Math.abs(p.x-GATE_X[i]);if(d<bd){bd=d;bi=i}}selectGate(bi);return}
  const i=slotAt(p.x,p.y,34);
  if(i>=0&&S.grid[i]&&S.grid[i].drop<=0){activePtr=e.pointerId;try{cv.setPointerCapture(e.pointerId)}catch(_){}
    S.drag={from:i,x:p.x,y:p.y,over:-1};Snd.pick();e.preventDefault()}
});
cv.addEventListener('pointermove',e=>{
  if(activePtr!==e.pointerId||!S.drag)return;const p=toLogical(e);S.drag.x=p.x;S.drag.y=p.y;S.drag.over=dropTarget(p.x,p.y,S.drag.from);
});
function endDrag(e,cancel){
  if(activePtr!==e.pointerId)return;activePtr=null;const d=S.drag;S.drag=null;if(!d||cancel)return;
  const t=dropTarget(d.x,d.y,d.from);if(t<0||t===d.from)return;
  const A=S.grid[d.from],B=S.grid[t];if(!A)return;
  if(!B){S.grid[t]=A;S.grid[d.from]=null;Snd.drop()}
  else if(B.tier===A.tier&&B.drop<=0)doMerge(d.from,t);
  else if(B.drop<=0)moveOrSwap(d.from,t);
}
cv.addEventListener('pointerup',e=>endDrag(e,false));
cv.addEventListener('pointercancel',e=>endDrag(e,true));
cv.addEventListener('lostpointercapture',e=>{if(activePtr===e.pointerId)endDrag(e,true)});
// block scrolling/zoom gestures on the game canvas only (never globally: lists in overlays must scroll)
cv.addEventListener('touchmove',e=>{e.preventDefault()},{passive:false});
cv.addEventListener('touchstart',e=>{e.preventDefault()},{passive:false});
cv.addEventListener('contextmenu',e=>e.preventDefault());
['gesturestart','gesturechange','gestureend'].forEach(g=>document.addEventListener(g,e=>e.preventDefault()));
['touchend','click','pointerup','keydown'].forEach(ev=>document.addEventListener(ev,()=>Snd.unlock(),{passive:true}));
