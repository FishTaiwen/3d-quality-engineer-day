const assert=require('node:assert/strict');
const D=require('../js/data.js'),E=require('../js/engine.js'),N=require('../js/navigation.js');
function seeded(route){for(let seed=1;seed<100;seed++){const s=E.newGame(seed);if(s.route===route){E.assign(s);return s;}}throw Error('route missing');}
function play(s,pick){let steps=0;while(!s.ended){assert.ok(E.valid(s),'valid before '+E.event(s).id);const ev=E.event(s),index=pick(ev,s);assert.ok(E.choose(s,index),'choose '+ev.id);assert.ok(!E.choose(s,index),'double submission');assert.ok(E.valid(s),'valid result '+ev.id);E.advance(s);assert.ok(++steps<40);}assert.ok(E.valid(s));return s;}
for(const route of E.normal){const s=play(seeded(route),()=>0);assert.equal(s.ending,route+'-good');assert.equal(s.randomUsed,2);assert.equal(s.route,route);}
const reached=new Set();
for(const route of E.normal){
 reached.add(play(seeded(route),()=>0).ending);
 reached.add(play(seeded(route),ev=>ev.id==='off'||ev.kind==='night'?1:0).ending);
 reached.add(play(seeded(route),ev=>ev.options.some(o=>o.trigger)?0:ev.options.length-1).ending);
}
const hidden=play(seeded('trace'),ev=>ev.options.some(o=>o.trigger)?ev.options.findIndex(o=>o.trigger):ev.id==='brand-rd'?1:0);
assert.equal(hidden.ending,'brand-order');assert.equal(hidden.paused.route,'trace');assert.ok(hidden.flags.originalHanded);assert.ok(hidden.stats.downtime>0);assert.equal(hidden.randomUsed,2);
const refuse=play(seeded('customer'),ev=>ev.options.some(o=>o.trigger)?1:ev.id==='brand-reply'?1:0);assert.equal(refuse.ending,'brand-refuse');
const reused=play(seeded('trace'),ev=>ev.options.some(o=>o.trigger)?1:ev.id==='brand-test'?1:0);assert.equal(reused.ending,'brand-hero','original evidence cannot replace new brand investigation');
const roleGuard=seeded('customer');E.choose(roleGuard,0);E.advance(roleGuard);E.switchRole(roleGuard,'QE');assert.equal(E.choose(roleGuard,1),false,'CQE trigger requires CQE role');E.switchRole(roleGuard,'CQE');assert.ok(E.choose(roleGuard,1));
const night=play(seeded('shipping'),ev=>ev.id==='off'?1:0);assert.equal(night.night,2);assert.ok(night.stats.overtime>0);assert.ok(night.permanent.includes('SQE')&&night.permanent.includes('CQE'));
assert.equal(N.blocked(night.position.x,night.position.z,'home'),false,'home spawn is not inside sofa');assert.ok(N.path(night.position,D.stations.home,'home').length>0);
const side=seeded('trace');const primary=E.event(side).id;
for(const key of Object.keys(D.quests)){for(let i=0;i<3;i++){assert.ok(E.beginSide(side,key));assert.equal(E.event(side).kind,'side');assert.ok(E.choose(side,0));assert.equal(E.event(side).id,D.quests[key].events[i].id);E.advance(side);assert.equal(E.event(side).id,primary);}assert.equal(side.quests[key],3);assert.equal(E.beginSide(side,key),false);}
assert.deepEqual(E.newGame(99).randomIds,E.newGame(99).randomIds);
for(let i=0;i<30;i++)assert.equal(E.newGame(i,['trace','shipping']).route,'customer');
const gate=seeded('trace');assert.equal(N.path({x:9,z:-6},D.stations.test,'factory',false).length,0);assert.ok(N.path({x:9,z:-6},D.stations.test,'factory',true).length>0);E.changeOutfit(gate,true);assert.equal(gate.outfit,'clean');assert.equal(gate.stats.changes,1);E.changeOutfit(gate,true);assert.equal(gate.stats.changes,1);E.changeOutfit(gate,false);assert.equal(gate.outfit,'work');assert.equal(gate.gateOpen,false);
for(const [id,st]of Object.entries(D.stations)){if(id==='home')continue;assert.ok(!N.blocked(st.x,st.z,'factory',true),'station accessible '+id);assert.ok(N.path({x:-17,z:12},st,'factory',true).length>0,'path '+id);}
const invalid=JSON.parse(JSON.stringify(gate));invalid.randomIds=['oops','oops'];assert.equal(E.valid(invalid),false);assert.equal(E.valid({version:1}),false);
const badSide={...gate,side:'__proto__'},badRoute={...gate,route:'__proto__'};assert.equal(E.valid(badSide),false);assert.equal(E.valid(badRoute),false);
let rng=31957;reached.add(hidden.ending);reached.add(refuse.ending);
for(let i=0;i<5000;i++){const s=E.newGame(i);E.assign(s);const done=play(s,ev=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return (rng>>>8)%ev.options.length;});reached.add(done.ending);}
assert.deepEqual([...reached].sort(),Object.keys(E.endings).sort(),'13 endings reachable');
console.log('PASS: 5,000 simulated workdays; 3 random routes; hidden CQE takeover; 13 endings; 3 side quests; 2 random jobs; role mastery; home overtime; gate collision and navigation to every station.');
