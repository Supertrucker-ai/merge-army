// ===== SOUND (WebAudio, all synthesized) =====
const Snd=(function(){
  let ctx=null,master=null,last={};
  function unlock(){
    if(!ctx){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();master.gain.value=.5;master.connect(ctx.destination)}catch(e){ctx=null;return}}
    if(ctx.state==='suspended')ctx.resume();
  }
  function ok(name,gap){const n=performance.now();if(last[name]&&n-last[name]<gap)return false;last[name]=n;return !!ctx&&SV.sound&&ctx.state==='running'}
  function tone(f,d,type,vol,slide,delay){
    const t=ctx.currentTime+(delay||0),o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t+d);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||.2,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.02);
  }
  function noise(d,vol,f,delay){
    const t=ctx.currentTime+(delay||0),n=Math.floor(ctx.sampleRate*d),b=ctx.createBuffer(1,n,ctx.sampleRate),a=b.getChannelData(0);
    for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);
    const s=ctx.createBufferSource();s.buffer=b;const fl=ctx.createBiquadFilter();fl.type='bandpass';fl.frequency.value=f||1200;
    const g=ctx.createGain();g.gain.value=vol||.2;s.connect(fl);fl.connect(g);g.connect(master);s.start(t);
  }
  const N=[261.6,293.7,329.6,392,440,523.3,587.3,659.3,784,880,1046.5];
  return{unlock,
    click(){if(ok('click',50)){tone(660,.07,'triangle',.18,880)}},
    pick(){if(ok('pick',50)){tone(440,.08,'sine',.2,660)}},
    drop(){if(ok('drop',60)){tone(300,.12,'sine',.22,160)}},
    pop(){if(ok('pop',60)){tone(520,.1,'triangle',.2,300)}},
    merge(t){if(!ok('merge',40))return;const b=N[Math.min(t,7)%N.length];tone(b,.12,'triangle',.28);tone(b*1.5,.14,'triangle',.25,0,.07);tone(b*2,.22,'sine',.25,0,.14);noise(.12,.12,3000)},
    coin(){if(ok('coin',70)){tone(988,.07,'square',.1);tone(1319,.14,'square',.1,0,.06)}},
    buy(){if(ok('buy',50)){tone(523,.08,'triangle',.25);tone(784,.08,'triangle',.25,0,.07);tone(1046,.16,'triangle',.25,0,.14)}},
    gate(good,v){if(ok('gate',70)){good?tone(500+Math.min(v||0,8)*60,.12,'sine',.12,900):tone(300,.15,'sawtooth',.1,150)}},
    gatePick(){if(ok('gp',50)){tone(392,.08,'square',.14);tone(784,.12,'square',.14,0,.07)}},
    shoot(){if(ok('shoot',90)){tone(900,.05,'square',.04,500)}},
    clash(){if(ok('clash',110)){noise(.08,.08,900+Math.random()*900)}},
    fling(){if(ok('fling',120)){tone(300,.25,'sine',.12,900)}},
    swat(){if(ok('swat',200)){noise(.22,.35,500);tone(160,.25,'sawtooth',.25,60)}},
    roar(){if(ok('roar',500)){tone(110,.7,'sawtooth',.3,55);tone(165,.6,'square',.12,70);noise(.5,.2,300)}},
    bonk(){if(ok('bonk',250)){tone(120,.25,'sine',.4,50);noise(.15,.3,400)}},
    wall(){if(ok('wall',300)){tone(90,.15,'sine',.25,60)}},
    win(){if(!ok('win',0))return;[0,2,4,7,9,7,9,10].forEach((n,i)=>tone(N[n%N.length]*(n>=7?2:1),.2,'triangle',.28,0,i*.11));noise(.5,.15,5000,.5)},
    lose(){if(!ok('lose',0))return;tone(392,.3,'triangle',.3,330);tone(330,.3,'triangle',.3,260,.25);tone(262,.6,'triangle',.3,150,.5)},
    good(){if(ok('good',100)){tone(660,.1,'triangle',.25);tone(990,.2,'triangle',.25,0,.09)}},
    bad(){if(ok('bad',100)){tone(200,.22,'square',.15,140)}},
    ctx(){return ctx}
  };
})();
