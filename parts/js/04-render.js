// ===== RENDERING =====
const cv=document.getElementById('c'),ctx=cv.getContext('2d',{alpha:false});
const fxc=document.getElementById('fx'),fxx=fxc.getContext('2d');
let SC=1,bgCache=null,bgKey='';
function resize(){
  const st=document.getElementById('stage'),w=st.clientWidth||360,h=st.clientHeight||600;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
  SC=cv.width/LW;relayout(h*LW/w);bgKey='';
  fxc.width=Math.round(innerWidth*dpr);fxc.height=Math.round(innerHeight*dpr);
  document.documentElement.style.setProperty('--toastB',(h-LAY.sandTop*w/LW+8)+'px');
}
// --- confetti on its own overlay canvas ---
const Fx=(function(){
  const a=[];
  return{add(p){if(a.length<260)a.push(p)},
   step(dt){let w=0;for(const p of a){p.life-=dt;p.vy+=40*dt;p.x+=p.vx*dt+Math.sin(p.life*5+p.rot)*20*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;if(p.life>0&&p.y<innerHeight+30)a[w++]=p}a.length=w},
   draw(){const k=fxc.width/innerWidth;fxx.setTransform(1,0,0,1,0,0);fxx.clearRect(0,0,fxc.width,fxc.height);if(!a.length)return;fxx.setTransform(k,0,0,k,0,0);
     for(const p of a){fxx.save();fxx.translate(p.x,p.y);fxx.rotate(p.rot);fxx.scale(1,Math.cos(p.rot*2));fxx.fillStyle=p.col;fxx.fillRect(-p.w/2,-p.h/2,p.w,p.h);fxx.restore()}},
   clear(){a.length=0},count(){return a.length}};
})();
// --- helpers ---
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function txt(c,s,x,y,size,fill,stroke,align){c.font='900 '+size+'px ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold",system-ui,sans-serif';c.textAlign=align||'center';c.textBaseline='middle';
  if(stroke){c.lineWidth=Math.max(2,size*.22);c.strokeStyle=stroke;c.lineJoin='round';c.strokeText(s,x,y)}c.fillStyle=fill;c.fillText(s,x,y)}
