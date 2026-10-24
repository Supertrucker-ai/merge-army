// ===== CONFIG (rename the game here!) =====
const GAME_NAME='Merge Army';
const SAVE_KEY='mergeArmy.save.v1';
const COLS=5,ROWS=3,NSLOTS=COLS*ROWS,LW=360,SLOT=54,GAP=5,SAND_H=200,WALL_H=40;
const GATE_X=[62,180,298],GATE_W=108;
const LAY={H:600,wallTop:400,sandTop:440,gx0:35};
function relayout(H){LAY.H=H;LAY.sandTop=H-SAND_H;LAY.wallTop=LAY.sandTop-WALL_H;LAY.gx0=(LW-(COLS*SLOT+(COLS-1)*GAP))/2}
function slotRect(i){const c=i%COLS,r=(i/COLS)|0;return{x:LAY.gx0+c*(SLOT+GAP),y:LAY.sandTop+12+r*(SLOT+GAP),w:SLOT,h:SLOT}}
function slotCenter(i){const r=slotRect(i);return{x:r.x+r.w/2,y:r.y+r.h/2}}
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const SUF=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
function fmt(n){
  if(!isFinite(n))return '∞';
  n=Math.abs(n)<0.5?0:n;
  if(n<1000)return String(Math.round(n));
  let i=0,v=n;while(v>=999.5&&i<SUF.length-1){v/=1000;i++}
  if(v>=999.5)return n.toExponential(1).replace('e+','e');
  const s=v>=100?v.toFixed(0):v>=10?v.toFixed(1):v.toFixed(2);
  return s.replace(/\.?0+$/,'')+SUF[i];
}
// ===== THEMES: space + geography, cycling =====
const THEMES=[
 {n:'Moon',deco:'earth',sky:['#070b2a','#1c2260'],gr:['#848aa6','#a4a9c4'],lane:'rgba(255,255,255,.14)',fact:'The Moon is about 384,400 km from Earth. Astronauts walked on it in 1969!'},
 {n:'Mars',deco:'planet',pc:'#d9683a',sky:['#2a0d0a','#6b2a1a'],gr:['#b24c2a','#d0693f'],lane:'rgba(255,220,180,.16)',fact:'Mars has the tallest volcano in our solar system: Olympus Mons!'},
 {n:'Egypt',deco:'pyramids',sky:['#6ec6ff','#ffe9a8'],gr:['#e6c070','#f2d68c'],lane:'rgba(255,255,255,.22)',fact:'The Great Pyramid of Giza in Egypt is over 4,000 years old!'},
 {n:'Venus',deco:'planet',pc:'#ffcf6b',sky:['#2b1a05','#7a4a10'],gr:['#c98a2a','#e5a73e'],lane:'rgba(255,240,180,.2)',fact:'A day on Venus is longer than a year on Venus!'},
 {n:'Jupiter',deco:'planet',pc:'#e8b07a',stripes:1,sky:['#1a0f26','#4a2a52'],gr:['#b8845a','#d8a678'],lane:'rgba(255,255,255,.16)',fact:'Jupiter is the biggest planet. More than 1,000 Earths could fit inside it!'},
 {n:'Japan',deco:'fuji',sky:['#8fd3ff','#ffd6e8'],gr:['#5fbf6a','#86d98a'],lane:'rgba(255,255,255,.25)',fact:'Mount Fuji in Japan is a volcano, and it is the tallest mountain in Japan!'},
 {n:'Saturn',deco:'planet',pc:'#f0d08a',ring:1,sky:['#0a0c2e','#2b2f72'],gr:['#9a8f6a','#bdb287'],lane:'rgba(255,255,255,.16)',fact:'Saturn\'s rings are made of billions of chunks of ice and rock!'},
 {n:'Uranus',deco:'planet',pc:'#7fe0e8',ring:1,tilt:1,sky:['#06202e','#1a5a6e'],gr:['#6fb3c0','#92d0da'],lane:'rgba(255,255,255,.2)',fact:'Uranus spins tipped over on its side, like a rolling ball!'},
 {n:'France',deco:'eiffel',sky:['#9bd6ff','#fff0d0'],gr:['#7cc77a','#a6dd9a'],lane:'rgba(255,255,255,.25)',fact:'The Eiffel Tower in Paris, France, is about 330 meters tall!'},
 {n:'Neptune',deco:'planet',pc:'#4a78ff',sky:['#050a2e','#1a2a8a'],gr:['#4a5fb8','#6a80d8'],lane:'rgba(255,255,255,.18)',fact:'Neptune has the fastest winds of any planet in our solar system!'},
 {n:'Mercury',deco:'planet',pc:'#b9b2a8',sky:['#120a0a','#3a2a2a'],gr:['#8c857c','#aaa398'],lane:'rgba(255,255,255,.15)',fact:'Mercury is the closest planet to the Sun, and it has no moons!'},
 {n:'Brazil',deco:'jungle',sky:['#7fd7ff','#d8ffc8'],gr:['#2f9e4a','#4fbf64'],lane:'rgba(255,255,200,.22)',fact:'The Amazon rainforest in Brazil is the biggest rainforest on Earth!'},
 {n:'Pluto',deco:'planet',pc:'#d8c4b0',sky:['#04040e','#1a1a3a'],gr:['#9a8a84','#bcaca4'],lane:'rgba(255,255,255,.15)',fact:'Pluto is a dwarf planet. One year on Pluto is 248 Earth years!'},
 {n:'Asteroid Belt',deco:'belt',sky:['#0a0618','#2a1a48'],gr:['#6a5a6a','#8a7a8a'],lane:'rgba(255,255,255,.14)',fact:'The asteroid belt is a ring of space rocks between Mars and Jupiter!'},
 {n:'Australia',deco:'uluru',sky:['#7fd0ff','#ffe0b0'],gr:['#d8743a','#f0925a'],lane:'rgba(255,255,255,.22)',fact:'Australia is both a country and a continent, and kangaroos live there!'},
 {n:'Antarctica',deco:'ice',sky:['#9fd8ff','#e8f6ff'],gr:['#dff2ff','#ffffff'],lane:'rgba(120,180,230,.28)',fact:'Antarctica is the coldest, iciest continent. Penguins live there!'}
];
const BOSSES=[{name:'Giant Red Knight',kind:'knight'},{name:'Asteroid Golem',kind:'golem'},{name:'Big Alien',kind:'alien'},{name:'Comet Monster',kind:'comet'}];
const TIER_COL=['#3b8cff','#19c3b2','#7a5cff','#ff9f1a','#ff4fa3','#2ecc40','#00c2ff','#ffd400','#b85cff','#ff5a36','#66ffcc','#e8f0ff'];
function tierColor(t){return t<=TIER_COL.length?TIER_COL[t-1]:'hsl('+((t*47)%360)+',85%,58%)'}
function tierDark(t){return t<=TIER_COL.length?shade(TIER_COL[t-1],-.35):'hsl('+((t*47)%360)+',70%,30%)'}
function tierLight(t){return t<=TIER_COL.length?shade(TIER_COL[t-1],.4):'hsl('+((t*47)%360)+',95%,78%)'}
function shade(hex,p){const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;const f=p<0?0:255,k=Math.abs(p);r=Math.round((f-r)*k+r);g=Math.round((f-g)*k+g);b=Math.round((f-b)*k+b);return 'rgb('+r+','+g+','+b+')'}
// ===== TRIVIA (space + geography) =====
const TRIVIA=[
 ['Which planet is the Red Planet?','Mars',['Venus','Jupiter']],
 ['Which planet has big rings?','Saturn',['Mars','Earth']],
 ['What is the biggest planet?','Jupiter',['Mars','Moon']],
 ['Which one is a star?','The Sun',['The Moon','Mars']],
 ['What goes around the Earth?','The Moon',['The Sun','Saturn']],
 ['Which planet is farthest from the Sun?','Neptune',['Mercury','Earth']],
 ['Which planet is closest to the Sun?','Mercury',['Saturn','Neptune']],
 ['Where did astronauts first walk?','The Moon',['Mars','The Sun']],
 ['Pyramids of Giza are in...','Egypt',['Japan','Brazil']],
 ['The Eiffel Tower is in...','France',['Egypt','Canada']],
 ['Kangaroos live in...','Australia',['Brazil','Egypt']],
 ['Which continent is the coldest?','Antarctica',['Africa','Asia']],
 ['The biggest ocean is the...','Pacific',['Atlantic','Arctic']],
 ['How many continents are there?','7',['5','10']],
 ['Mount Fuji is in...','Japan',['France','Mexico']],
 ['Capital city of the USA?','Washington, D.C.',['Paris','Cairo']],
 ['Which planet do we live on?','Earth',['Mars','Venus']]
];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function makeQuestion(L){
  const r=Math.random();
  if(r<0.3){const t=TRIVIA[Math.floor(Math.random()*TRIVIA.length)];return{kind:'trivia',q:t[0],ans:t[1],choices:shuffle([t[1],t[2][0],t[2][1]]),small:true}}
  const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const hi=Math.min(5+L,12);let q,ans;const k=ri(0,5);
  if(k===0){const a=ri(2,hi+3),b=ri(2,hi+3);q=a+' + '+b+' = ?';ans=a+b}
  else if(k===1){const a=ri(2,Math.min(4+Math.floor(L/2),10)),b=ri(1,Math.min(3+Math.floor(L/2),10));q=a+' × '+b+' = ?';ans=a*b}
  else if(k===2){const v=ri(2,5),g=ri(2,5);q='A group of '+v+' goes through a ×'+g+' gate. How many?';ans=v*g}
  else if(k===3){const a=ri(3,hi+6);q='Double '+a+' = ?';ans=a*2}
  else if(k===4){const b=ri(2,9),a=b+ri(1,10);q=a+' − '+b+' = ?';ans=a-b}
  else {const a=ri(1,4)*10,b=ri(1,9);q=a+' + '+b+' + '+b+' = ?';ans=a+2*b}
  const set=new Set([ans]);const cand=[ans+1,ans-1,ans+2,ans-2,ans+10,ans*2,ans+3,ans-3];shuffle(cand);
  for(const c of cand){if(set.size>=3)break;if(c>0&&c!==ans)set.add(c)}
  return{kind:'math',q,ans:String(ans),choices:shuffle([...set].map(String)),small:false,bigq:q.length>14}
}
