// ===== SAVE (localStorage -> sessionStorage -> window.name -> memory) =====
const Store=(function(){
  let ls=null,ss=null,mem=null;const PRE='MAsave:';
  try{ls=window.localStorage;ls.setItem('__t','1');ls.removeItem('__t')}catch(e){ls=null}
  try{ss=window.sessionStorage;ss.setItem('__t','1');ss.removeItem('__t')}catch(e){ss=null}
  function read(){let raw=null;
    if(ls){try{raw=ls.getItem(SAVE_KEY)}catch(e){}}
    if(!raw&&ss){try{raw=ss.getItem(SAVE_KEY)}catch(e){}}
    if(!raw){try{if(window.name&&window.name.indexOf(PRE)===0)raw=window.name.slice(PRE.length)}catch(e){}}
    return raw||mem}
  function write(s){mem=s;
    if(ls){try{ls.setItem(SAVE_KEY,s)}catch(e){}}
    if(ss){try{ss.setItem(SAVE_KEY,s)}catch(e){}}
    try{window.name=PRE+s}catch(e){}}
  return{read,write,kind:ls?'localStorage':ss?'sessionStorage':'window.name'};
})();
const DEF_SAVE=()=>({v:1,coins:0,level:1,maxLevel:1,up:{gate:0,speed:0,wall:0,start:0,coin:0},bestTier:1,tut:0,sound:true,wins:0,losses:0});
let SV=DEF_SAVE();
function loadSave(){
  try{const raw=Store.read();if(raw){const o=JSON.parse(raw);const d=DEF_SAVE();
    SV=Object.assign(d,o);SV.up=Object.assign(d.up,o.up||{});
    for(const k of ['coins','level','maxLevel','bestTier','tut','wins','losses'])if(typeof SV[k]!=='number'||!isFinite(SV[k])||SV[k]<0)SV[k]=d[k];
    SV.coins=Math.floor(SV.coins);SV.level=Math.max(1,Math.floor(SV.level));SV.maxLevel=Math.max(SV.level,Math.floor(SV.maxLevel));
    for(const k in SV.up)if(typeof SV.up[k]!=='number'||!(SV.up[k]>=0))SV.up[k]=0;}}catch(e){SV=DEF_SAVE()}
}
let _dirty=false,_lastSave=0;
function markDirty(){_dirty=true}
function saveNow(){try{Store.write(JSON.stringify(SV))}catch(e){}_dirty=false;_lastSave=performance.now()}
function maybeSave(){if(_dirty&&performance.now()-_lastSave>1500)saveNow()}