function rng(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
// --- background (cached) ---
function buildBG(){
  const W=LW,H=LAY.H,c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;const g=c.getContext('2d');g.setTransform(SC,0,0,SC,0,0);
  const T=S.theme,wt=LAY.wallTop,R=rng(S.level*977+7);
  let gr=g.createLinearGradient(0,0,0,wt);gr.addColorStop(0,T.sky[0]);gr.addColorStop(1,T.sky[1]);g.fillStyle=gr;g.fillRect(0,0,W,wt+4);
  const space=!['pyramids','fuji','eiffel','jungle','uluru','ice'].includes(T.deco);
  if(space){for(let i=0;i<70;i++){g.globalAlpha=.3+R()*.7;g.fillStyle='#fff';const s=R()*1.6+.4;g.fillRect(R()*W,R()*wt,s,s)}g.globalAlpha=1}
  // deco
  const D=T.deco;
  if(D==='earth'){g.fillStyle='#2f7bff';g.beginPath();g.arc(300,70,38,0,7);g.fill();g.fillStyle='#38c060';g.beginPath();g.arc(290,60,12,0,7);g.arc(312,84,9,0,7);g.arc(318,56,7,0,7);g.fill();g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.ellipse(296,78,16,4,.3,0,7);g.fill()}
  if(D==='planet'){const px=R()>.5?60:300,py=80,pr=44;g.fillStyle=T.pc;g.beginPath();g.arc(px,py,pr,0,7);g.fill();
    if(T.stripes){g.fillStyle='rgba(120,60,20,.28)';for(let k=-2;k<=2;k++){g.fillRect(px-pr+4,py+k*13-3,pr*2-8,6)}g.save();g.beginPath();g.arc(px,py,pr,0,7);g.clip();g.fillStyle='rgba(220,90,60,.55)';g.beginPath();g.ellipse(px+12,py+12,12,7,0,0,7);g.fill();g.restore()}
    g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.arc(px+14,py+8,pr-2,-.6,2.2);g.arc(px,py,pr,2.2,-.6,true);g.fill();
    if(T.ring){g.strokeStyle='rgba(255,240,200,.85)';g.lineWidth=5;g.beginPath();g.ellipse(px,py,pr*1.6,pr*.35,T.tilt?1.2:-.35,0,7);g.stroke()}}
  if(D==='belt'){for(let i=0;i<22;i++){const x=R()*W,y=R()*wt*.8,r=3+R()*9;g.fillStyle='#7a6a82';g.beginPath();g.ellipse(x,y,r,r*.75,R()*3,0,7);g.fill();g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.arc(x+r*.2,y,r*.3,0,7);g.fill()}}
  if(D==='pyramids'){g.fillStyle='#f3c15c';for(const[x,s]of[[70,70],[170,95],[270,55]]){g.beginPath();g.moveTo(x-s,wt);g.lineTo(x,wt-s*.9);g.lineTo(x+s,wt);g.fill();g.fillStyle='rgba(150,90,10,.28)';g.beginPath();g.moveTo(x,wt-s*.9);g.lineTo(x+s,wt);g.lineTo(x,wt);g.fill();g.fillStyle='#f3c15c'}g.fillStyle='#fff3b0';g.beginPath();g.arc(310,50,22,0,7);g.fill()}
  if(D==='fuji'){g.fillStyle='#6b7fb8';g.beginPath();g.moveTo(40,wt);g.lineTo(180,wt-120);g.lineTo(320,wt);g.fill();g.fillStyle='#fff';g.beginPath();g.moveTo(138,wt-85);g.lineTo(180,wt-120);g.lineTo(222,wt-85);g.lineTo(200,wt-92);g.lineTo(182,wt-80);g.lineTo(162,wt-92);g.fill();g.fillStyle='#ff6f91';g.beginPath();g.arc(60,50,24,0,7);g.fill()}
  if(D==='eiffel'){g.strokeStyle='#7a5a3a';g.lineWidth=5;g.beginPath();g.moveTo(130,wt);g.lineTo(180,wt-130);g.lineTo(230,wt);g.moveTo(150,wt-55);g.lineTo(210,wt-55);g.moveTo(166,wt-95);g.lineTo(194,wt-95);g.stroke();g.lineWidth=3;g.beginPath();g.moveTo(180,wt-130);g.lineTo(180,wt-150);g.stroke();g.fillStyle='#fff';for(const[x,y,r]of[[60,50,18],[90,60,14],[290,40,20],[320,55,14]]){g.globalAlpha=.8;g.beginPath();g.arc(x,y,r,0,7);g.fill()}g.globalAlpha=1}
  if(D==='jungle'){for(let i=0;i<9;i++){const x=20+i*40+R()*10,h=50+R()*50;g.fillStyle='#6b4a2a';g.fillRect(x-3,wt-h,6,h);g.fillStyle=i%2?'#1f8a3a':'#2fb04a';g.beginPath();g.arc(x,wt-h,22+R()*8,0,7);g.fill()}g.fillStyle='#ffe45c';g.beginPath();g.arc(320,40,20,0,7);g.fill()}
  if(D==='uluru'){g.fillStyle='#c4502a';g.beginPath();g.moveTo(60,wt);g.quadraticCurveTo(70,wt-70,130,wt-72);g.lineTo(250,wt-70);g.quadraticCurveTo(300,wt-60,310,wt);g.fill();g.fillStyle='rgba(0,0,0,.16)';g.beginPath();g.moveTo(190,wt-72);g.lineTo(250,wt-70);g.quadraticCurveTo(300,wt-60,310,wt);g.lineTo(220,wt);g.fill();g.fillStyle='#fff3b0';g.beginPath();g.arc(50,45,24,0,7);g.fill()}
  if(D==='ice'){g.fillStyle='#bfe6ff';for(const[x,s]of[[60,70],[160,100],[270,80]]){g.beginPath();g.moveTo(x-s*.7,wt);g.lineTo(x-s*.1,wt-s);g.lineTo(x+s*.2,wt-s*.6);g.lineTo(x+s*.6,wt-s*.9);g.lineTo(x+s*.9,wt);g.fill()}g.fillStyle='rgba(255,255,255,.9)';for(let i=0;i<30;i++){g.fillRect(R()*W,R()*wt,2,2)}}
  // ground
  gr=g.createLinearGradient(0,wt*.62,0,wt+4);gr.addColorStop(0,T.gr[0]);gr.addColorStop(1,T.gr[1]);
  g.fillStyle=gr;g.beginPath();g.moveTo(0,wt*.66);for(let x=0;x<=W;x+=30)g.lineTo(x,wt*.66+Math.sin(x*.03+S.level)*6);g.lineTo(W,wt+4);g.lineTo(0,wt+4);g.fill();
  // lane + craters
  g.fillStyle=T.lane;g.beginPath();g.moveTo(40,wt);g.lineTo(100,wt*.4);g.lineTo(260,wt*.4);g.lineTo(320,wt);g.fill();
  g.globalAlpha=.16;g.fillStyle='#000';for(let i=0;i<9;i++){const x=R()*W,y=wt*.7+R()*wt*.25;g.beginPath();g.ellipse(x,y,6+R()*10,3+R()*4,0,0,7);g.fill()}g.globalAlpha=1;
  // sand zone
  const st=LAY.sandTop;gr=g.createLinearGradient(0,st,0,LAY.H);gr.addColorStop(0,'#f2d58c');gr.addColorStop(1,'#d9b068');g.fillStyle=gr;g.fillRect(0,st,W,LAY.H-st);
  g.fillStyle='rgba(150,100,30,.18)';for(let i=0;i<60;i++){g.fillRect(R()*W,st+R()*(LAY.H-st),2,2)}
  for(let i=0;i<NSLOTS;i++){const r=slotRect(i);rr(g,r.x,r.y,r.w,r.h,12);g.fillStyle='rgba(120,75,20,.22)';g.fill();g.lineWidth=2;g.strokeStyle='rgba(120,75,20,.35)';g.stroke()}
  // wall base
  g.fillStyle='#7d8296';g.fillRect(0,wt,W,WALL_H);g.fillStyle='#9ca1b8';g.fillRect(0,wt,W,8);
  g.strokeStyle='rgba(40,45,70,.45)';g.lineWidth=1.5;for(let r=0;r<4;r++){const y=wt+r*10;g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();for(let x=(r%2)*15;x<W;x+=30){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+10);g.stroke()}}
  g.fillStyle='rgba(0,0,0,.22)';g.fillRect(0,wt+WALL_H-6,W,6);
  return c;
}
// --- soldiers (stick figures, batched) ---
const SOLD_OFF=[];(function(){for(let i=0;i<14;i++){const a=i*2.39996,r=Math.sqrt((i+.5)/14);SOLD_OFF.push([Math.cos(a)*r,Math.sin(a)*r*.8])}})();
function soldPath(c,x,y,sc,phase,dir){
  const s=sc,sw=Math.sin(phase)*2*s;
  c.moveTo(x,y-3*s);c.lineTo(x,y+2*s);                       // body
  c.moveTo(x-3*s,y-1*s+sw*.3);c.lineTo(x+3*s,y-1*s-sw*.3);   // arms
  c.moveTo(x,y+2*s);c.lineTo(x-2*s+sw,y+6*s);                 // legs
  c.moveTo(x,y+2*s);c.lineTo(x+2*s-sw,y+6*s);
  c.moveTo(x+3*s,y-1*s);c.lineTo(x+3.5*s,y-8*s*dir);          // sword/spear
}
function headPath(c,x,y,s){c.moveTo(x+2.4*s,y-5.4*s);c.arc(x,y-5.4*s,2.4*s,0,6.3)}
let _sheet=[null,null],_sheetSC=0;
function soldSheet(side){
  if(_sheetSC!==SC){_sheet=[null,null];_sheetSC=SC}
  if(_sheet[side])return _sheet[side];
  const w=Math.ceil(10*SC),h=Math.ceil(20*SC),cvs=document.createElement('canvas');cvs.width=w*6;cvs.height=h;const c=cvs.getContext('2d');
  const col=side?'#e6262b':'#2f7bff',lt=side?'#ff8a8a':'#a9d1ff';
  for(let f=0;f<6;f++){
    c.setTransform(w/10,0,0,h/20,f*w,0);c.translate(5,10);c.lineCap='round';c.strokeStyle=col;c.fillStyle=col;c.lineWidth=1.7;
    c.beginPath();soldPath(c,0,0,.95,f*1.0472,side?-1:1);c.stroke();
    c.beginPath();headPath(c,0,0,.95);c.fill();
    c.fillStyle=lt;c.beginPath();c.arc(-.7,-6,1,0,6.3);c.fill();
  }
  return _sheet[side]={cv:cvs,w:w,h:h};
}
function drawBlobs(list,side,budget){
  if(!list.length)return;const col=side?'#e6262b':'#2f7bff',lt=side?'#ff8a8a':'#a9d1ff';
  const per=Math.max(1,Math.min(14,Math.floor(budget/list.length)));
  const sc=0.95,t=S.anim;
  ctx.lineCap='butt';
  // shadows
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();
  for(const b of list){ctx.moveTo(b.x+b.r,b.y+4);ctx.ellipse(b.x,b.y+4+b.r*.2,b.r,b.r*.55,0,0,6.3)}ctx.fill();
  // bodies: pre-rendered stick-soldier sprites (6 walk frames per side) = very cheap drawImage calls
  const sh=soldSheet(side),sw=sh.w,shh=sh.h;
  for(const b of list){const c=Math.min(per,soldCount(b.n)),rad=b.r*.8,jit=b.hit>0;
    for(let i=0;i<c;i++){const o=SOLD_OFF[i];let f=Math.floor(((b.ph+i)%6.2832+6.2832)%6.2832/1.0472)%6;
      ctx.drawImage(sh.cv,f*sw,0,sw,shh,b.x+o[0]*rad-5,b.y+o[1]*rad+(jit?Math.sin(t*40+i):0)-10,10,20)}}
  // number labels for biggest blobs
  let shown=0;const thr=side?8:8;
  const sorted=list.length>14?list.slice().sort((a,b)=>b.n-a.n):list;
  for(const b of sorted){if(shown>=14)break;if(b.n<thr)continue;shown++;
    txt(ctx,fmt(b.n),b.x,b.y-b.r-5,b.n>=1000?13:12,'#fff',side?'#7a0a10':'#08306b')}
}
// --- spawner art ---
function drawSpawner(c,tier,cx,cy,size,kick,t,glowOn){
  const s=size/54,col=tierColor(tier),dk=tierDark(tier),lt=tierLight(tier),kind=(tier-1)%8;
  c.save();c.translate(cx,cy);c.scale(s*(1+kick*.1),s*(1-kick*.08));
  if(tier>=3||glowOn){const a=.18+.1*Math.sin(t*3+tier);c.fillStyle=lt;c.globalAlpha=a*(glowOn?2:1);c.beginPath();c.arc(0,0,27+Math.min(tier,12),0,6.3);c.fill();c.globalAlpha=1}
  c.lineWidth=2.5;c.strokeStyle=dk;c.lineJoin='round';
  if(kind===0){ // cannon
    c.fillStyle='#333a55';c.beginPath();c.arc(-13,14,7,0,6.3);c.arc(13,14,7,0,6.3);c.fill();
    c.fillStyle=col;rr(c,-7,-24-kick*3,14,34,6);c.fill();c.stroke();c.fillStyle=lt;c.fillRect(-4,-20,3,24);
    c.fillStyle=col;c.beginPath();c.arc(0,8,16,0,6.3);c.fill();c.stroke();c.fillStyle='#fff';c.globalAlpha=.4;c.beginPath();c.arc(-5,3,5,0,6.3);c.fill();c.globalAlpha=1;
  }else if(kind===1){ // tent
    c.fillStyle=col;c.beginPath();c.moveTo(0,-24);c.lineTo(-24,16);c.lineTo(24,16);c.closePath();c.fill();c.stroke();
    c.fillStyle=lt;c.beginPath();c.moveTo(0,-24);c.lineTo(-9,16);c.lineTo(9,16);c.closePath();c.globalAlpha=.55;c.fill();c.globalAlpha=1;
    c.fillStyle='#2a1a3a';c.beginPath();c.moveTo(0,-2);c.lineTo(-8,16);c.lineTo(8,16);c.closePath();c.fill();
    c.strokeStyle=dk;c.beginPath();c.moveTo(0,-24);c.lineTo(0,-31);c.stroke();c.fillStyle='#ff4d4d';c.beginPath();c.moveTo(0,-31);c.lineTo(11,-28);c.lineTo(0,-25);c.fill();
  }else if(kind===2){ // glowing barracks
    c.fillStyle=col;rr(c,-22,-8,44,26,5);c.fill();c.stroke();c.fillStyle=dk;c.beginPath();c.moveTo(-26,-6);c.lineTo(0,-26);c.lineTo(26,-6);c.closePath();c.fill();c.stroke();
    c.fillStyle='#ffe98a';c.fillRect(-16,-2,9,9);c.fillRect(7,-2,9,9);c.fillStyle='#4a2a10';rr(c,-5,4,10,14,3);c.fill();
    c.fillStyle='#fff';c.globalAlpha=.35+.25*Math.sin(t*5);c.beginPath();c.arc(0,-8,12,0,6.3);c.fill();c.globalAlpha=1;
  }else if(kind===3){ // castle
    c.fillStyle=col;c.fillRect(-20,-6,40,24);c.strokeRect(-20,-6,40,24);
    for(let i=-1;i<=1;i++){c.fillRect(i*14-5,-14,10,10);c.strokeRect(i*14-5,-14,10,10)}
    c.fillStyle=lt;c.fillRect(-20,-6,40,5);c.fillStyle='#2a1a3a';c.beginPath();c.moveTo(-6,18);c.lineTo(-6,6);c.arc(0,6,6,Math.PI,0);c.lineTo(6,18);c.fill();
    c.strokeStyle=dk;c.beginPath();c.moveTo(0,-14);c.lineTo(0,-26);c.stroke();c.fillStyle='#ffd400';c.beginPath();c.moveTo(0,-26);c.lineTo(10,-23);c.lineTo(0,-20);c.fill();
  }else if(kind===4){ // rocket
    c.fillStyle='#ff8a2a';c.beginPath();c.moveTo(-6,18);c.lineTo(0,18+8+Math.sin(t*20)*3);c.lineTo(6,18);c.fill();
    c.fillStyle=dk;c.beginPath();c.moveTo(-8,6);c.lineTo(-20,20);c.lineTo(-8,16);c.fill();c.beginPath();c.moveTo(8,6);c.lineTo(20,20);c.lineTo(8,16);c.fill();
    c.fillStyle=col;c.beginPath();c.moveTo(0,-28);c.quadraticCurveTo(14,-8,9,18);c.lineTo(-9,18);c.quadraticCurveTo(-14,-8,0,-28);c.fill();c.stroke();
    c.fillStyle='#bfe6ff';c.beginPath();c.arc(0,-5,5.5,0,6.3);c.fill();c.stroke();
  }else if(kind===5){ // ufo
    c.fillStyle=lt;c.beginPath();c.arc(0,-3,13,Math.PI,0);c.fill();c.stroke();
    c.fillStyle=col;c.beginPath();c.ellipse(0,5,26,10,0,0,6.3);c.fill();c.stroke();
    for(let i=-2;i<=2;i++){c.fillStyle=(Math.floor(t*4)+i)%2?'#ffe45c':'#fff';c.beginPath();c.arc(i*9,6+Math.abs(i)*-.8,2.4,0,6.3);c.fill()}
    c.fillStyle='rgba(255,255,160,.35)';c.beginPath();c.moveTo(-8,14);c.lineTo(8,14);c.lineTo(14,24);c.lineTo(-14,24);c.fill();
  }else if(kind===6){ // space station
    c.fillStyle=col;c.beginPath();c.arc(0,0,14,0,6.3);c.fill();c.stroke();c.fillStyle=lt;c.globalAlpha=.5;c.beginPath();c.arc(-4,-4,6,0,6.3);c.fill();c.globalAlpha=1;
    c.strokeStyle=lt;c.lineWidth=4;c.beginPath();c.ellipse(0,0,26,8,-.35+Math.sin(t)*.05,0,6.3);c.stroke();
    c.fillStyle=dk;c.fillRect(-3,-26,6,12);c.fillStyle='#ffe45c';c.beginPath();c.arc(0,-28,4,0,6.3);c.fill();
  }else{ // crystal
    c.fillStyle=col;c.beginPath();c.moveTo(0,-28);c.lineTo(16,-6);c.lineTo(10,18);c.lineTo(-10,18);c.lineTo(-16,-6);c.closePath();c.fill();c.stroke();
    c.fillStyle=lt;c.globalAlpha=.6;c.beginPath();c.moveTo(0,-28);c.lineTo(-16,-6);c.lineTo(-4,-4);c.closePath();c.fill();c.beginPath();c.moveTo(-4,-4);c.lineTo(0,18);c.lineTo(-10,18);c.lineTo(-16,-6);c.fill();c.globalAlpha=1;
    c.fillStyle='#fff';c.globalAlpha=.7;c.fillRect(6+Math.sin(t*3)*2,-12,3,3);c.globalAlpha=1;
  }
  // extra stars for tiers beyond 8
  const extra=Math.floor((tier-1)/8);
  for(let i=0;i<Math.min(extra,5);i++){c.fillStyle='#ffe45c';c.strokeStyle='#8a5a00';c.lineWidth=1;c.beginPath();c.arc(-18+i*9,-24,3.4,0,6.3);c.fill();c.stroke()}
  c.restore();
}
function drawSlotLabels(c,tier,cx,cy,size){
  const s=size/54;
  c.save();c.translate(cx,cy);c.scale(s,s);
  rr(c,-17,16,34,13,6);c.fillStyle='rgba(20,20,60,.85)';c.fill();txt(c,'L'+tier,0,23,12,'#fff');
  const v=fmt(tierVolley(tier));rr(c,10,-27,19,14,6);c.fillStyle=tierColor(tier);c.fill();c.lineWidth=1.5;c.strokeStyle='#fff';c.stroke();
  txt(c,v,19.5,-20,v.length>2?8:10,'#fff','rgba(0,0,0,.6)');
  c.restore();
}
// --- bosses ---
function drawBoss(b,t){
  const r=b.r;
  ctx.save();ctx.translate(b.x,b.y);
  if(b.dying){ctx.rotate(b.rot)}
  const sw=b.swing,bob=Math.sin(t*3)*2,hitF=b.hit>0;
  ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle='#3a0a14';
  if(!b.dying){ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(0,r*.95,r*.9,r*.25,0,0,6.3);ctx.fill()}
  const body=hitF?'#fff':null;
  const arm=(sx)=>{ // swat arm
    const ang=sx*(.5+Math.sin(sw*3.14)*1.2*(1));ctx.save();ctx.translate(sx*r*.85,-r*.1);ctx.rotate(ang*.4*sx*-1+ (sw>0?-sw*1.0*sx:0)); ctx.restore()};
  if(b.kind==='knight'){
    ctx.fillStyle='#b8b8c8';rr(ctx,-r*.7,-r*.2+bob,r*1.4,r*1.1,12);ctx.fill();ctx.stroke();
    ctx.fillStyle=body||'#d92b34';rr(ctx,-r*.62,-r*.1+bob,r*1.24,r*.95,10);ctx.fill();ctx.stroke();
    ctx.fillStyle='#ffd400';ctx.fillRect(-r*.5,r*.35+bob,r,r*.12);
    ctx.fillStyle=body||'#c4c8d8';ctx.beginPath();ctx.arc(0,-r*.55+bob,r*.5,0,6.3);ctx.fill();ctx.stroke();
    ctx.fillStyle='#222';ctx.fillRect(-r*.4,-r*.6+bob,r*.8,r*.14);ctx.fillStyle='#ff3030';ctx.fillRect(-r*.28,-r*.58+bob,r*.14,r*.1);ctx.fillRect(r*.14,-r*.58+bob,r*.14,r*.1);
    ctx.fillStyle='#e8212c';ctx.beginPath();ctx.moveTo(0,-r*1.05+bob);ctx.quadraticCurveTo(r*.5,-r*1.4+bob,r*.45,-r*.85+bob);ctx.lineTo(0,-r*.95+bob);ctx.fill();ctx.stroke();
    // sword arm swings
    ctx.save();ctx.translate(r*.8,0+bob);ctx.rotate(-.5+sw*1.6);ctx.fillStyle='#e8eaf4';ctx.fillRect(-4,-r*1.1,8,r*1.1);ctx.strokeRect(-4,-r*1.1,8,r*1.1);ctx.fillStyle='#8a5a2a';ctx.fillRect(-10,-2,20,6);ctx.fillStyle='#c4c8d8';ctx.beginPath();ctx.arc(0,6,9,0,6.3);ctx.fill();ctx.stroke();ctx.restore();
    ctx.fillStyle='#b01e28';ctx.beginPath();ctx.moveTo(-r*.95,-r*.15+bob);ctx.lineTo(-r*.5,-r*.15+bob);ctx.lineTo(-r*.5,r*.65+bob);ctx.lineTo(-r*.72,r*.8+bob);ctx.lineTo(-r*.95,r*.65+bob);ctx.closePath();ctx.fill();ctx.stroke();
  }else if(b.kind==='golem'){
    ctx.fillStyle=body||'#7a5a4a';ctx.beginPath();ctx.moveTo(-r*.8,r*.8);ctx.lineTo(-r*.95,-r*.1+bob);ctx.lineTo(-r*.5,-r*.8+bob);ctx.lineTo(r*.4,-r*.9+bob);ctx.lineTo(r*.95,-r*.2+bob);ctx.lineTo(r*.75,r*.8);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=body||'#9a7a66';ctx.beginPath();ctx.arc(-r*.4,-r*.3+bob,r*.3,0,6.3);ctx.arc(r*.35,r*.15+bob,r*.25,0,6.3);ctx.fill();
    ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.arc(r*.4,-r*.5+bob,r*.12,0,6.3);ctx.arc(-r*.3,r*.4,r*.14,0,6.3);ctx.fill();
    ctx.strokeStyle='#ff7a1a';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-r*.1,-r*.9+bob);ctx.lineTo(-r*.2,-r*.5+bob);ctx.lineTo(r*.05,-r*.3+bob);ctx.stroke();ctx.strokeStyle='#3a0a14';
    ctx.fillStyle='#ffdd44';ctx.beginPath();ctx.ellipse(-r*.25,-r*.35+bob,r*.14,r*.1,0,0,6.3);ctx.ellipse(r*.2,-r*.35+bob,r*.14,r*.1,0,0,6.3);ctx.fill();ctx.fillStyle='#d11';ctx.beginPath();ctx.arc(-r*.25,-r*.35+bob,r*.05,0,6.3);ctx.arc(r*.2,-r*.35+bob,r*.05,0,6.3);ctx.fill();
    ctx.fillStyle='#2a1a1a';ctx.beginPath();ctx.moveTo(-r*.3,-r*.05+bob);ctx.lineTo(r*.3,-r*.05+bob);ctx.lineTo(r*.2,r*.12+bob);ctx.lineTo(-r*.2,r*.12+bob);ctx.fill();
    ctx.fillStyle=body||'#8a6a58';ctx.save();ctx.translate(r*1.0,r*.1+bob);ctx.rotate(-sw*1.2);ctx.beginPath();ctx.arc(0,0,r*.38,0,6.3);ctx.fill();ctx.stroke();ctx.restore();
    ctx.save();ctx.translate(-r*1.0,r*.1+bob);ctx.rotate(sw*1.2);ctx.beginPath();ctx.arc(0,0,r*.38,0,6.3);ctx.fill();ctx.stroke();ctx.restore();
  }else if(b.kind==='alien'){
    ctx.fillStyle=body||'#d83a7a';ctx.beginPath();ctx.ellipse(0,r*.6,r*.5,r*.45,0,0,6.3);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(0,-r*.15+bob,r*.85,r*.8,0,0,6.3);ctx.fill();ctx.stroke();
    ctx.fillStyle='#1a0a2a';ctx.beginPath();ctx.ellipse(-r*.35,-r*.2+bob,r*.24,r*.36,.5,0,6.3);ctx.ellipse(r*.35,-r*.2+bob,r*.24,r*.36,-.5,0,6.3);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-r*.3,-r*.3+bob,r*.07,0,6.3);ctx.arc(r*.4,-r*.3+bob,r*.07,0,6.3);ctx.fill();
    ctx.strokeStyle='#3a0a14';ctx.beginPath();ctx.moveTo(-r*.22,r*.3+bob);ctx.quadraticCurveTo(0,r*.5+bob,r*.22,r*.3+bob);ctx.stroke();
    ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-r*.4,-r*.85+bob);ctx.lineTo(-r*.6,-r*1.3+bob);ctx.moveTo(r*.4,-r*.85+bob);ctx.lineTo(r*.6,-r*1.3+bob);ctx.stroke();
    ctx.fillStyle='#ffe45c';ctx.beginPath();ctx.arc(-r*.6,-r*1.3+bob,r*.12,0,6.3);ctx.arc(r*.6,-r*1.3+bob,r*.12,0,6.3);ctx.fill();ctx.stroke();
    ctx.fillStyle=body||'#d83a7a';for(const sx of[-1,1]){ctx.save();ctx.translate(sx*r*.7,r*.5+bob);ctx.rotate(sx*(.3-sw*1.4));rr(ctx,-r*.12,-r*.1,r*.24,r*.7,r*.1);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(0,r*.65,r*.2,0,6.3);ctx.fill();ctx.stroke();ctx.restore()}
  }else{ // comet monster
    ctx.fillStyle='#ff8a2a';ctx.beginPath();ctx.moveTo(-r*.5,-r*.4);ctx.quadraticCurveTo(0,-r*2.2+Math.sin(t*8)*6,r*.5,-r*.4);ctx.fill();
    ctx.fillStyle='#ffd24a';ctx.beginPath();ctx.moveTo(-r*.3,-r*.4);ctx.quadraticCurveTo(0,-r*1.6,r*.3,-r*.4);ctx.fill();
    ctx.fillStyle=body||'#b3162a';ctx.beginPath();ctx.arc(0,bob,r*.95,0,6.3);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-r*.7,-r*.45+bob);ctx.lineTo(-r*.9,-r*.95+bob);ctx.lineTo(-r*.35,-r*.7+bob);ctx.moveTo(r*.7,-r*.45+bob);ctx.lineTo(r*.9,-r*.95+bob);ctx.lineTo(r*.35,-r*.7+bob);ctx.fill();ctx.stroke();
    ctx.fillStyle='#ffee66';ctx.beginPath();ctx.ellipse(-r*.35,-r*.1+bob,r*.2,r*.25,0,0,6.3);ctx.ellipse(r*.35,-r*.1+bob,r*.2,r*.25,0,0,6.3);ctx.fill();ctx.stroke();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(-r*.32,-r*.05+bob,r*.09,0,6.3);ctx.arc(r*.38,-r*.05+bob,r*.09,0,6.3);ctx.fill();
    ctx.fillStyle='#2a0a14';ctx.beginPath();ctx.ellipse(0,r*.38+bob,r*.5,r*.28,0,0,6.3);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*r*.18-4,r*.2+bob);ctx.lineTo(i*r*.18,r*.36+bob);ctx.lineTo(i*r*.18+4,r*.2+bob);ctx.fill()}
    ctx.fillStyle=body||'#b3162a';for(const sx of[-1,1]){ctx.save();ctx.translate(sx*r*.95,r*.2+bob);ctx.rotate(sx*(-sw*1.3));ctx.beginPath();ctx.arc(0,0,r*.34,0,6.3);ctx.fill();ctx.stroke();ctx.restore()}
  }
  ctx.restore();
}
// --- gates & wall ---
function drawGates(){
  const wt=LAY.wallTop,t=S.anim;
  for(let i=0;i<3;i++){
    const g=S.gates[i],x=GATE_X[i]-GATE_W/2,y=wt-8,w=GATE_W,h=WALL_H+8,sel=i===S.sel,bad=g.op==='sub';
    const flipS=g.flip>0?Math.abs(Math.cos(g.flip*3.14)):1;
    ctx.save();ctx.translate(GATE_X[i],y+h/2);ctx.scale(flipS||.05,1);ctx.translate(-GATE_X[i],-(y+h/2));
    if(sel){ctx.fillStyle='rgba(255,230,80,'+(.28+.15*Math.sin(t*5))+')';rr(ctx,x-7,y-7,w+14,h+14,18);ctx.fill()}
    const c1=bad?'#b3283a':g.op==='mul'?(sel?'#ffd400':'#d9a800'):(sel?'#35d07a':'#1f9a58'),c2=bad?'#7a1626':g.op==='mul'?(sel?'#ff9d00':'#9a6a00'):(sel?'#14a35a':'#0f6a3a');
    const gr=ctx.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,c1);gr.addColorStop(1,c2);
    ctx.globalAlpha=sel?1:.88;rr(ctx,x,y,w,h,14);ctx.fillStyle=gr;ctx.fill();ctx.lineWidth=sel?4:3;ctx.strokeStyle=sel?'#fff':'rgba(40,30,10,.7)';ctx.stroke();ctx.globalAlpha=1;
    if(g.flash>0){ctx.fillStyle='rgba(255,255,255,'+g.flash*.6+')';rr(ctx,x,y,w,h,14);ctx.fill()}
    const lab=gateLabel(g);txt(ctx,lab,GATE_X[i],y+h/2+1,lab.length>4?26:32,bad?'#fff':'#fff',bad?'#4a0a14':(g.op==='mul'?'#8a4a00':'#05502a'));
    // timer pip
    const life=1-g.t/g.life;ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x+10,y+h-5,w-20,3);ctx.fillStyle=life<.25?'#ff6a6a':'#fff';ctx.fillRect(x+10,y+h-5,(w-20)*life,3);
    ctx.restore();
    if(bad&&!sel){txt(ctx,'😬',GATE_X[i]+w/2-10,y-4,16,'#fff')}
  }
}
function drawWallHP(){
  const wt=LAY.wallTop,p=clamp(S.wallHP/S.wallMax,0,1),y=wt-26,w=200,x=(LW-w)/2;
  rr(ctx,x,y,w,12,6);ctx.fillStyle='rgba(0,0,0,.55)';ctx.fill();
  if(p>0){rr(ctx,x+1.5,y+1.5,(w-3)*p,9,4.5);ctx.fillStyle=p>.5?'#46e06a':p>.25?'#ffc233':'#ff4d4d';ctx.fill()}
  txt(ctx,'🧱 WALL',x-27,y+6,10,'#fff','rgba(0,0,0,.7)');
}
function cracks(){
  const p=1-clamp(S.wallHP/S.wallMax,0,1),wt=LAY.wallTop;if(p<.2)return;
  ctx.strokeStyle='rgba(20,20,40,.7)';ctx.lineWidth=2;ctx.beginPath();const n=Math.floor(p*8);const R=rng(5);
  for(let i=0;i<n;i++){let x=R()*LW,y=wt+2;ctx.moveTo(x,y);for(let k=0;k<3;k++){x+=R()*14-7;y+=9;ctx.lineTo(x,y)}}ctx.stroke();
}
// --- main draw ---
function render(){
  if(bgKey!==S.level+'|'+cv.width+'|'+cv.height){bgCache=buildBG();bgKey=S.level+'|'+cv.width+'|'+cv.height}
  const t=S.anim;
  ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(bgCache,0,0);
  ctx.setTransform(SC,0,0,SC,0,0);
  if(S.shake>0){ctx.translate(rand(-1,1)*S.shake*7,rand(-1,1)*S.shake*7)}
  const wt=LAY.wallTop;
  // wall pieces + cracks + gates
  cracks();
  if(S.wallFlash>0){ctx.fillStyle='rgba(255,60,60,'+S.wallFlash*.4+')';ctx.fillRect(0,wt,LW,WALL_H)}
  if(S.mode!=='lost')drawGates();
  // armies
  const budget=700;
  drawBlobs(S.reds,1,budget);
  if(S.boss)drawBoss(S.boss,t);
  drawBlobs(S.blues,0,budget);
  // packets
  if(S.packets.length){ctx.fillStyle='#bfe0ff';ctx.beginPath();for(const p of S.packets){ctx.moveTo(p.x+3.5,p.y);ctx.arc(p.x,p.y,3.5,0,6.3)}ctx.fill();
    ctx.fillStyle='#2f7bff';ctx.beginPath();for(const p of S.packets){ctx.moveTo(p.x+2,p.y+4);ctx.arc(p.x,p.y+4,2,0,6.3);ctx.moveTo(p.x+1.4,p.y+8);ctx.arc(p.x,p.y+8,1.4,0,6.3)}ctx.fill();
    let n=0;for(const p of S.packets){if(n++>10)break;if(p.v>1)txt(ctx,fmt(p.v),p.x+9,p.y-3,10,'#fff','#08306b')}}
  drawParts();
  // spawners
  for(let i=0;i<NSLOTS;i++){const sp=S.grid[i];if(!sp||(S.drag&&S.drag.from===i))continue;const c=slotCenter(i);
    let cy=c.y,sz=SLOT*0.92,off=0;
    if(sp.drop>0){const k=sp.drop/0.35;off=-k*k*90;sz*=1}
    const pop=sp.pop<1?1+Math.sin(sp.pop*3.14)*.25:1;
    const hl=S.drag&&S.grid[S.drag.from]&&S.grid[S.drag.from].tier===sp.tier&&S.drag.over===i;
    if(S.drag&&S.grid[S.drag.from]&&S.grid[S.drag.from].tier===sp.tier){rr(ctx,slotRect(i).x-2,slotRect(i).y-2,SLOT+4,SLOT+4,14);ctx.strokeStyle='rgba(255,255,255,'+(.6+.4*Math.sin(t*10))+')';ctx.lineWidth=3;ctx.stroke()}
    drawSpawner(ctx,sp.tier,c.x,cy+off-2,sz*pop,sp.kick,t,hl);
    if(sp.drop<=0){drawSlotLabels(ctx,sp.tier,c.x,cy-2,sz);
      const rate=tierRate(sp.tier),f=clamp(1-sp.cd*rate,0,1);const r=slotRect(i);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(r.x+8,r.y+r.h-4,r.w-16,3);ctx.fillStyle=tierLight(sp.tier);ctx.fillRect(r.x+8,r.y+r.h-4,(r.w-16)*f,3)}
  }
  if(S.drag){const sp=S.grid[S.drag.from];if(sp){drawSpawner(ctx,sp.tier,S.drag.x,S.drag.y-26,SLOT*1.25,0,t,true);drawSlotLabels(ctx,sp.tier,S.drag.x,S.drag.y-26,SLOT*1.25)}}
  // floating texts
  for(const f of S.texts){const a=clamp(1-f.t/f.life,0,1);ctx.globalAlpha=Math.min(1,a*2);txt(ctx,f.text,f.x,f.y,f.size,f.col,'rgba(0,0,0,.65)');ctx.globalAlpha=1}
  drawWallHP();
  drawHUDCanvas();
  drawTutorial();
  ctx.setTransform(1,0,0,1,0,0);
}
function drawParts(){
  const P=S.parts;if(!P.length)return;
  ctx.lineCap='butt';
  // flung soldiers (rotated sticks) batched by side
  for(const side of[0,1]){
    ctx.strokeStyle=ctx.fillStyle=side?'#e6262b':'#2f7bff';ctx.lineWidth=2;ctx.beginPath();let any=false;
    let nS=0;for(const p of P){if(p.type!=='sold'||p.side!==side)continue;if(++nS>90)break;any=true;const c=Math.cos(p.rot),s=Math.sin(p.rot);const pt=(x,y)=>[p.x+x*c-y*s,p.y+x*s+y*c];
      let a=pt(0,-3),b=pt(0,3);ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);a=pt(-3.5,-1);b=pt(3.5,-1);ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);a=pt(0,3);b=pt(-3,8);ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);b=pt(3,8);ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);
      a=pt(0,-6);ctx.moveTo(a[0]+2.6,a[1]);ctx.arc(a[0],a[1],2.6,0,6.3)}
    if(any){ctx.stroke();ctx.fill()}
  }
  for(const p of P){
    const k=p.t/p.life;
    if(p.type==='poof'){ctx.globalAlpha=1-k;ctx.fillStyle=p.col;const r=p.r*(.5+k);ctx.beginPath();for(let i=0;i<6;i++){const a=i*1.047;ctx.moveTo(p.x+Math.cos(a)*r*.7+r*.45,p.y+Math.sin(a)*r*.7);ctx.arc(p.x+Math.cos(a)*r*.7,p.y+Math.sin(a)*r*.7,r*.45,0,6.3)}ctx.fill();ctx.globalAlpha=1;
      if(p.txt)txt(ctx,p.txt,p.x,p.y-r-4-k*10,13,'#fff','#d02030')}
    else if(p.type==='spark'){ctx.globalAlpha=1-k;ctx.fillStyle=p.col;ctx.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s);ctx.globalAlpha=1}
    else if(p.type==='ring'){ctx.globalAlpha=1-k;ctx.strokeStyle=p.col;ctx.lineWidth=4*(1-k)+1;ctx.beginPath();ctx.arc(p.x,p.y,p.r*k+6,0,6.3);ctx.stroke();ctx.globalAlpha=1}
    else if(p.type==='brick'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=1-k*k;ctx.fillStyle='#8a8fa6';ctx.fillRect(-7,-4,14,8);ctx.strokeStyle='#3a3f58';ctx.lineWidth=1.5;ctx.strokeRect(-7,-4,14,8);ctx.restore();ctx.globalAlpha=1}
  }
}
function drawHUDCanvas(){
  // wave progress + horde count (top of battlefield)
  const P=S.plan;if(!P||S.mode==='title')return;
  const w=170,x=8,y=7;
  rr(ctx,x,y,w,22,11);ctx.fillStyle='rgba(0,0,0,.5)';ctx.fill();
  const prog=S.boss?1:clamp((S.nextWave-1+clamp((S.t-(P.waves[Math.max(0,S.nextWave-1)]||{t:0}).t)/16,0,1))/P.K,0,1);
  rr(ctx,x+2,y+2,Math.max(10,(w-4)*(S.bossSpawned?1:Math.min(1,S.t/P.bossT))),18,9);ctx.fillStyle=S.bossSpawned?'#ff4d4d':'#ffa84a';ctx.fill();
  txt(ctx,S.bossSpawned?'BOSS FIGHT!':'Wave '+Math.max(1,S.nextWave)+' of '+P.K+' + Boss',x+w/2,y+11.5,12,'#fff','rgba(0,0,0,.6)');
  let horde=0;for(const r of S.reds)horde+=r.n;for(const j of S.jobs)horde+=j.n;
  if(S.boss&&S.boss.hp>0)horde+=S.boss.hp;else if(!S.bossSpawned)horde+=P.bossHP+P.escort;
  rr(ctx,LW-98,y,90,22,11);ctx.fillStyle='rgba(120,10,20,.75)';ctx.fill();txt(ctx,'👹 '+fmt(horde),LW-53,y+11.5,13,'#fff');
  // boss health bar
  const b=S.boss;
  if(b&&(b.hp>0||S.mode==='play')){const bw=250,bx=(LW-bw)/2,by=36,p=clamp(b.hp/b.max,0,1);
    rr(ctx,bx,by,bw,20,10);ctx.fillStyle='rgba(0,0,0,.65)';ctx.fill();rr(ctx,bx+2,by+2,Math.max(6,(bw-4)*p),16,8);ctx.fillStyle=b.hit>0?'#fff':'#e8212c';ctx.fill();
    txt(ctx,b.name+'  '+fmt(b.hp),LW/2,by+10.5,12,'#fff','rgba(0,0,0,.7)')}
}
function drawTutorial(){
  if(S.mode!=='play'||S.level!==1||S.tut>=2)return;
  const t=S.anim;
  if(S.tut===0){
    let ids=[];S.grid.forEach((s,i)=>{if(s&&s.tier===1)ids.push(i)});if(ids.length<2)return;
    const a=slotCenter(ids[0]),b=slotCenter(ids[1]),k=((t*.55)%1.6)/1.6,e=k<.15?0:k>.75?1:(k-.15)/.6,ee=e*e*(3-2*e);
    const x=a.x+(b.x-a.x)*ee,y=a.y+(b.y-a.y)*ee;
    rr(ctx,LW/2-135,LAY.wallTop-78,270,32,16);ctx.fillStyle='rgba(0,0,0,.7)';ctx.fill();txt(ctx,'Drag two the same together!',LW/2,LAY.wallTop-62,17,'#fff');
    drawHand(x+8,y+14,k>.15&&k<.8,t);
  }else if(S.tut===1){
    const bi=bestGateIdx(maxVolley()),gx=GATE_X[bi];
    rr(ctx,LW/2-130,LAY.wallTop-110,260,48,14);ctx.fillStyle='rgba(0,0,0,.72)';ctx.fill();txt(ctx,'Tap a gate to pick it!',LW/2,LAY.wallTop-96,16,'#fff');txt(ctx,'Which makes the biggest army?',LW/2,LAY.wallTop-77,12,'#ffe45c');
    drawHand(gx+8,LAY.wallTop+22+Math.abs(Math.sin(t*4))*-8,false,t);
  }
}
function drawHand(x,y,down,t){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.35);const s=down?.92:1;ctx.scale(s,s);
  ctx.fillStyle='#fff';ctx.strokeStyle='#333';ctx.lineWidth=2.5;ctx.lineJoin='round';
  rr(ctx,-5,-4,11,26,5.5);ctx.fill();ctx.stroke();rr(ctx,-14,12,30,24,10);ctx.fill();ctx.stroke();
  ctx.restore();
  if(!down){ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,12+Math.sin(t*8)*3,0,6.3);ctx.stroke()}
}
