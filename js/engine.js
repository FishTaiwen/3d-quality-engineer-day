(function(root){
 'use strict';
 const D=root.QE3Data||require('./data.js');
 const normal=['trace','shipping','customer'];
 const endings={};
 for(const id of normal){
   endings[id+'-good']={title:{trace:'不是你記錯，是版本在漂移',shipping:'車晚一點，問題少一點',customer:'證據比承諾先到場'}[id],text:'你把問題、證據與責任窗口留下了。事情不必由一個人記住，才有機會不再重演。',route:id};
   endings[id+'-tired']={title:{trace:'序號找回來，你快找不到自己',shipping:'出貨完成，人還在運轉',customer:'客戶收到回覆，你收到明天'}[id],text:'群組說辛苦了，四個字很短，今晚很長。你穿過很多站點，沒有穿過自己的待辦。',route:id};
   endings[id+'-risk']={title:{trace:'箱子出去了，問題也出去了',shipping:'放行很快，回來也很快',customer:'原因先寄出，事實晚點補'}[id],text:'今天的流程跑完了，但幾個待確認被寫成了已確認。下一個工作日，會有人再問一次。',route:id};
 }
 Object.assign(endings,{
  'brand-hero':{title:'品牌很滿意，你很不見',text:'服務沒有範圍，承諾沒有期限。客戶沒有再下單，今晚卻繼續下單給你。',route:'brand'},
  'brand-refuse':{title:'回覆已寄出，業務正在打電話',text:'過保不是異常原因。你直接關上對話，留下了尚未確認的事實與歷史承諾。',route:'brand'},
  'brand-scope':{title:'服務可以延續，範圍必須確認',text:'證據、服務範圍、例外核准與原案交接都有人接。品牌關係被留下，你也被留下。',route:'brand'},
  'brand-order':{title:'未來訂單，請提供單號',text:'你把商務機會、支援成本與核准責任接進制度。至少公司開始知道，每一次「先幫忙」到底花了誰的晚上。',route:'brand',hidden:true}
 });
 function newGame(seed=Date.now(),completed=[]){
  let n=Number(seed)>>>0; const rng=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n;};
  const pool=normal.filter(k=>!completed.includes(k));const picks=pool.length?pool:normal;
  const route=picks[rng()%picks.length];const ids=D.random.map(e=>e.id);
  const randomIds=[ids.splice(rng()%ids.length,1)[0],ids.splice(rng()%ids.length,1)[0]];
  return {version:1,seed,route,initialRoute:route,step:0,night:-1,stats:{quality:70,stress:24,credit:50,downtime:0,overtime:0,changes:0,changingMinutes:0},role:'QE',unlocked:['QE'],permanent:['QE'],assignments:{},quests:{supplier:0,trace:0,boundary:0},flags:{},randomIds,randomUsed:0,urgent:null,side:null,position:{x:-17,z:12},outfit:'work',gateOpen:false,phase:'event',result:null,log:[],paused:null,ended:false,ending:null};
 }
 function event(s){
  if(s.phase==='result'&&s.result?.event)return s.result.event;
  if(s.side) return {...D.quests[s.side].events[s.quests[s.side]],kind:'side',key:s.side};
  if(s.urgent) return {...D.random.find(e=>e.id===s.urgent),kind:'random'};
  if(s.night>=0) return {...D.night[s.night],kind:'night'};
  return {...D.routes[s.route].events[s.step],kind:'main'};
 }
 function assign(s){const r=event(s).role;if(!s.unlocked.includes(r))s.unlocked.push(r);s.role=r;}
 function enter(s){s.phase='event';s.result=null;assign(s);}
 function switchRole(s,r){if(s.phase!=='event'||!s.unlocked.includes(r)||s.ended)return false;s.role=r;return true;}
 function beginSide(s,key){if(s.phase!=='event'||s.ended||s.night>=0||s.side||!Object.hasOwn(D.quests,key)||s.quests[key]>=3)return false;s.side=key;assign(s);return true;}
 function cancelSide(s){if(s.side&&s.phase==='event'){s.side=null;assign(s);return true;}return false;}
 function effects(s,opt){
  const d={...opt.delta};
  if(s.role===event(s).role){d.quality=(d.quality||0)+2;d.credit=(d.credit||0)+2;d.stress=(d.stress||0)-2;}
  if(s.side&&s.quests[s.side]===2)for(const [k,v]of Object.entries(D.quests[s.side].reward))d[k]=(d[k]||0)+v;
  return d;
 }
 function apply(s,d){const actual={};for(const [k,v]of Object.entries(d)){const b=s.stats[k];s.stats[k]=Math.max(0,['quality','stress','credit'].includes(k)?Math.min(100,b+v):b+v);if(s.stats[k]!==b)actual[k]=s.stats[k]-b;}return actual;}
 function preview(s,opt){const c={...s,stats:{...s.stats}};return apply(c,effects(s,opt));}
 function choose(s,index){
  if(s.ended||s.phase!=='event')return false;
  const ev=event(s),opt=ev.options[index];if(!opt||(opt.requiredRole&&s.role!==opt.requiredRole))return false;
  const delta=apply(s,effects(s,opt));
  if(opt.flag)s.flags[opt.flag]=true;if(opt.flag2)s.flags[opt.flag2]=true;
  if([opt.flag,opt.flag2].some(f=>['scope','professional'].includes(f)))s.flags.unlimited=false;
  let note='';if(s.side){s.quests[s.side]++;note=s.quests[s.side]===3?'支線完成：'+D.quests[s.side].name:'支線推進：'+D.quests[s.side].name;}
  s.assignments[ev.role]=(s.assignments[ev.role]||0)+1;
  if(s.assignments[ev.role]>=2&&!s.permanent.includes(ev.role)){s.permanent.push(ev.role);note+=(note?'\n':'')+ev.role+' 已取得永久資格。薪資系統：謝謝你的努力。';}
  s.result={text:opt.text,note,delta,event:ev,kind:ev.kind,finish:!!opt.finish,night:!!opt.night,trigger:opt.trigger||null};
  s.log.push({time:time(s),station:ev.station,role:s.role,title:ev.title,choice:opt.label,text:opt.text,delta});s.log=s.log.slice(-120);s.phase='result';return true;
 }
 function determine(s){
  if(s.route==='brand'){
    if(s.flags.refused)return 'brand-refuse';
    if(s.flags.history&&s.flags.scope&&s.flags.brandEvidence&&s.flags.professional&&s.flags.originalHanded&&!s.flags.unlimited&&s.stats.quality>=65){return s.flags.orderEvidence?'brand-order':'brand-scope';}
    return 'brand-hero';
  }
  if(s.stats.quality<50)return s.route+'-risk';
  if(s.stats.stress>=75||s.stats.overtime>=180)return s.route+'-tired';
  if(s.stats.quality>=75&&s.stats.credit>=60&&(s.flags.evidence||s.flags.archive)&&s.flags.handoff)return s.route+'-good';
  return s.route+'-risk';
 }
 function advance(s){
  if(s.phase!=='result'||s.ended)return false;
  const r=s.result;
  if(r.finish){s.ended=true;s.ending=determine(s);s.phase='ended';return true;}
  if(r.kind==='side'){s.side=null;enter(s);return true;}
  if(r.kind==='random'){s.urgent=null;enter(s);return true;}
  if(r.trigger==='brand'){
    s.paused={route:s.route,step:s.step+1,title:D.routes[s.route].name,time:time(s)};s.route='brand';s.step=0;s.flags.hidden=true;enter(s);return true;
  }
  if(r.night){s.night=0;s.outfit='work';s.gateOpen=false;s.position={x:0,z:4};enter(s);return true;}
  if(s.night>=0)s.night++;else s.step++;
  if(s.night<0&&[3,6].includes(s.step)&&s.randomUsed<2&&!s.flags['insert'+s.step]){s.flags['insert'+s.step]=true;s.urgent=s.randomIds[s.randomUsed++];}
  enter(s);return true;
 }
 function changeOutfit(s,clean){
  if(s.ended||s.night>=0)return false;
  if(clean&&s.outfit!=='clean'){s.outfit='clean';s.gateOpen=true;s.flags.inClean=false;const delta=apply(s,{stress:1,changes:1,changingMinutes:3});s.log.push({time:time(s),station:'gate',role:s.role,title:'更換無塵服',choice:'刷卡、換裝與開門',text:'衣服換好了，責任沒有換掉。',delta});s.log=s.log.slice(-120);return true;}
  if(!clean){s.outfit='work';s.gateOpen=false;s.flags.inClean=false;return true;}return false;
 }
 function time(s){if(s.night>=0)return ['19:10','21:40','23:58'][s.night];const count=D.routes[s.route].events.length;const start=s.route==='brand'&&s.paused?.time?s.paused.time.split(':').reduce((a,b,i)=>a+Number(b)*(i===0?60:1),0):510;const min=start+Math.round(s.step/Math.max(1,count-1)*(1080-start));return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`;}
 function valid(s){
  if(!s||s.version!==1||!Object.hasOwn(D.routes,s.route)||!normal.includes(s.initialRoute)||!Number.isInteger(s.step)||s.step<0||s.step>=D.routes[s.route].events.length||!Number.isInteger(s.night)||s.night< -1||s.night>2)return false;
  if(!['event','result','ended'].includes(s.phase)||typeof s.ended!=='boolean'||s.ended!==(s.phase==='ended')||(s.ended&&!Object.hasOwn(endings,s.ending)))return false;
  if(!s.stats||!Object.keys(newGame(1).stats).every(k=>Number.isFinite(s.stats[k])&&s.stats[k]>=0&&(!['quality','stress','credit'].includes(k)||s.stats[k]<=100)))return false;
  if(!s.quests||!Object.keys(D.quests).every(k=>Number.isInteger(s.quests[k])&&s.quests[k]>=0&&s.quests[k]<=3))return false;
  if(!['unlocked','permanent'].every(k=>Array.isArray(s[k])&&s[k].includes('QE')&&s[k].every(r=>Object.hasOwn(D.roles,r)))||!s.unlocked.includes(s.role))return false;
  if(!s.flags||typeof s.flags!=='object'||!s.assignments||typeof s.assignments!=='object')return false;
  if(!s.position||!Number.isFinite(s.position.x)||!Number.isFinite(s.position.z)||Math.abs(s.position.x)>25||Math.abs(s.position.z)>17||!['work','clean'].includes(s.outfit)||typeof s.gateOpen!=='boolean')return false;
  if(!Array.isArray(s.randomIds)||s.randomIds.length!==2||new Set(s.randomIds).size!==2||!s.randomIds.every(id=>D.random.some(e=>e.id===id))||!Number.isInteger(s.randomUsed)||s.randomUsed<0||s.randomUsed>2)return false;
  if(s.urgent&&!D.random.some(e=>e.id===s.urgent))return false;
  if(s.side&&(!Object.hasOwn(D.quests,s.side)||s.quests[s.side]>=3&&s.phase!=='result'))return false;
  if(s.phase==='result'&&(!s.result||typeof s.result.text!=='string'||!s.result.delta))return false;
  if(s.phase==='result'){
   const ev=s.result.event,known=[...Object.values(D.routes).flatMap(r=>r.events),...Object.values(D.quests).flatMap(q=>q.events),...D.random,...D.night];
   if(!ev||!known.some(k=>k.id===ev.id&&k.station===ev.station&&k.role===ev.role)||!['main','side','random','night'].includes(ev.kind)||typeof ev.title!=='string'||typeof ev.body!=='string'||!Array.isArray(ev.options))return false;
   if(!ev.options.every(o=>o&&typeof o.label==='string'&&typeof o.text==='string'&&o.delta&&Object.entries(o.delta).every(([k,v])=>Object.hasOwn(s.stats,k)&&Number.isFinite(v))))return false;
  }
  if(!Array.isArray(s.log)||s.log.length>150||!s.log.every(l=>l&&typeof l.title==='string'&&typeof l.text==='string'&&l.delta&&typeof l.delta==='object'))return false;
  return true;
 }
 root.QE3Engine={newGame,event,assign,enter,switchRole,beginSide,cancelSide,effects,preview,choose,advance,changeOutfit,determine,time,valid,endings,normal};
 if(typeof module!=='undefined')module.exports=root.QE3Engine;
})(typeof window!=='undefined'?window:globalThis);
