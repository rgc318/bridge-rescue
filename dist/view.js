(() => {
'use strict';
const G=globalThis.BridgeGame, A=globalThis.FinchAudio, $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
const groups={parts:$('mechanisms'),birds:$('actors'),pins:$('pins')};
const chapters=[
 {name:'雀鸣林',desc:'木销与桥板',icon:'✿',color:'#a4c199'},
 {name:'金叶峡',desc:'羽毛与双路线',icon:'◆',color:'#eeb580'},
 {name:'月影谷',desc:'组合机关',icon:'☾',color:'#b4c7eb'}
];
const chapterAt=i=>Math.min(2,Math.floor(i/5));
const short=['一拆成桥','先接住，再放下','一拆连锁'];
const hints=['点发光的拉环，拔掉上方木销。底部转轴要留着。','让两段桥板接在一起。','让配重落下，压平跷跷板。'];
const prefersQuiet=window.matchMedia('(prefers-reduced-motion: reduce)');
const memory=(key,def)=>{try{return JSON.parse(localStorage.getItem(key)??'null')??def;}catch{return def;}};
const save=(key,v)=>{try{localStorage.setItem(key,JSON.stringify(v));}catch{}};
const config=memory('finch-rescue-settings-v3',{})||{};
const key='finch-rescue-best-v2';let records={};
try{records=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
let history=[],hintId=null,hintBonus=false,helped=false,replay=false,focusId=null,message='',noteUntil=0;
function scoreOf(s){
 const par=s.level.par??s.level.solution.length, extra=Number(s.bonus)||0, efficient=s.moves<=par;
 const rating=1+Number(efficient||extra>0)+Number(!helped&&(s.level.bonus?extra>=s.level.bonus:efficient));
 return {rating,moves:s.moves,bonus:extra};
}
let last=0, status='', activeIndex=-1, effects=[], ropes=[];
const create=(tag,attrs={},parent)=>{const el=document.createElementNS(ns,tag);attrsTo(el,attrs);if(parent)parent.append(el);return el;};
const attrsTo=(el,attrs)=>{for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);};
let partEls=new Map(), birdEls=[],pinEls=new Map(),featherEls=new Map(),hoistPath=null;
function plank(p,parent){
 const g=create('g',{},parent),l=p.length||p.width||40,h=p.height||p.width||13,x=-(p.anchor||0)*l,y=-h/2, grass=['brace','rail','float','pier'].includes(p.role)||p.id==='pier';
 if(p.kind==='counterweight'||p.kind==='weight'){
  create('path',{d:'M-17 -12 -8 -21 11 -20 20 -10 16 15 -13 17 -21 7Z',fill:'url(#rock)',stroke:'#45596a','stroke-width':2.5},g);
  create('path',{d:'M-15 -10 -8 -16 8 -16 14 -10M-4 -12 1 -4 -3 5 5 11',fill:'none',stroke:'#5a767c','stroke-width':2,'stroke-linecap':'round'},g);
  return {g};
 }
 create('rect',{x:x+1,y:y+3,width:l,height:h,rx:4,fill:'#172f2a',opacity:.27},g);
 create('rect',{x,y,width:l,height:h,rx:4,fill:grass?'url(#plankB)':p.role==='gate'?'url(#plankC)':'url(#plankA)',stroke:'#604634','stroke-width':2.05},g);
 create('path',{d:`M${x+5} ${y+3}H${x+l-5}`,stroke:'#f2c786','stroke-width':2.7,'stroke-linecap':'round'},g);
 for(const dx of [5,l-5]){create('circle',{cx:x+dx,cy:0,r:1.7,fill:'#705039'},g);create('circle',{cx:x+dx-.4,cy:-.4,r:.74,fill:'#ffdfa5',opacity:.8},g);}
 if(grass||p.role==='gate')for(const dx of [9,l-9])create('path',{d:`M${x+dx-1} ${y+1}v${h-2}m3 ${2-h}v${h-2}`,stroke:'#e3dbaf',opacity:.55,'stroke-width':1.05},g);
 for(let i=0;i<l/33;i++){const sx=x+8+i*31;create('path',{d:`M${sx} ${y+h*.65}q8 -3 15 0`,stroke:'#7d543a','stroke-width':1.4,fill:'none',opacity:.66},g);}
 const crack=create('path',{d:`M${x+l*.59} ${y}l-7 5 7 3 -6 ${Math.max(2,h-8)}m6 -3 12 -4`,stroke:'#59312a','stroke-width':2,fill:'none',opacity:0},g);
 return {g,crack};
}
function finch(parent,i){
 const g=create('g',{},parent), shadow=create('ellipse',{rx:13,ry:3,fill:'#173532',opacity:.22},g), pose=create('g',{},g), body=create('g',{},pose);
 const base='url(#bird'+i%3+')', wing=['#387f91','#a66c47','#755e9a'][i%3];
 const l=create('path',{d:'M-2 7v6l-4 1m4-1 2 1',stroke:'#985d3b','stroke-width':1.45,fill:'none','stroke-linecap':'round'},body);
 const r=create('path',{d:'M6 7v6l-3 1m3-1 2 1',stroke:'#a96b3d','stroke-width':1.45,fill:'none','stroke-linecap':'round'},body);
 const tail=create('path',{d:'M-8 3q-10-2-14-10-3 3 2 10-5-1-7-4 1 9 15 9Z',fill:wing,stroke:'#345b57','stroke-width':.8},body);
 create('path',{d:'M-14-1Q-16-12-5-14Q8-18 13-8Q19 1 12 8Q7 15-4 13Q-13 11-14-1Z',fill:base,stroke:'#2c504c','stroke-width':1.6},body);
 create('path',{d:'M-6 8Q-6 1 3 0Q11-4 14 1Q14 8 6 11Q0 15-6 8Z',fill:'#ffedb7'},body);
 create('path',{d:'M-8-11q-7-6-6-9 6-1 12 7-3-9 0-9l5 9',fill:wing,stroke:'#355950','stroke-width':.9},body);
 const feather=create('g',{},body);
 create('path',{d:'M-1-2Q-9-5-14 3q-1 4 4 5Q-4 7 -1-2Z',fill:wing},feather);
 create('path',{d:'M-12 4q5 0 8-4m-6 6q2 0 5-3',stroke:'#fff7d3','stroke-opacity':.36,'stroke-width':1,fill:'none','stroke-linecap':'round'},feather);
 create('path',{d:'M12-2 21 0 13 5Z',fill:'#ffca68',stroke:'#955e43','stroke-width':1},body);
 create('ellipse',{cx:6,cy:3.6,rx:3.3,ry:1.35,fill:'#f49d75',opacity:.82},body);
 const eye=create('g',{},body);
 create('ellipse',{cx:7,cy:-5.2,rx:4.8,ry:5.2,fill:'#fff9dc'},eye);
 create('circle',{cx:8.2,cy:-5,r:2.45,fill:'#253d3e'},eye);
 create('circle',{cx:9,cy:-6.2,r:.82,fill:'#fff'},eye);
 return {g,eye,body,pose,shadow,l,r,tail,feather};
}
function pinNode(p,i,parent){
 const g=create('g',{'data-pin':p.id,role:'button',tabindex:0,'aria-label':p.label||`拔掉木销 ${i+1}`},parent);
 const axle=p.kind==='hinge';
 create('circle',{r:25,fill:'transparent'},g);
 create('circle',{class:'pin-halo',r:19,fill:'none',stroke:'#fff5ac','stroke-width':3},g);
 const face=create('g',{class:'pin-handle',transform:'translate(0 -1)'},g);
 if(axle){
  create('rect',{x:-8.7,y:1.8,width:17.4,height:10,rx:3,fill:'#52493c',stroke:'#332f2b','stroke-width':1.4},face);
  for(const dx of [-5.2,5.2])create('circle',{cx:dx,cy:7,r:1,fill:'#cebd91'},face);
 }else create('ellipse',{rx:7.3,ry:4.9,cy:8.2,fill:'#865637',stroke:'#523823','stroke-width':1.15},face);
 create('path',{d:'M0 3v6',stroke:'#432e29','stroke-width':5,'stroke-linecap':'round'},face);
 create('path',{d:'M0 3v6',stroke:'url(#pin)','stroke-width':2.8,'stroke-linecap':'round'},face);
 const handle='M-7.1-5.6Q-7.1-9.8-2.8-10.2H2.8Q7.1-9.8 7.1-5.6Q7.1-1.7 4.1 2.4Q2.4 4.3 0 4.3Q-2.4 4.3-4.1 2.4Q-7.1-1.7-7.1-5.6Z';
 create('path',{d:handle,fill:'#593c2b','fill-opacity':.38,stroke:'#4a3229','stroke-width':5.8,'stroke-linejoin':'round'},face);
 create('path',{class:'pin-face',d:handle,fill:'none',stroke:'url(#pin)','stroke-width':3.65,'stroke-linejoin':'round'},face);
 create('path',{d:'M-5.9-5.8q0-3.1 3.2-3.5h4.6',fill:'none',stroke:'#fff3b2','stroke-width':1.05,'stroke-linecap':'round'},face);
 const tap=()=>{
  if(p.locked&&G.state.phase==='ready'){note('这枚拉环已被本路线锁住。');A?.play('deny',.3);return;}
  if(G.tap(p.id)){history.push(p.id);hintId=null;hintBonus=false;try{if(navigator.vibrate)navigator.vibrate(12);}catch{}}
 };
 g.addEventListener('click',tap);
 g.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();focusId=p.id;tap();}});
 return g;
}
function build(){
 const s=G.state;activeIndex=s.index;effects=[];status='';message='';ropes=[];noteUntil=0;
 const chapter=s.level.chapter??chapterAt(s.index); document.body.dataset.theme=chapter;
 A?.setChapter?.(chapter);
 const backdrop=$('landscape'), url='maps/chapter-'+(chapter+1)+'.svg?v=3';
 if(backdrop.getAttribute('href')!==url)backdrop.setAttribute('href',url);
 $('region').textContent=chapters[chapter].name;$('stageIndex').textContent='第 '+String(s.index+1).padStart(2,'0')+' 关';
 $('boardNote').hidden=true;
 for(const g of Object.values(groups))g.replaceChildren();
 partEls=new Map();pinEls=new Map();featherEls=new Map();birdEls=[];hoistPath=null;
 if(!s.level.links?.length&&s.parts.some(p=>p.id==='pier')){
  const pier=s.parts.find(p=>p.id==='pier'), weight=s.parts.find(p=>p.kind==='counterweight'), y=97;
  if(weight){
   const x1=pier.x,x2=weight.x;
   create('path',{d:`M${x1-11} ${y-8}H${x2+11}`,stroke:'#b78d55','stroke-width':6,'stroke-linecap':'round',opacity:.7},groups.parts);
   hoistPath=create('path',{fill:'none',stroke:'#4c5b48','stroke-width':1.7,'stroke-dasharray':'3 2',opacity:.72},groups.parts);
   for(const x of [x1,x2])create('circle',{cx:x,cy:y,r:5.5,fill:'#e3b379',stroke:'#72543c','stroke-width':1.4},groups.parts);
  }
 }
 if(s.index===2||(s.parts.some(p=>p.id==='bridge'&&p.anchor===.5)&&s.level.pedestal)){
  create('path',{d:'M182 389 208 323 234 389Z',fill:'#6b7669',stroke:'#4d5a50','stroke-width':2.5},groups.parts);
  create('path',{d:'M194 386l14-37 5 12',fill:'none',stroke:'#9da990','stroke-width':2.5,'stroke-linecap':'round'},groups.parts);
 }
 if(s.index===0){
  create('path',{d:'M307 316h-11v8h11',fill:'#91b77a',stroke:'#5d7d58','stroke-width':1.5},groups.parts);
 }
 if(s.level.id==='great-waterworks'){
  // The sluice rides vertically in a pair of narrow guide rails.
  const x=s.parts.find(p=>p.id==='gate').x;
  create('path',{d:`M${x-11} 99V321m22 0V99m-25 0h28`,stroke:'#35504a','stroke-width':2.3,opacity:.61,fill:'none','stroke-linecap':'round'},groups.parts);
  create('path',{d:`M${x-11} 104V314m22 0V104`,stroke:'#b7bba4','stroke-width':.6,opacity:.56,fill:'none'},groups.parts);
  create('path',{d:'M219 266H281v5',stroke:'#354b48','stroke-width':3.1,opacity:.63,fill:'none','stroke-linecap':'round'},groups.parts);
 }
 for(const prop of s.level.scenery||[]){
  if(prop.kind!=='fulcrum')continue;
  const x=prop.x,y=prop.y,w=prop.width,h=prop.height;
  create('path',{d:`M${x-w/2} ${y+h} ${x} ${y} ${x+w/2} ${y+h}Z`,fill:'url(#rock)',stroke:'#495f62','stroke-width':2.1},groups.parts);
  create('path',{d:`M${x-w*.3} ${y+h*.92} ${x} ${y+10} ${x+w*.15} ${y+h*.56}`,fill:'none',stroke:'#c0d4cf','stroke-opacity':.52,'stroke-linecap':'round','stroke-width':1.5},groups.parts);
 }
 for(const item of s.level.links||[]){
  const path=create('path',{fill:'none',stroke:'#493e33','stroke-width':1.9,'stroke-dasharray':'4 2',opacity:.71},groups.parts);
  ropes.push({item,path});
 }
 for(const p of s.parts)partEls.set(p.id,plank(p,groups.parts));
 for(const f of s.feathers||[]){
  const g=create('g',{'aria-hidden':'true'},groups.birds);
  create('circle',{r:14,fill:'#ffc861',opacity:f.physical?.23:.33},g);
  create('path',{d:'M-7 7Q-10-4-2-8Q8-14 10-10Q11-1 4 5Q0 9-7 7Z',fill:'#ffda77',stroke:'#97612d','stroke-width':1.4},g);
  create('path',{d:'M-10 11Q-4 2 5-5M-5 4l.1-6m2 4 6-1',fill:'none',stroke:'#92612d','stroke-width':1.35,'stroke-linecap':'round'},g);
  featherEls.set(f.id,g);
 }
 for(let i=0;i<s.birds.length;i++)birdEls.push(finch(groups.birds,i));
 for(const [i,p] of s.pins.entries())pinEls.set(p.id,pinNode(p,i,groups.pins));
 $('chapter').textContent=short[s.index]||s.level.title;$('result').hidden=true;
 nav();
}
const mapTiles=[];
function setupMap(){
 for(const [j,c] of chapters.entries()){
  const sub=document.createElement('section');sub.className='map-group';sub.style.setProperty('--map-color',c.color);
  const heading=document.createElement('div');heading.className='map-head';
  const icon=document.createElement('span');icon.className='map-icon';icon.setAttribute('aria-hidden','true');icon.textContent=c.icon;
  const meta=document.createElement('div'), name=document.createElement('h3'), desc=document.createElement('p');
  name.textContent=c.name;desc.textContent=c.desc;meta.append(name,desc);heading.append(icon,meta);
  const tiles=document.createElement('div');tiles.className='map-tiles';sub.append(heading,tiles);$('select').append(sub);
  for(let i=j*5;i<Math.min((j+1)*5,G.levels.length);i++){
   const l=G.levels[i], b=document.createElement('button');b.type='button';b.className='map-tile';
   b.title=l.title;b.onclick=()=>{load(i);if(window.innerWidth<=690)$('board').scrollIntoView({block:'nearest',behavior:prefersQuiet.matches?'instant':'smooth'});};
   mapTiles[i]=b;tiles.append(b);
  }
 }
}
function nav(){
 let count=0;
 mapTiles.forEach((b,i)=>{
  const l=G.levels[i],r=records[l.id];if(r)count++;
  const number=document.createElement('span');number.textContent=String(i+1).padStart(2,'0');
  const stars=document.createElement('small');stars.textContent=r?'★'.repeat(Math.min(3,Math.max(0,r.rating||0))):'···';
  stars.setAttribute('aria-hidden','true');b.replaceChildren(number,stars);
  if(l.bonus){const diamond=document.createElement('span');diamond.className='map-bonus';diamond.setAttribute('aria-hidden','true');diamond.textContent='◆';b.append(diamond);}
  b.setAttribute('aria-label','第 '+(i+1)+' 关 · '+l.title+(r?'，最高 '+r.rating+' 星':'')+(l.bonus?'，有金羽毛挑战':''));
  b.setAttribute('aria-current',String(activeIndex===i));
 });
 $('total').textContent='已救援 '+count+' / '+G.levels.length+' 关';
 $('progressFill').style.width=(100*count/G.levels.length)+'%';
}
function load(i, focus=false){
 if(!G.levels[i])return;
 const shouldFocus=focus&&document.activeElement?.closest?.('#result');
 history=[];hintId=null;hintBonus=false;helped=false;focusId=null;
 G.load(i);build();draw(performance.now());save('finch-rescue-active-v3',i);
 if(shouldFocus)requestAnimationFrame(()=>mapTiles[i]?.focus({preventScroll:true}));
}
function undo(){
 if(!history.length||!['ready','lose'].includes(G.state.phase))return;
 const i=G.state.index;history.pop();replay=true;
 G.load(i);for(const id of history){G.tap(id);G.tick(12);}
 replay=false;hintId=null;hintBonus=false;helped=true;build();draw(performance.now());A?.play('undo');
}
function showHint(){
 const s=G.state;if(s.phase!=='ready')return;
 hintBonus=!!(s.level.bonus&&hintId&&!hintBonus&&!s.bonus);
 const candidate=G.hintPin?.(hintBonus);
 hintId=typeof candidate==='string'?candidate:candidate?.id||s.level.solution.find(id=>s.pins.some(p=>p.id===id&&!p.removed&&!p.locked));
 if(!hintId)return;helped=true;
 $('guide').textContent=(hintBonus?'金羽毛路线：':'试试')+'点亮起的拉环「'+(s.pins.find(p=>p.id===hintId)?.label||'木销')+'」。';
 if(s.level.bonus&&!hintBonus)$('guide').textContent+=' 再点提示可找羽毛路线。';
 note('下一步 · '+(s.pins.find(p=>p.id===hintId)?.label||'木销'),1750);
 A?.play('hint');
}
function note(text,duration=1300){
 const el=$('boardNote');el.textContent=text;el.hidden=false;noteUntil=performance.now()+duration;
}
function draw(t){
 const s=G.state; if(activeIndex!==s.index)build();
 if(noteUntil&&t>=noteUntil){noteUntil=0;$('boardNote').hidden=true;}
 for(const {item,path} of ropes){
  const endpoint=(id)=>typeof id==='string'?(s.parts.find(p=>p.id===id)||s.pins.find(p=>p.id===id)):Array.isArray(id)?{x:id[0],y:id[1]}:id;
  const l=endpoint(item.from||item.a),r=endpoint(item.to||item.b);
  if(l&&r&&Number.isFinite(l.x)&&Number.isFinite(r.x)){
   const v=item.via||item.points||[];const through=Array.isArray(v)&&typeof v[0]==='number'?[v]:v;
   const points=[l,...(Array.isArray(through)?through.map(endpoint).filter(p=>p&&Number.isFinite(p.x)):[]),r];
   path.setAttribute('d',points.map((v,i)=>(i?'L':'M')+v.x+' '+v.y).join(' '));
   path.setAttribute('visibility',l.removed||r.removed?'hidden':'visible');
  }else path.setAttribute('visibility','hidden');
 }
 if(hoistPath){
  const pier=s.parts.find(p=>p.id==='pier'), weight=s.parts.find(p=>p.kind==='counterweight');
  if(pier&&weight)hoistPath.setAttribute('d',`M${pier.x} ${pier.y-pier.length/2}V97H${weight.x}V${weight.y-16}`);
 }
 for(const p of s.parts){
  const view=partEls.get(p.id);if(!view)continue;
  attrsTo(view.g,{transform:`translate(${p.x} ${p.y}) rotate(${p.angle*180/Math.PI||0})`,opacity:p.opacity??1});
  if(view.crack)view.crack.setAttribute('opacity',p.damaged||p.cracked||p.damage>0?.92:0);
 }
 for(const f of s.feathers||[]){const g=featherEls.get(f.id);if(g)attrsTo(g,{transform:`translate(${f.x} ${f.y-(f.physical?0:2*Math.sin(t/310))})`,visibility:f.collected||f.lost?'hidden':'visible',opacity:f.opacity??1});}
 for(const [i,b] of s.birds.entries()){
  const v=birdEls[i];if(!v)continue;
  const still=prefersQuiet.matches, hop=b.hop||0, stride=(!b.rescued&&s.phase==='animating'&&Math.abs(b.x-(s.level.birds[i]?.x??b.x))>1)?Math.sin(b.x*.45):0;
  const xscale=b.direction===-1?-1:1, yBob=still||hop||stride||b.rescued?0:.45*Math.sin(t/230+i);
  attrsTo(v.g,{transform:`translate(${b.x} ${b.y+hop+13})`,opacity:b.opacity??1});
  attrsTo(v.shadow,{rx:Math.max(5,13-hop*.19),opacity:Math.max(.06,.25-hop*.005)});
  v.pose.setAttribute('transform',`translate(0 ${-hop-13+yBob}) scale(${xscale} 1)`);
  v.body.setAttribute('transform',`rotate(${still?0:b.rescued?4:stride*5}) scale(${1+Math.abs(stride)*.025} ${1-Math.abs(stride)*.027})`);
  v.tail.setAttribute('transform',`rotate(${still?0:stride*11+Math.sin(t/300+i)*3} -10 4)`);
  v.feather.setAttribute('transform',`rotate(${still?0:Math.min(21,hop*.8)+stride*6} -3 1)`);
  v.l.setAttribute('transform',`rotate(${stride*32} -2 8)`);v.r.setAttribute('transform',`rotate(${-stride*32} 6 8)`);
  const eye=(t+i*376)%3060<115?.10:1;
  v.eye.setAttribute('transform',`translate(0 -5.2) scale(1 ${eye}) translate(0 5.2)`);
 }
 for(const p of s.pins){
  const g=pinEls.get(p.id);if(!g)continue;
  g.classList.toggle('locked',!!p.locked);
  g.classList.toggle('highlight',!p.locked&&!p.removed&&(hintId===p.id||s.index===0&&s.moves===0&&p.id==='upper'));
  attrsTo(g,{transform:`translate(${p.x+17*(p.pull||0)} ${p.y-13*(p.pull||0)}) rotate(${24*(p.pull||0)})`,visibility:p.removed&&p.pull>=1?'hidden':'visible',tabindex:p.removed||p.locked||s.phase!=='ready'?-1:0,'aria-disabled':String(p.removed||!!p.locked||s.phase!=='ready'),opacity:p.removed?1-(p.pull||0):p.locked?.40:1});
 }
 for(const f of effects){
  const age=Math.min(1,Math.max(0,t-f.at)/f.lifespan);
  if(f.kind==='ring'){attrsTo(f.el,{rx:4+age*29,ry:2+age*10,opacity:(1-age)*.84});}
  else attrsTo(f.el,{transform:`translate(${f.x+f.vx*age} ${f.y+f.vy*age+age*age*19}) rotate(${f.rot*age})`,opacity:Math.pow(1-age,1.35)});
  if(age>=1)f.el.remove();
 }
 effects=effects.filter(f=>t-f.at<f.lifespan);
 const moves=s.moves??s.pins.filter(p=>p.removed).length;if($('moves').textContent!==String(moves))$('moves').textContent=moves;
 $('undo').disabled=!history.length||!['ready','lose'].includes(s.phase);$('hint').disabled=s.phase!=='ready';
 const saved=s.birds.filter(b=>b.rescued).length;
 const counter=saved?'已救 '+saved+' / '+s.birds.length:'待救 '+s.birds.length+' 只';
 if($('birds').textContent!==counter)$('birds').textContent=counter;
 if(message!==s.message||status!==s.phase){
  message=s.message;$('guide').textContent=s.phase==='ready'&&s.moves===0?(hints[s.index]||s.level.subtitle):(s.message||hints[s.index]||s.level.subtitle);
 }
 if(status===s.phase)return;
 status=s.phase;
 if(s.phase==='ready'&&focusId){
  const next=s.pins.find(p=>!p.removed&&!p.locked);focusId=null;
  if(next)requestAnimationFrame(()=>pinEls.get(next.id)?.focus({preventScroll:true}));
 }
 if(s.phase!=='win'&&s.phase!=='lose')return;
 const win=s.phase==='win';
 $('boardNote').hidden=true;noteUntil=0;
 $('result').dataset.mode=win?'win':'lose';
 $('resultKicker').textContent=win?'RESCUE COMPLETE':'TRY AGAIN';
 $('points').hidden=!win;
 if(win){
  const r=scoreOf(s),old=records[s.level.id];
  if(!old||r.rating>old.rating||r.rating===old.rating&&r.moves<old.moves){
   records[s.level.id]=r;save(key,records);
  }
  $('points').textContent='★'.repeat(r.rating)+'☆'.repeat(3-r.rating)+' · '+s.moves+' 步'+(r.bonus?' · 找回 '+r.bonus+' 根羽毛':'');
  nav();
 }
 $('resultTitle').textContent=win?(s.birds.length>1?'山雀都回家了！':'山雀到家了！'):'桥没有搭好';
 $('resultText').textContent=s.message||(win?'用了 '+moves+' 次操作。':'试试换一根木销。');
 $('continue').textContent=win?(s.index===G.levels.length-1?'回到地图':'下一关'):'重试本关';
 $('continue').onclick=()=>{
  if(win&&s.index===G.levels.length-1){$('result').hidden=true;mapTiles[s.index]?.focus();return;}
  load(win?s.index+1:s.index,true);
 };
 $('again').hidden=!win&&!history.length;$('again').textContent=win?'再玩一次':'撤销一步';$('again').onclick=win?()=>load(s.index,true):undo;
 $('result').hidden=false;
 if(focusId)requestAnimationFrame(()=>{if(!$('result').hidden)$('continue').focus({preventScroll:true});});
}
G.onEvent=e=>{
 if(replay)return;
 if(['pin','land','splash','rescue','weightSet','feather','cross','win','lose','creak','deny'].includes(e.type))A?.play(e.type,.62);
 if(e.type==='feather')note('找回金羽毛！',1200);
 if(!['land','splash','rescue','weightSet','feather'].includes(e.type)||!Number.isFinite(e.x))return;
 const t=performance.now(), color=e.type==='splash'?'#c4f7eb':e.type==='feather'||e.type==='rescue'?'#ffe5a5':'#edd6a4';
 const ring=create('ellipse',{cx:e.x,cy:e.y,rx:4,ry:2,fill:'none',stroke:color,'stroke-width':2.5,'pointer-events':'none'},groups.birds);
 effects.push({el:ring,at:t,lifespan:460,kind:'ring'});
 if(prefersQuiet.matches)return;
 for(let j=0;j<(e.type==='feather'?12:7);j++){
  const q=j*2.399, sz=1.6+j%3*.7, v=17+(j*13)%19;
  const el=create('path',{d:`M0 ${-sz} ${sz*.65} 0 0 ${sz} ${-sz*.65} 0Z`,fill:color,'pointer-events':'none'},groups.birds);
  effects.push({el,at:t,lifespan:410+(j*33)%320,x:e.x,y:e.y,vx:Math.cos(q)*v,vy:Math.sin(q)*v*.68-18,rot:j*69});
 }
};
setupMap();
$('undo').onclick=undo;$('hint').onclick=showHint;
$('reset').onclick=()=>{A?.play('button');load(G.state.index);};
$('help').onclick=()=>$('helpDialog').showModal();$('soundPanel').onclick=()=>$('audioDialog').showModal();
for(const [id,cfg] of [['sound','sfx'],['music','music']]){
 const b=$(id), title=id==='sound'?'音效':'音乐';
 const show=()=>{const on=!!config[cfg];b.setAttribute('aria-pressed',String(on));b.textContent=title+'：'+(on?'开':'关');};
 show();
 b.onclick=()=>{config[cfg]=!config[cfg];A?.setEnabled(cfg,config[cfg]);save('finch-rescue-settings-v3',config);show();if(cfg==='sfx'&&config.sfx)A?.play('button');};
}
function resumeSaved(){for(const c of ['music','sfx'])if(config[c])A?.setEnabled(c,true);document.removeEventListener('pointerdown',resumeSaved,true);document.removeEventListener('keydown',resumeSaved,true);}
document.addEventListener('pointerdown',resumeSaved,true);document.addEventListener('keydown',resumeSaved,true);
document.addEventListener('keydown',e=>{if(!document.querySelector('dialog[open]')&&e.key.toLowerCase()==='r')load(G.state.index);});
function loop(t){const dt=last?Math.min(.05,(t-last)/1000):0;last=t;G.tick(dt);draw(t);requestAnimationFrame(loop);}
load(memory('finch-rescue-active-v3',0));if(activeIndex<0)load(0);requestAnimationFrame(loop);
})();
