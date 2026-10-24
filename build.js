// node build.js  ->  index.html (single offline file) built from parts/, plus icon + .nojekyll
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const dir=__dirname,P=p=>path.join(dir,'parts',p);
const NAME=(fs.readFileSync(P('js/00-config.js'),'utf8').match(/const GAME_NAME='([^']+)'/)||[])[1]||'Merge Army';

// ---- tiny PNG icon renderer (no deps): 180x180 apple-touch-icon ----
function renderIcon(N){
  const SS=3,W=N*SS,buf=new Float32Array(W*W*3);
  const shapes=[];
  const col=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const add=(test,fill)=>shapes.push({test,fill});
  const S=N/180;
  const circ=(cx,cy,r,c)=>add((x,y)=>(x-cx*S)**2+(y-cy*S)**2<(r*S)**2,c);
  const rrect=(x0,y0,w,h,r,c)=>add((x,y)=>{x/=S;y/=S;if(x<x0||x>x0+w||y<y0||y>y0+h)return false;const cx=Math.min(Math.max(x,x0+r),x0+w-r),cy=Math.min(Math.max(y,y0+r),y0+h-r);return (x-cx)**2+(y-cy)**2<=r*r},c);
  const line=(x1,y1,x2,y2,w,c)=>add((x,y)=>{x/=S;y/=S;const dx=x2-x1,dy=y2-y1,t=Math.max(0,Math.min(1,((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy))),px=x1+t*dx,py=y1+t*dy;return (x-px)**2+(y-py)**2<=(w/2)**2},c);
  const tri=(a,b,c2,c)=>add((x,y)=>{x/=S;y/=S;const s=(p,q,r)=>(p[0]-r[0])*(q[1]-r[1])-(q[0]-r[0])*(p[1]-r[1]);const p=[x,y],d1=s(p,a,b),d2=s(p,b,c2),d3=s(p,c2,a);return !((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0))},c);
  // background: gradient handled in shader below; sand
  rrect(0,128,180,52,0,col('#e8c47a'));
  // red horde on top
  for(const[x,y]of[[40,28],[70,18],[100,26],[130,16],[150,34],[22,50],[60,46],[118,48]]){circ(x,y-5,6,col('#e6262b'));line(x,y,x,y+13,4,col('#e6262b'));line(x-7,y+4,x+7,y+4,3,col('#e6262b'))}
  // yellow gate
  rrect(14,70,152,42,14,col('#7a4a00'));rrect(18,73,144,36,12,col('#ffd400'));rrect(18,73,144,16,12,col('#ffe97a'));
  line(66,80,90,102,7,col('#b25a00'));line(90,80,66,102,7,col('#b25a00'));
  rrect(104,78,8,26,3,col('#b25a00'));// 'x' + '5'-ish bars
  rrect(116,78,22,6,3,col('#b25a00'));rrect(116,88,22,6,3,col('#b25a00'));rrect(116,98,22,6,3,col('#b25a00'));rrect(116,78,6,16,3,col('#b25a00'));rrect(132,88,6,16,3,col('#b25a00'));
  // blue cannon
  circ(72,152,13,col('#1b2750'));circ(108,152,13,col('#1b2750'));
  rrect(81,118,18,44,7,col('#2f7bff'));rrect(85,121,5,34,2,col('#a9d1ff'));
  circ(90,150,24,col('#2f7bff'));circ(82,142,8,col('#a9d1ff'));
  const out=Buffer.alloc(N*(N*3+1));
  for(let py=0;py<W;py++)for(let px=0;px<W;px++){
    const x=px+.5,y=py+.5,t=y/W;
    let c=[40+30*(1-t),110+40*(1-t)+40*t,230-30*t];  // sky gradient
    if(y>=128*S)c=[232,196,122];
    for(const s of shapes)if(s.test(x,y))c=s.fill;
    const i=(py*W+px)*3;buf[i]=c[0];buf[i+1]=c[1];buf[i+2]=c[2];
  }
  const raw=Buffer.alloc(N*(N*3+1));
  for(let y=0;y<N;y++){raw[y*(N*3+1)]=0;for(let x=0;x<N;x++){let r=0,g=0,b=0;for(let sy=0;sy<SS;sy++)for(let sx=0;sx<SS;sx++){const i=((y*SS+sy)*W+x*SS+sx)*3;r+=buf[i];g+=buf[i+1];b+=buf[i+2]}
    const o=y*(N*3+1)+1+x*3;raw[o]=r/(SS*SS);raw[o+1]=g/(SS*SS);raw[o+2]=b/(SS*SS)}}
  const crcT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
  const crc=b=>{let c=0xffffffff;for(const x of b)c=crcT[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0};
  const chunk=(type,data)=>{const l=Buffer.alloc(4);l.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(type),data]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c])};
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(N,0);ihdr.writeUInt32BE(N,4);ihdr[8]=8;ihdr[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
const png=renderIcon(180);
fs.writeFileSync(path.join(dir,'apple-touch-icon.png'),png);
const icon='data:image/png;base64,'+png.toString('base64');
const manifest='data:application/manifest+json,'+encodeURIComponent(JSON.stringify({name:NAME,short_name:NAME,display:'standalone',orientation:'portrait',background_color:'#0c1238',theme_color:'#1b2a6b',icons:[{src:icon,sizes:'180x180',type:'image/png'}]}));
const css=fs.readFileSync(P('style.css'),'utf8');
const js=fs.readdirSync(P('js')).filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(P('js/'+f),'utf8')).join('\n');
const wrapped="(function(){'use strict';\n"+js+"\n})();";
let html=fs.readFileSync(P('head.html'),'utf8');
const rep=(k,v)=>{html=html.split(k).join(v)}; // split/join avoids $-pattern issues
rep('%%NAME%%',NAME);rep('%%ICON%%',icon);rep('%%MANIFEST%%',manifest);rep('%%CSS%%',css);rep('%%JS%%',wrapped.replace(/<\/script/gi,'<\\/script'));
fs.writeFileSync(path.join(dir,'index.html'),html);
fs.writeFileSync(path.join(dir,'.nojekyll'),'');
console.log('built index.html',html.length,'bytes');
