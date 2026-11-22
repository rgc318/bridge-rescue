'use strict';
// Run from this directory's parent: node --test tests/engine.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../dist/game.js');
const G=globalThis.BridgeGame;
const originalIds=['first-crossing','short-support','seesaw','two-wings','feather-catching','double-route'];
const wrongPaths=[
  ['hinge'], ['long'], ['pivot'], ['right'], null, ['short'],
  ['deck'], ['tether'], ['weight'], ['leftLift','right'], ['deck'], ['stone'],
  ['birds'], null, ['gate','lift','left']
];
function settle(dt=1/60) {
  for(let i=0;i<4000&&G.state.phase==='animating';i++){
    G.tick(dt);
    for(const item of [...G.state.parts,...G.state.birds,...G.state.feathers]){
      assert(Number.isFinite(item.x)&&Number.isFinite(item.y));
      if(item.angle!==undefined)assert(Number.isFinite(item.angle));
    }
  }
  assert.notEqual(G.state.phase,'animating','animation should settle');
}
function replay(index,path,dt=12){
  assert(G.load(index));
  for(const id of path) {
    assert(G.tap(id),`level ${index+1}, action ${id}, path ${path}`);
    assert(!G.tap(id),'lock repeated taps during an action');
    settle(dt);
  }
  return G.state;
}
function checkWin(s,bonus){
  assert.equal(s.phase,'win');
  assert.equal(s.bonus,bonus);
  assert.equal(s.feathers.filter(f=>f.collected).length,bonus);
  assert(s.birds.every(b=>b.rescued&&b.x>G.world.rightEdge&&b.hop===0));
}
function followHint(bonus){
  while(G.state.phase==='ready'){
    const id=G.hintPin({bonus});
    assert(id,'every playable state should supply a valid continuation');
    assert(G.tap(id),`hint points to unavailable pin ${id}`);
    G.tick(12);
  }
  assert.equal(G.state.phase,'win');
}
test('15 stable levels across 3 ordered chapters',()=>{
  assert.equal(G.levels.length,15);
  assert.equal(new Set(G.levels.map(l=>l.id)).size,15);
  assert.deepEqual(G.levels.slice(0,6).map(l=>l.id),originalIds);
  assert.deepEqual(G.levels.map(l=>l.chapter),[0,0,0,0,0,1,1,1,1,1,2,2,2,2,2]);
  for(const l of G.levels){
    const pins=new Set(l.pins.map(p=>p.id));
    assert.equal(pins.size,l.pins.length);
    assert.equal(l.par,l.solution.length);
    assert(l.solution.every(id=>pins.has(id)));
    if(l.bonusSolution){
      assert.equal(l.bonusPar,l.bonusSolution.length);
      assert(l.bonusSolution.every(id=>pins.has(id)));
    }
    if(l.actions){
      assert(l.actions.every(a=>pins.has(a.id)));
      assert(l.pins.every(p=>l.actions.some(a=>a.id===p.id)));
    }
  }
});
G.levels.forEach((l,i)=>{
  test(`${i+1}. ${l.title}: normal, bonus, hints and fail/retry`,()=>{
    for(const dt of [1/120,.164]){
      const events=[];
      G.onEvent=e=>events.push(e);
      const normal=replay(i,l.solution,dt);
      checkWin(normal,0);
      assert.equal(normal.moves,l.par);
      assert.deepEqual(normal.history,l.solution);
      assert.equal(events.filter(e=>e.type==='rescue').length,l.birds.length);
      assert.equal(events.filter(e=>e.type==='win').length,1);
      if(l.bonusSolution){
        events.length=0;
        const bonus=replay(i,l.bonusSolution,dt);
        checkWin(bonus,l.bonus);
        assert.equal(bonus.moves,l.bonusPar);
        assert.equal(events.filter(e=>e.type==='feather').length,l.bonus);
      }
    }
    for(const bonus of [false,true]){
      G.load(i);
      followHint(bonus);
      checkWin(G.state,bonus?l.bonus:0);
      assert.equal(G.state.moves,bonus&&l.bonus?l.bonusPar:l.par);
    }
    if(wrongPaths[i]){
      const wrong=replay(i,wrongPaths[i]);
      assert.equal(wrong.phase,'lose');
      assert(wrong.birds.every(b=>!b.rescued));
      assert.equal(G.hintPin(),null);
      assert.equal(G.state.moves,wrongPaths[i].length);
      G.load(i);
      assert.equal(G.state.phase,'ready');
      assert.equal(G.state.moves,0);
      assert(!G.state.pins.some(p=>p.removed));
      followHint(false);
    }
    G.onEvent=null;
  });
});

