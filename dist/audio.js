(() => {
  'use strict';

  // Original, sample-free audio. Short instruments and foley are synthesized
  // once on demand, then reused as lightweight Web Audio sample voices.
  const RATE = 22050, TAU = Math.PI * 2, REF = 440;
  const bars = [
    {bpm:104, meter:8, root:62, lead:'mallet', backing:'plucked', ambient:'brook',
     notes:[
       [74,0,76,78,0,81,78,0],[76,0,73,0,69,0,71,73],
       [74,0,76,78,0,83,81,0],[78,0,76,0,74,0,69,0],
       [71,0,76,74,0,78,76,0],[74,0,69,0,73,0,76,73],
       [71,0,74,78,0,76,74,0],[73,0,71,69,0,73,0,0]
     ],
     chords:[[50,57,62,66,69],[45,52,61,64,69],[47,54,62,66,71],[43,50,59,62,66],
             [40,47,59,62,64],[42,49,57,61,64],[43,50,59,62,66],[45,52,57,61,67]]},
    {bpm:88, meter:8, root:65, lead:'reed', backing:'mallet', ambient:'leaves',
     notes:[
       [69,0,72,0,74,0,72,69],[67,0,0,71,72,0,0,0],
       [69,0,72,0,76,0,74,0],[72,0,67,0,69,0,0,0],
       [77,0,76,0,74,0,72,0],[69,0,67,0,72,0,0,0],
       [74,0,72,0,69,0,67,0],[71,0,74,0,72,0,0,0]
     ],
     chords:[[41,48,57,60,64],[40,47,55,59,60],[45,52,57,60,64],[43,50,55,60,64],
             [46,53,57,62,65],[41,48,57,60,64],[50,57,57,60,65],[43,50,55,59,64]]},
    {bpm:80, meter:6, root:67, lead:'bell', backing:'reed', ambient:'ridge',
     notes:[
       [79,0,78,0,74,0],[76,0,0,71,0,74],[76,0,74,0,69,0],[71,0,0,66,0,0],
       [74,0,76,0,83,0],[81,0,0,78,0,74],[76,0,74,0,72,0],[71,0,69,0,0,0]
     ],
     chords:[[43,50,59,62,67],[40,47,59,62,64],[45,52,57,60,64],[38,45,54,60,62],
             [43,50,59,62,67],[42,49,57,62,66],[48,55,60,64,67],[38,45,54,57,60]]}
  ];

  const aliases = Object.freeze({pin:'pin',aim:'creak',launch:'pin',hitWood:'land',hitStone:'weightSet',
    break:'break',pop:'feather',near:'rescue',land:'land',splash:'splash',creak:'creak',feather:'feather',
    rescue:'rescue',weightSet:'weightSet',cross:'cross',deny:'deny',undo:'undo',hint:'hint',
    button:'button',win:'win',lose:'lose'});
  const foleyLengths = {pin:.29,creak:.44,land:.36,weightSet:.40,break:.35,splash:.70,
    feather:.61,rescue:.43,cross:.45,deny:.20,undo:.26,hint:.32,button:.14,
    win:1.36,lose:.79,brook:2.3,leaves:2.6,ridge:2.8,brush:.13};
  const instLengths = {mallet:.94,plucked:.79,bass:1.13,reed:1.35,bell:1.28};
  const cl = (v,a,b) => Math.min(b,Math.max(a,v));
  const hz = note => REF * 2 ** ((note - 69) / 12);
  const E = Math.exp;
  const sn = Math.sin;
  const fall = (t,k) => E(-k*t);
  const ramp = (t,d) => cl(t/d,0,1);
  const smooth = (t,d) => {const x=ramp(t,d);return x*x*(3-2*x);};
  const ring = (f,t,k) => sn(TAU*f*t)*fall(t,k);
  const bend = (h1,h2,t,span) => {
    const u=Math.min(t,span);
    return TAU*(h1*u+(h2-h1)*u*u/(2*span)+h2*Math.max(0,t-span));
  };
  const chirp = (h1,h2,t,l) => t<0||t>l ? 0 :
    sn(bend(h1,h2,t,l)) * sn(Math.PI*t/l)**1.65;
  const soft = (n,t,d,a=.006) => t<=0||t>=d?0:ramp(t,a)*smooth(d-t,.032)*fall(t,d<.35?11:4.6) *
    (sn(TAU*hz(n)*t) + .24*ring(hz(n)*2,t,13) + .08*ring(hz(n)*3.01,t,34));

  function gen(name, chapter=0) {
    const inst = Object.prototype.hasOwnProperty.call(instLengths,name), duration = inst ? instLengths[name] : foleyLengths[name];
    if (!duration) return null;
    const data = new Float32Array(Math.ceil(RATE * duration));
    let seed = (0x35d23ac9 ^ (name.length * 0x10ab71 + chapter * 0x1cd931)) >>> 0;
    let lo=0, low=0, mid=0, upper=0;
    for (let i=0;i<data.length;i++) {
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const w=seed/2147483648-1, t=i/RATE, p=TAU*REF*t;
      lo+=.018*(w-lo); low+=.063*(w-low); mid+=.225*(w-mid); upper+=.62*(w-upper);
      const mids=mid-low, high=upper-mid;
      let y=0;
      switch(name) {
        case 'mallet':
          y=.68*ring(REF,t,5.2)+.22*ring(REF*2.003,t,10)+.11*ring(REF*3.96,t,37)+.07*high*fall(t,96);
          break;
        case 'plucked':
          y=.61*ring(REF,t,7.1)+.28*ring(REF*2.001,t,12)+.17*ring(REF*3.006,t,17)+
            .082*ring(REF*4.02,t,28)+.04*ring(REF*5.025,t,32)+.06*mids*fall(t,99);
          break;
        case 'bass':
          y=.73*ring(REF,t,5.2)+.17*ring(REF*2,t,12)+.08*ring(REF*3,t,28);
          break;
        case 'reed': {
          const vib=sn(TAU*4.3*t)*ramp(t,.5)*.43;
          y=(.77*sn(p+vib)+.20*sn(2*p+vib*.4)+.095*sn(3*p+vib*.7)+.058*high) *
            fall(t,2.4)*(.94+.06*sn(TAU*3.2*t));
          break;
        }
        case 'bell':
          y=.69*ring(REF,t,4.4)+.24*ring(REF*2.003,t,8)+.09*ring(REF*2.756,t,10)+
            .11*ring(REF*4.07,t,24)+.045*ring(REF*5.41,t,27);
          break;
        case 'pin': {
          // Cap click, briefly rubbing shank, then the small tap of the head.
          const a=t-.065,b=t-.118;
          y=.26*ring(407,t,54)+.16*ring(698,t,72)+.098*ring(1490,t,102)+
            .37*mids*fall(t,52)+.12*high*fall(t,27);
          if(a>=0)y+=.20*mids*smooth(a,.024)*fall(a,21)*(.68+.32*sn(TAU*29*a));
          if(b>=0)y+=.12*ring(313,b,51)+.115*ring(922,b,51)+.13*mids*fall(b,63);
          break;
        }
        case 'creak': {
          const knot=t-.185;
          y=smooth(t,.024)*fall(t,5.5)*(.17*sn(bend(273,117,t,.26))+.082*sn(bend(582,243,t,.39))+
            .29*mids*(.54+.46*sn(TAU*32*t)));
          if(knot>=0)y+=.09*ring(742,knot,68)+.15*mids*fall(knot,49);
          break;
        }
        case 'land': {
          const tail=t-.083;
          y=.37*sn(bend(156,82,t,.12))*fall(t,23)+.19*ring(318,t,30)+.13*ring(561,t,43)+
            .19*mids*fall(t,34)+.054*high*fall(t,57);
          if(tail>=0)y+=.13*ring(216,tail,30)+.12*mid*fall(tail,41);
          break;
        }
        case 'weightSet': {
          const scrape=t-.064;
          y=.4*sn(bend(129,73,t,.16))*fall(t,17)+.155*ring(243,t,29)+.131*ring(688,t,37)+
            .17*low*fall(t,25)+.15*high*fall(t,64);
          if(scrape>0)y+=.29*mids*smooth(scrape,.027)*fall(scrape,20)*(.68+.32*sn(TAU*49*scrape));
          break;
        }
        case 'break': {
          const a=t-.034,b=t-.102;
          y=.43*high*fall(t,59)+.19*ring(224,t,32)+.2*mids*fall(t,35);
          if(a>=0)y+=.29*high*fall(a,64)+.14*ring(436,a,41);
          if(b>=0)y+=.16*mids*fall(b,35)+.11*ring(173,b,27);
          break;
        }
        case 'splash': {
          const a=t-.09,b=t-.21,c=t-.34;
          y=.43*mids*smooth(t,.017)*fall(t,8.1)+.31*low*smooth(t,.025)*fall(t,9.8)+
            .24*sn(bend(108,58,t,.12))*fall(t,19)+.23*high*fall(t,13);
          y+=.086*chirp(720,285,a,.113)+.058*chirp(519,238,b,.13)+.048*chirp(626,356,c,.119);
          break;
        }
        case 'feather':
          y=.22*soft(79,t,.29)+.21*soft(83,t-.094,.37)+.22*soft(86,t-.18,.41)+
            .10*soft(91,t-.22,.34)+.075*high*smooth(t,.07)*fall(t,11);
          break;
        case 'rescue':
          y=.27*chirp(1520,2480,t-.018,.094)+.17*chirp(2030,1560,t-.112,.097)+
            .22*chirp(1590,2420,t-.229,.126)+.036*high*fall(t,14);
          break;
        case 'cross':
          for(let i=0;i<3;i++){
            const a=t-(.09+i*.094);
            if(a>=0)y+=(.075+i*.018)*ring(164+i*21,a,38)+(.11+i*.012)*mids*fall(a,55);
          }
          y+=.045*mids*smooth(t,.08)*fall(t,8);
          break;
        case 'deny':
          y=.24*sn(bend(211,113,t,.092))*fall(t,25)+.12*ring(132,t,29)+.16*mid*fall(t,48);break;
        case 'undo':
          y=.19*sn(bend(353,691,t,.17))*smooth(t,.03)*fall(t,12)+.12*mids*smooth(t,.038)*fall(t,10)+
            .19*soft(74,t-.135,.121);break;
        case 'hint': y=.19*soft(76,t,.29)+.17*soft(81,t-.104,.216);break;
        case 'button':
          y=.24*ring(389,t,40)+.11*ring(888,t,57)+.17*mids*fall(t,37);break;
        case 'win': {
          const r=bars[chapter].root;
          const mode=4;
          [0,7,12,12+mode,19].forEach((n,j)=>{y+=.25*soft(r+n,t-.118*j,.42);});
          [0,7,12,12+mode].forEach((n,j)=>{y+=.14*soft(r-12+n,t-.48-j*.025,.76,.026);});
          y+=.075*chirp(1300,2200,t-.75,.105)+.055*chirp(1800,1450,t-.88,.12);
          break;
        }
        case 'lose': {
          const r=bars[chapter].root;
          [7,3,0].forEach((n,j)=>{y+=.26*soft(r+n,t-.16*j,.43,.015);});
          y+=.11*soft(r-12,t-.30,.44,.034)+.08*low*smooth(t,.04)*fall(t,7);
          break;
        }
        case 'brush': y=.62*high*fall(t,37)+.31*mids*fall(t,33);break;
        case 'brook':
          y=(2.27*low+.75*mids)*(.69+.16*sn(TAU*.74*t)+.15*sn(TAU*1.88*t+.4));
          y+=.125*chirp(1280,2340,t-.61,.148)+.10*chirp(1730,1280,t-.79,.121);
          break;
        case 'leaves':
          y=(1.65*lo+.52*mid+.56*high)*(.69+.23*sn(TAU*1.7*t));
          y+=.10*chirp(1590,2200,t-1.34,.122)+.09*chirp(2110,1682,t-1.53,.132);
          break;
        case 'ridge':
          y=(2.20*lo+.56*mid)*(.66+.27*sn(TAU*.67*t+.11))+.08*chirp(1150,1750,t-1.72,.184);
          break;
        default: break;
      }
      const first = name==='reed'?.083:duration>=2?.41:inst?.004:.002;
      const final = duration>=2?.52:.031;
      data[i]=cl(y*smooth(t,first)*smooth(duration-t,final),-1,1);
    }
    return data;
  }

  const settings = {sfx:false,music:false};
  const fxBus={}, cache=new Map(), songGains=[];
  let ctx=null, mix=null, musicBus=null, chapter=0, time=0, pos=0, timer=null, hidden=false;
  const liveNotes=new Set();
  const recent=Object.create(null);

  function fade(g,value,now,seconds) {
    const p=g.gain;
    if(typeof p.cancelAndHoldAtTime==='function'){
      try{p.cancelAndHoldAtTime(now);}catch{p.cancelScheduledValues(now);}
    }else p.cancelScheduledValues(now);
    p.setTargetAtTime(value,now,seconds);
  }

  function ensure() {
    const Ctor=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Ctor)return false;
    if(!ctx){
      try {
        ctx=new Ctor();
        mix=ctx.createGain();mix.gain.value=.85;
        if(typeof ctx.createDynamicsCompressor==='function'){
          const d=ctx.createDynamicsCompressor();
          d.threshold.value=-15;d.knee.value=17;d.ratio.value=2.6;
          d.attack.value=.012;d.release.value=.22;
          mix.connect(d);d.connect(ctx.destination);
        }else mix.connect(ctx.destination);
        for(const k of Object.keys(settings)){
          fxBus[k]=ctx.createGain();fxBus[k].gain.value=0;fxBus[k].connect(mix);
        }
        musicBus=ctx.createGain();musicBus.connect(fxBus.music);
        for(let i=0;i<bars.length;i++){
          const g=ctx.createGain();
          g.gain.value=i===chapter?1:0;g.connect(musicBus);songGains.push(g);
        }
      }catch{
        if(ctx&&typeof ctx.close==='function'){try{ctx.close()?.catch?.(()=>{});}catch{}}
        ctx=null;songGains.length=0;return false;
      }
    }
    return true;
  }

  // Call from the caller's sound toggle or an input event, never to outsmart
  // autoplay. A delayed resume naturally lets the music scheduler wait.
  function wake() {
    if(!ensure())return false;
    if(ctx.state==='suspended'||ctx.state==='interrupted'){
      try{ctx.resume()?.catch?.(()=>{});}catch{}
    }
    return true;
  }

  function buffer(name,region=0) {
    const key=name==='win'||name==='lose'?name+region:name;
    if(!cache.has(key)){
      const pcm=gen(name,key===name?0:region);
      if(!pcm)return null;
      const b=ctx.createBuffer(1,pcm.length,RATE);
      if(typeof b.copyToChannel==='function')b.copyToChannel(pcm,0);
      else b.getChannelData(0).set(pcm);
      cache.set(key,b);
    }
    return cache.get(key);
  }

  function voice(name,bus,at,level,rate=1,pan=0,isMusic=false) {
    if(isMusic&&liveNotes.size>=32)return;
    const b=buffer(name,chapter);
    if(!b)return;
    const source=ctx.createBufferSource(), g=ctx.createGain();
    source.buffer=b;
    source.playbackRate.setValueAtTime(rate,at);
    g.gain.setValueAtTime(level,at);
    source.connect(g);
    let p=null;
    if(pan&&typeof ctx.createStereoPanner==='function'){
      p=ctx.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(bus);
    }else g.connect(bus);
    if(isMusic)liveNotes.add(source);
    source.onended=()=>{
      if(isMusic)liveNotes.delete(source);
      try{source.disconnect();g.disconnect();p?.disconnect();}catch{}
    };
    source.start(at);
  }

  function rate(n) {return hz(n)/REF;}
  function songBeat(i, at, no) {
    const {bpm,meter,lead,backing,ambient,notes,chords}=bars[no], bus=songGains[no];
    const bar=(i/meter)|0, beat=i%meter;
    const [bass,fifth,a,b,c]=chords[bar];
    const melody=notes[bar][beat], measure=60/bpm*(meter===6?1/3:1/2);
    if(melody){
      const amp=(beat===0?.147:beat%2===0?.116:.103) * (lead==='bell'?.83:1);
      voice(lead,bus,at,amp,rate(melody),no===1?-.08:.11,true);
      if(no===0&&bar>=4&&beat===4)voice('plucked',bus,at+.026,.034,rate(melody-12),-.16,true);
    }
    if(beat===0||beat===(meter===6?3:4))
      voice('bass',bus,at,beat===0?.16:.086,rate((beat===0?bass:fifth)+12),0,true);
    const arpeg=meter===6?[1,2,4,5]:no===1?[1,3,5,7]:[2,5,6];
    if(arpeg.includes(beat)){
      const idx=arpeg.indexOf(beat);
      const n=[a,b,c,b][idx];
      voice(backing,bus,at+.012,no===1?.072:.063,rate(n),idx%2===0?-.29:.25,true);
    }
    if(beat===(meter===6?3:2)||beat===meter-1){
      if(no!==2)voice('brush',bus,at+(beat===meter-1?measure*.12:0),beat===meter-1?.05:.036,
        beat===meter-1?1.07:.9,.23,true);
    }
    if((bar===0&&beat===0)||(bar===4&&beat===2)){
      voice(ambient,bus,at,.055,1,bar===0?-.26:.25,true);
    }
  }

  function schedule(){
    if(!settings.music||hidden||!ctx||ctx.state!=='running')return;
    const now=ctx.currentTime, m=bars[chapter], unit=(60/m.bpm)/(m.meter===6?3:2);
    if(time<now-.04)time=now+.035;
    while(time<now+.14){
      songBeat(pos,time,chapter);
      pos=(pos+1)%(m.meter*m.notes.length);
      time+=unit;
    }
  }

  function timing() {
    if(timer!==null){clearInterval(timer);timer=null;}
    if(settings.music&&!hidden&&ctx){
      time=ctx.currentTime+.045;
      timer=setInterval(schedule,46);
      schedule();
    }
  }

  function setEnabled(channel,on) {
    if(!Object.prototype.hasOwnProperty.call(settings,channel))return false;
    const prev=settings[channel], active=!!on;
    if(active&&!wake())return false;
    settings[channel]=active;
    if(!ctx)return false;
    fade(fxBus[channel],!active||hidden?0:channel==='music'?.58:.76,ctx.currentTime,.028);
    if(channel==='music'&&(prev!==active||timer===null))timing();
    return active;
  }

  function setChapter(index) {
    if(!Number.isInteger(index)||index<0||index>=bars.length)return chapter;
    if(index===chapter)return chapter;
    chapter=index;pos=0;
    if(ctx) {
      for(let i=0;i<songGains.length;i++)fade(songGains[i],i===chapter?1:0,ctx.currentTime,i===chapter?.10:.17);
      if(settings.music)timing();
    }
    return chapter;
  }

  function play(name,strength=.6) {
    if(!settings.sfx||hidden||!ctx||!Object.prototype.hasOwnProperty.call(aliases,name))return false;
    if(ctx.state!=='running'&&!wake())return false;
    const kind=aliases[name], now=ctx.currentTime;
    const gap=kind==='pin'?.072:kind==='land'?.077:kind==='rescue'?.092:kind==='button'?.062:kind==='win'||kind==='lose'?.31:.073;
    if(now-(recent[kind]??-10)<gap)return false;
    recent[kind]=now;
    const num=Number(strength);
    const amount=Number.isFinite(num)?cl(num>1?num/430:num,0,1):.6;
    const fixed=['win','lose','feather','hint'].includes(kind);
    const velocity=fixed?.72:(.49+amount*.32)*(kind==='button'?.69:1);
    const randomPitch=fixed?1:.93+Math.random()*.13+amount*.035;
    voice(kind,fxBus.sfx,now+.006,velocity,randomPitch);
    if(settings.music&&fixed){
      const g=musicBus.gain;
      if(typeof g.cancelAndHoldAtTime==='function'){try{g.cancelAndHoldAtTime(now);}catch{g.cancelScheduledValues(now);}}
      else g.cancelScheduledValues(now);
      g.setTargetAtTime(kind==='win'?.39:.67,now,.027);
      g.setTargetAtTime(1,now+(kind==='win'?.9:.43),.24);
    }
    return true;
  }

  if(typeof document!=='undefined'&&document.addEventListener){
    hidden=!!document.hidden;
    document.addEventListener('visibilitychange',()=>{
      hidden=!!document.hidden;
      if(!ctx)return;
      for(const k of Object.keys(settings))fade(fxBus[k],!settings[k]||hidden?0:k==='music'?.58:.76,ctx.currentTime,.04);
      timing();
    });
  }

  globalThis.FinchAudio={setEnabled,setChapter,play};
})();
