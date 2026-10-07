import {FactoryWorld} from './world.js';
const D=window.QE3Data,E=window.QE3Engine,N=window.QE3Nav;
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={quality:'品質',stress:'壓力',credit:'信用',downtime:'停線',overtime:'加班',changes:'換裝',changingMinutes:'更衣時間'};
const SAVE='qe3d-workday-v1',META='qe3d-collection-v1';let s,meta={endings:[],completed:[]},world,storageOK=true,started=false,nearest=null,toastTimer,saveTimer;
try{const raw=JSON.parse(localStorage.getItem(SAVE));if(E.valid(raw))s=raw;const m=JSON.parse(localStorage.getItem(META));if(m&&Array.isArray(m.endings)&&Array.isArray(m.completed))meta={endings:[...new Set(m.endings.filter(id=>Object.hasOwn(E.endings,id)))],completed:[...new Set(m.completed.filter(id=>E.normal.includes(id)))]};}catch(_){storageOK=false;}
if(!s){s=E.newGame(Date.now(),meta.completed);E.assign(s);}
if(s.outfit==='work'&&N.inside(s.position.x,s.position.z)){s.position={x:9,z:-6};s.gateOpen=false;}
if(N.blocked(s.position.x,s.position.z,s.night>=0?'home':'factory',s.gateOpen))s.position=s.night>=0?{x:0,z:4}:{x:-17,z:12};
function save(){try{localStorage.setItem(SAVE,JSON.stringify(s));localStorage.setItem(META,JSON.stringify(meta));storageOK=true;}catch(_){storageOK=false;}$('save-status').textContent=storageOK?'本機已存檔':'無法存檔';}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4200);}
function dialog(title,body,tag='第零製造所 / 工作日紀錄'){$('dialog-title').textContent=title;$('dialog-meta').textContent=tag;$('dialog-content').innerHTML=body;if(!$('dialog').open)$('dialog').showModal();world?.stop();}
function close(){$('dialog').close();}
function effectHTML(delta){return Object.entries(delta).filter(([,v])=>v).map(([k,v])=>`<span class="${['downtime','overtime','changes','changingMinutes'].includes(k)?'delta-cost':(k==='stress'?v<0:v>0)?'delta-good':'delta-bad'}">${esc(labels[k]||k)} ${v>0?'+':''}${esc(v)}${['downtime','overtime','changingMinutes'].includes(k)?' 分':k==='changes'?' 次':''}</span>`).join('')||'<span>數值不變</span>';}
function render(){
 const ev=E.event(s),route=D.routes[s.route];
 $('clock').textContent=s.ended?'結案':E.time(s);$('shift-tag').textContent=s.ended?'工作日完成':s.night>=0?'下班後繼續上班':s.route==='brand'?'CQE 特殊任務':'日班 · 系統在線';
 $('stats').innerHTML=[['quality','#527647'],['stress','#b16c61'],['credit','#568289'],['downtime','#a3844e'],['overtime','#957054']].map(([k,c])=>`<div class="stat" style="--stat-color:${c}"><span>${labels[k]}</span><b>${s.stats[k]}</b><small>${['downtime','overtime'].includes(k)?'分':'/100'}</small><div class="stat-line"><i style="width:${['downtime','overtime'].includes(k)?Math.min(100,s.stats[k]/3):s.stats[k]}%"></i></div></div>`).join('');
 $('route-code').textContent=s.night>=0?'NIGHT SUPPORT':route.code;$('route-name').textContent=(route.hidden?'◇ 隱藏主線 · ':'主線 · ')+route.name;
 $('mission-title').textContent=s.ended?E.endings[s.ending].title:ev.title;$('mission-description').textContent=s.ended?'今日紀錄已結案。可以匯出報告，或再抽一次工作日。':ev.body;
 $('destination').textContent=s.ended?'今日結局':`${ev.kind==='side'?'支線':ev.kind==='random'?'隨機插單':'目的地'} / ${D.stations[ev.station].name}`;
 $('mission-progress').textContent=s.ended?`${meta.endings.length}/13 結局`:s.night>=0?`${s.night+1}/3 夜班`:ev.kind==='side'?`${s.quests[s.side]+1}/3`:ev.kind==='random'?'插單':`${s.step+1}/${route.events.length}`;
 $('guide').textContent=s.ended?'查看今日結局':s.phase==='result'?'查看已登錄處置':'帶我去 →';
 $('paused-case').hidden=!s.paused;$('paused-case').textContent=s.paused?`原案待交接：${s.paused.title}（第 ${s.paused.step+1} 個節點起）` : '';
 $('role-select').innerHTML=s.unlocked.map(r=>`<option value="${r}" ${s.role===r?'selected':''}>${r} · ${D.roles[r][0]}${s.permanent.includes(r)?' ◆':''}</option>`).join('');$('role-select').disabled=s.phase!=='event'||s.ended;
 $('role-status').textContent=`原職 QE · ${s.permanent.includes(s.role)?'永久資格':'代班資格'} · ${s.ended?'本輪結案':`本事件指定 ${ev.role}，相符時 +2品質 / +2信用 / -2壓力`}`;
 $('outfit-label').textContent=s.outfit==='clean'?'無塵服 / 已換裝':'工作服';$('outfit-icon').textContent=s.outfit==='clean'?'◈':'▥';$('outfit-count').textContent=`換裝 ${s.stats.changes} 次 · 更衣 ${s.stats.changingMinutes} 分`;
 $('side-list').innerHTML=Object.entries(D.quests).map(([k,q])=>`<button class="side-button" data-side="${k}" ${s.quests[k]>=3||s.night>=0||s.ended?'disabled':''}><span>${s.quests[k]===3?'✓':'◇'} ${q.name}</span><small>${s.quests[k]}/3</small></button>`).join('');
 $('side-list').querySelectorAll('[data-side]').forEach(b=>b.addEventListener('click',()=>{if(s.phase!=='event'){showResult();return;}const q=D.quests[b.dataset.side];world.navigate(q.events[s.quests[b.dataset.side]].station);if(innerWidth<720)toggleExplore(false);toast(`支線：${q.name}。到站後按 E 選擇支線處置。`);}));
 $('world-note').innerHTML=s.night>=0?'<span>HOME / NIGHT SUPPORT</span><b>公司現在在你家裡。</b>':'<span>第零製造所 / R-00</span><b>你的職稱只有一個，工作內容不是。</b>';
 world?.sync(s);world?.goal(s.ended?'exit':ev.station);
}
function showEvent(){
 const ev=E.event(s);if(s.phase==='result'){showResult();return;}if(s.ended){showEnding();return;}
 dialog(ev.title,`<p class="dialog-body">${esc(ev.body)}</p><div class="choice-list">${ev.options.map((o,i)=>`<button class="choice ${o.trigger?'secret-choice':''}" data-choice="${i}" ${o.requiredRole&&s.role!==o.requiredRole?'disabled':''}><span class="choice-label">${i+1}. ${esc(o.label)}</span><span class="choice-effects">${effectHTML(E.preview(s,o))}</span>${o.trigger?'<span class="choice-hint">◇ 查閱歷次承諾可能接管本工作日 · 限 CQE</span>':''}</button>`).join('')}</div><p class="dialog-small">影響已包含職能加成與上限。移動不扣工時，換裝與處置會留下成本。</p>`,`${ev.kind==='random'?'隨機插單':ev.kind==='side'?'支線':ev.kind==='night'?'夜間支援':s.route==='brand'?'隱藏主線':'主線'} / ${D.stations[ev.station].name} / ${s.role}`);
 $('dialog-content').querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{if(E.choose(s,Number(b.dataset.choice))){save();render();showResult();}}));
}
function showResult(){
 if(s.ended){showEnding();return;}const r=s.result;if(!r)return;
 dialog(r.trigger?'隱藏案件已浮上檯面。':r.finish?'今天可以交接了。':'處置已登錄。',`<p class="dialog-body">${esc(r.text)}</p><div class="result-delta">${effectHTML(r.delta)}</div>${r.note?`<div class="result-note">${esc(r.note)}</div>`:''}${r.trigger?'<div class="result-note">第四條主線將接管當天。原案、累積指標與未結事項都會保留。</div>':''}<button class="primary-button" id="next">${r.finish?'查看今日結局':r.trigger?'接下 CQE 特殊任務 →':r.night?'回家繼續上班 →':r.kind==='side'?'回到目前任務 →':'繼續工作日 →'}</button>`,'DISPOSITION / 處置紀錄');
 $('next').addEventListener('click',()=>{E.advance(s);close();if(s.ended){if(!meta.endings.includes(s.ending))meta.endings.push(s.ending);if(E.normal.includes(s.route)&&!meta.completed.includes(s.route))meta.completed.push(s.route);}save();render();if(s.ended)showEnding();else if(r.trigger)toast('CQE 特殊任務啟用。保固到期，品保仍有效。');else if(r.night)toast('你回家了。辦公室也跟著回家了。');else toast('下一個站點已標示。可以走過去，或點「帶我去」。');});
}
function gate(){
 if(s.outfit==='clean'){dialog('無塵服已穿好。','<p class="dialog-body">閘門已開啟。識別證、職能與待辦均保留。離開管制區時，會在通過閘門後換回工作服。</p><div class="dialog-actions"><button class="primary-button" id="enter-clean">前往液冷測試站</button></div>','管制區 / 換裝閘門');$('enter-clean').addEventListener('click',()=>{close();world.navigate('test');});return;}
 dialog('進入管制區，請更換無塵服。',`<p class="dialog-body">刷卡 → 換裝 → 開啟閘門。
衣服換好了，職務可能又多一個。

離場會換回工作服；下次進場仍需更衣。</p><div class="result-delta">${effectHTML({stress:s.stats.stress<100?1:0,changes:1,changingMinutes:3})}</div><button class="primary-button" id="dress">刷卡、換無塵服並進場</button>`,'液冷管制區 / 閘門');
 $('dress').addEventListener('click',()=>{E.changeOutfit(s,true);close();world.setOutfit(true);$('wardrobe-flash').classList.add('show');setTimeout(()=>$('wardrobe-flash').classList.remove('show'),1000);save();render();world.navigate('test');toast('已更換無塵服。識別證與目前職能保留。');});
}
function interact(){
 if(!started)return;if(s.ended){showEnding();return;}if(s.phase==='result'){showResult();return;}if(!nearest){toast('先走近站點，再按 E 互動。');return;}
 if(nearest==='gate'){gate();return;}
 const ev=E.event(s);const side=Object.entries(D.quests).filter(([k,q])=>s.quests[k]<3&&q.events[s.quests[k]].station===nearest&&s.night<0);
 const main=ev.station===nearest;
 if(main&&side.length===0){showEvent();return;}
 const st=D.stations[nearest];
 dialog(st.name,`<p class="dialog-body">${esc(st.hint)}\n窗口：${esc(st.npc)}</p><div class="station-menu">${main?'<button id="do-main">! 處理目前任務</button>':''}${side.map(([k,q])=>`<button data-side-do="${k}">◇ ${q.name} · ${s.quests[k]+1}/3</button>`).join('')}${s.side?'<button id="cancel-side">先回原本任務</button>':''}${!main&&!side.length?'<p class="dialog-small">這站目前沒有你的待辦。可以自由探索，任務面板會指出下一個站點。</p>':''}</div>`,'現場 / '+st.npc);
 if(main)$('do-main').addEventListener('click',showEvent);
 $('dialog-content').querySelectorAll('[data-side-do]').forEach(b=>b.addEventListener('click',()=>{if(s.side)E.cancelSide(s);if(E.beginSide(s,b.dataset.sideDo)){save();render();showEvent();}}));
 if($('cancel-side'))$('cancel-side').addEventListener('click',()=>{E.cancelSide(s);close();save();render();});
}
function showEnding(){const end=E.endings[s.ending];dialog(end.title,`<p class="dialog-body">${esc(end.text)}</p>${s.paused?`<div class="result-note">原案：${esc(s.paused.title)} · ${s.flags.originalHanded?'已留下交接':'未完成交接'}。成本與未結事項沒有因接管消失。</div>`:''}<div class="ending-summary">${Object.entries(s.stats).map(([k,v])=>`<div>${labels[k]}<b>${v}${['downtime','overtime','changingMinutes'].includes(k)?' 分':k==='changes'?' 次':''}</b></div>`).join('')}<div>完成支線<b>${Object.values(s.quests).filter(v=>v===3).length}/3</b></div></div><p class="dialog-small">已收藏 ${meta.endings.length}/13 結局。停線是查證成本，不單獨決定成敗。新局優先抽尚未完成的普通主線。</p><div class="dialog-actions"><button class="primary-button" id="again">再過一天</button><button id="report-end">匯出交接報告</button></div>`,(end.hidden?'◇ 隱藏結局':'工作日結算')+' / '+D.routes[s.route].name);$('again').addEventListener('click',restartConfirm);$('report-end').addEventListener('click',report);}
function restartConfirm(){dialog('重新分配工作日？','<p class="dialog-body">目前工作日會被新局取代，結局收藏與已完成路線會保留。原版遊戲存檔不受影響。</p><div class="dialog-actions"><button class="primary-button" id="confirm-new">抽下一個工作日</button></div>','NEW SHIFT / 重新派任');$('confirm-new').addEventListener('click',()=>{s=E.newGame(Date.now(),meta.completed);E.assign(s);world.state=s;world.setMode('factory');world.stop();close();save();render();toast('今日派任：'+D.routes[s.route].name);});}
function collection(){dialog('工作日檔案 · '+meta.endings.length+'/13',`<p class="dialog-small">普通主線各三種結局。第四條必須在 CQE 案件中查閱歷次承諾才能啟動。</p>${Object.entries(E.endings).map(([k,v])=>`<div class="collection-row ${meta.endings.includes(k)?'found':''}"><h3>${meta.endings.includes(k)?'✓ '+esc(v.title):v.route==='brand'?'◇ 未發現的特殊任務結局':'□ '+D.routes[v.route].name+' · 尚未完成'}</h3><p>${meta.endings.includes(k)?esc(v.text):'換一種處置、證據與交接，看看這一天的樣子。'}</p></div>`).join('')}`,'COLLECTION / 結局收藏');}
function logView(){dialog('交接紀錄',`<button class="primary-button" id="report-log">匯出整份紀錄</button>${[...s.log].reverse().map(l=>`<div class="log-row"><b>${esc(l.time)} [${esc(l.role)}] ${esc(l.choice)}</b><small>${esc(l.text)}</small></div>`).join('')||'<p class="dialog-small">尚無處置紀錄。</p>'}`,'SHIFT LOG / 包含換裝與原案紀錄');$('report-log').addEventListener('click',report);}
function report(){const lines=['《品保工程師的一天 3D》｜虛構工作日交接報告',`初始主線：${D.routes[s.initialRoute].name}`,`當前主線：${D.routes[s.route].name}`,`種子：${s.seed}`,`結局：${s.ended?E.endings[s.ending].title:'尚未結案'}`,s.paused?`原案：${s.paused.title}；${s.flags.originalHanded?'已交接':'仍待交接'}`:'',Object.entries(s.stats).map(([k,v])=>`${labels[k]} ${v}`).join(' / '),`永久資格：${s.permanent.join('、')}`,'',...Object.entries(D.quests).map(([k,q])=>`${q.name} ${s.quests[k]}/3`),'',...s.log.map(l=>`${l.time} [${l.role}] ${l.title}\n處置：${l.choice}\n後果：${l.text}\n`),'全部情節、組織、品牌、角色與數據皆為虛構。'];const content=lines.join('\n'),url=URL.createObjectURL(new Blob(['\uFEFF'+content],{type:'text/plain;charset=utf-8'}));dialog('交接報告已準備好',`<p class="dialog-small">可以下載，也可以直接選取文字複製。</p><textarea class="report-text" aria-label="完整交接報告" readonly>${esc(content)}</textarea><a class="primary-button" href="${url}" download="3D-quality-engineer-day-交接報告.txt">↓ 下載文字報告</a>`,'EXPORT / 無外部傳輸');setTimeout(()=>URL.revokeObjectURL(url),300000);}
function help(){dialog('怎麼走過這一天',`<p class="dialog-body">WASD／方向鍵：移動（方向與畫面一致）。
Shift：快走。滑鼠點地板：避開設備尋路。
走近站點按 E 或「互動」。任務面板「帶我去」會沿路走到目的地。

液冷區：先到閘門換無塵服。離開會換回工作服，下次再入場需重新換裝。

每輪抽三條普通主線之一。CQE 查閱已過保、無新單、重複支援的歷次承諾，可能啟動第四條隱藏主線。

左下「支線與地圖」可導航三條支線。主線、插單、支線均需到現場處置。

職能與指定事件相符：品質 +2、信用 +2、壓力 -2。處理兩起同職能指定事件，取得本輪永久資格。

18:00 可下班；接電話會進入家中三個夜班事件。移動不扣分，更衣與處置會留下成本。</p><p class="dialog-small">存檔保留在同一瀏覽器與網址。遊戲需要 WebGL 2；手機可使用左下方向按鈕。資料與判定皆為虛構。</p>`,'CONTROLS / 遊玩說明');}
function toggleExplore(open){$('explore-content').hidden=!open;$('toggle-explore').querySelector('span').textContent=open?'收合':'展開';$('toggle-explore').parentElement.classList.toggle('open',open);}
function minimap(pos,mode){if($('explore-content').hidden)return;const canvas=$('minimap'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#dbe3d4';ctx.fillRect(0,0,w,h);const bx=mode==='home'?11:25,bz=mode==='home'?8:17;const p=(x,z)=>({x:(x/bx+1)*w/2,y:(z/bz+1)*h/2});ctx.fillStyle='#9fb4a2';for(const r of mode==='home'?N.home:N.factory){const q=p(r.x-r.w/2,r.z-r.d/2);ctx.fillRect(q.x,q.y,r.w/bx*w/2,r.d/bz*h/2);}for(const [id,st]of Object.entries(D.stations)){if((id==='home')!==(mode==='home'))continue;const q=p(st.x,st.z);ctx.fillStyle=id===E.event(s).station?'#b87535':'#6d8562';ctx.fillRect(q.x-2,q.y-2,4,4);}const q=p(pos.x,pos.z);ctx.fillStyle='#243f34';ctx.beginPath();ctx.arc(q.x,q.y,4,0,Math.PI*2);ctx.fill();}
try{world=new FactoryWorld($('scene'),$('labels'),s,{isIntro:()=>!started,canMove:()=>started&&!$('dialog').open&&s.phase==='event'&&!s.ended,interact,notice:toast,exitClean:()=>{E.changeOutfit(s,false);save();render();toast('已離開管制區，換回工作服。下次入場仍需更衣。');},tick:(id,pos,mode)=>{nearest=id;$('interact').disabled=!started||(!id&&s.phase==='event'&&!s.ended);$('nearby-label').textContent=s.ended?'工作日已結案':s.phase==='result'?'處置已登錄，請接續':id?D.stations[id].name:'走近站點與窗口';$('interact').dataset.ready=id?'true':'false';minimap(pos,mode);}});
 $('start').disabled=false;$('start').textContent=s.log.length||s.ended?'接續我的工作日':'刷卡上班 →';$('load-message').textContent='本機 3D 資產已載入 · 無外部 CDN';render();save();
}catch(err){$('load-message').textContent='3D 場景無法啟動。請確認瀏覽器支援 WebGL 2，並從網頁伺服器或 GitHub Pages 開啟。';console.error('3D initialization failed',err);}
$('start').addEventListener('click',()=>{if(!world)return;started=true;$('intro').hidden=true;document.body.classList.remove('preflight');render();if(s.ended)showEnding();else if(s.phase==='result')showResult();else toast('今日派任：'+D.routes[s.route].name+'。走近辦公桌，或點「帶我去」。');saveTimer=setInterval(()=>{if(started)save();},2000);});
$('guide').addEventListener('click',()=>{if(s.ended)showEnding();else if(s.phase==='result')showResult();else world?.navigate(E.event(s).station);});$('interact').addEventListener('click',interact);$('close-dialog').addEventListener('click',close);
$('role-select').addEventListener('change',ev=>{if(E.switchRole(s,ev.target.value)){save();render();toast('已切換 '+s.role);}});
$('help').addEventListener('click',help);$('archive').addEventListener('click',collection);$('restart').addEventListener('click',restartConfirm);$('logs').addEventListener('click',logView);$('toggle-explore').addEventListener('click',()=>toggleExplore($('explore-content').hidden));
$('toggle-mission').addEventListener('click',()=>{$('mission-content').hidden=!$('mission-content').hidden;$('toggle-mission').textContent=$('mission-content').hidden?'+':'−';});
$('dpad').querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',ev=>{ev.preventDefault();b.setPointerCapture(ev.pointerId);world?.touch(b.dataset.key,true);});for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>world?.touch(b.dataset.key,false));});
window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden){world?.stop();save();}});