test('every reachable later-level decision prefix is finishable or clearly terminal',()=>{
  let count=0;
  for(let i=6;i<G.levels.length;i++){
    const stack=[[]];
    while(stack.length){
      const path=stack.pop();
      const current=replay(i,path);
      count++;
      if(current.phase!=='ready'){
        assert(['win','lose'].includes(current.phase));
        continue;
      }
      const unused=current.pins.filter(p=>!p.removed&&!p.locked).map(p=>p.id);
      assert(unused.length,'no soft lock');
      assert(unused.includes(G.hintPin()));
      assert(unused.includes(G.hintPin(true)));
      for(const id of unused)stack.push([...path,id]);
    }
  }
  assert(count>=140,`checked ${count} prefixes`);
});
test('optional bonus pitfalls do not block crossing, and either side may land first',()=>{
  checkWin(replay(3,['lift','right','left']),0);
  checkWin(replay(4,['feather','tray','deck']),0);
  checkWin(replay(5,['brace','lift','deck']),1);
  checkWin(replay(7,['float','right','left']),0);
  checkWin(replay(9,['rightLift','right','leftLift','left']),0);
  checkWin(replay(10,['hoist','float','deck']),0);
  checkWin(replay(10,['float','hoist','deck']),1);
  checkWin(replay(13,['leftFeather','tray','rightFeather','deck']),1);
  checkWin(replay(13,['tray','rightFeather','leftFeather','deck']),2);
  checkWin(replay(14,['gate','lift','brace','right','left']),1);
});
test('reset cancels in-flight animations and cleans action state for replay-based undo',()=>{
  G.load(14);
  assert(G.tap('gate'));
  G.tick(.2);
  assert(G.load(14));
  G.tick(12);
  assert.equal(G.state.phase,'ready');
  assert.equal(G.state.moves,0);
  assert.deepEqual(G.state.history,[]);
  assert(G.state.pins.every(p=>!p.removed));
  replay(14,['gate','lift']);
  assert.equal(G.hintPin(true),'brace');
});


test('final level: shelf contact, uninterrupted descent, and pickup at the crossing',()=>{
  for(const dt of [1/120,1/60,.11]) {
    const {feathers,parts}=replay(14,['gate','lift'],dt);
    const f=feathers[0],shelf=parts.find(p=>p.id==='featherShelf'),brace=parts.find(p=>p.id==='brace');
    const at=id=>parts.find(p=>p.id===id);
    assert.equal(f.restingOn,'featherShelf');
    assert.equal(f.physical,true);
    assert.equal(f.y+11,shelf.y-shelf.width/2,'feather stem sits on the shelf');
    assert(f.x>shelf.x-shelf.length&&f.x<shelf.x);
    assert.equal(f.ready,undefined,'lifting the pier must not release the feather');
    assert.equal(G.state.bonus,0);
    assert(G.tap('brace'));
    let previous=f.y, falling=0;
    for(let i=0;i<500&&G.state.phase==='animating';i++) {
      G.tick(dt);
      assert(f.y>=previous,'feather must never jump upwards');
      if(f.y>previous) {
        falling++;
        assert(shelf.x-shelf.length>f.x+8,'shelf clears the whole feather before it falls');
      }
      assert(f.y<=302+1e-9,'feather must not go through the crossing');
      assert.equal(G.state.bonus,0,'no pickup before a bird crosses');
      previous=f.y;
    }
    assert(falling>=2);
    assert.equal(f.restingOn,'brace');
    assert.equal(f.y+11,brace.y-brace.width/2);
    assert.equal(brace.y+brace.width/2,at('pier').y-at('pier').length/2,'pier contacts underside of crossing');
    assert.equal(at('right').x-at('right').length,brace.x,'right wing meets the section');
    assert.equal(at('left').x+at('left').length,brace.x-brace.length,'left wing meets the section');
    let pickup=0;
    G.onEvent=e=>{
      if(e.type==='feather'){
        pickup++;
        const bird=G.state.birds.find(b=>b.x>=f.x&&Math.abs(b.y-f.y)<=13);
        assert(bird,'bird reaches the feather before collecting it');
        assert.equal(e.x,f.x);assert.equal(e.y,f.y);
      }
    };
    assert(G.tap('right'));settle(dt);assert.equal(pickup,0);
    assert(G.tap('left'));settle(dt);assert.equal(pickup,1);
    checkWin(G.state,1);
    G.onEvent=null;
  }
});
test('final level: mutually exclusive supports reject mixed inputs without burning a move',()=>{
  const fast=replay(14,['gate','float']);
  const feather=fast.feathers[0];
  for(const id of ['lift','brace']){
    assert(fast.pins.find(p=>p.id===id).locked);
    assert(!G.tap(id));
  }
  assert.equal(fast.moves,2);
  assert.deepEqual(fast.history,['gate','float']);
  assert.equal(feather.restingOn,'featherShelf');
  assert.equal(feather.y,252);
  for(const id of ['left','right']){assert(G.tap(id));settle();}
  checkWin(fast,0);
  assert.equal(fast.parts.find(p=>p.id==='brace').x,320,'unused section remains stowed');
  const old=replay(14,['gate','lift']);
  assert(old.pins.find(p=>p.id==='float').locked);
  assert(!G.tap('float'));
  assert.equal(old.moves,2);
  assert.equal(G.hintPin(true),'brace');
  for(const id of ['brace','left','right']){assert(G.tap(id));settle();}
  checkWin(old,1);
  assert.equal(old.parts.find(p=>p.id==='raft').y,405,'unused raft remains stowed');
});
