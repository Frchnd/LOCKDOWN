(()=>{
'use strict';
const $=s=>document.querySelector(s); const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v)); const clone=o=>JSON.parse(JSON.stringify(o));
const SAVE='lockdown_save'; const SETTINGS='lockdown_settings';
const DEFAULT_SETTINGS={sfx:true,ambience:true,vibration:true,master:72,sfxVol:82,ambienceVol:46};
const BASE={
 day:1,hour:7,health:100,hunger:10,thirst:13,fatigue:18,morale:72,radiation:4,power:81,integrity:100,filters:2,scrap:6,
 meta:{playerName:'PENGHUNI 7B',level:null,location:'Bunker 7B',lastSavedAt:null},
 items:{foods:{snack:{name:'Snack Bar',qty:2,hunger:-12,morale:2},can:{name:'Makanan Kaleng',qty:3,hunger:-28,thirst:4,morale:1}},drinks:{water:{name:'Air Mineral',qty:4,thirst:-28},coffee:{name:'Kopi',qty:1,thirst:-8,fatigue:-18,morale:2}},meds:{med:{name:'Obat Darurat',qty:2}},fuel:{fuel:{name:'Fuel',qty:3}}},
 upgrades:{generator:1,medis:1,kasur:1,keamanan:1,workbench:1}, settings:clone(DEFAULT_SETTINGS), survivors:[], relations:{tension:0,lastConflictDay:0},
 world:{scoutedDay:0,visited:[],unlocked:['house','market','clinic','apartment','gas','fire'],conditionIndex:0},
 onboarding:0,dailyObjectives:[],objectiveRewardClaimed:false,story:{prologueDone:false,night1:false,echoResponse:null,echoContact:false,relayUnlocked:false,relayRecovered:false,havenChoice:null,havenEvidence:0,day5:false,day6:false,finaleChoice:null,chapterComplete:false,depotVisited:false,transmissions:0,radioArchive:[]},
 progression:{mainStage:1},flags:{coffeeCrashUntil:0,lastRandomEventDay:0,lastRandomEventHour:-1,mayaOffered:false,rakaOffered:false},logs:[],lastThreat:null
};
const WORLD=[
 {name:'Udara Stabil',rad:0,fatigue:0,thirst:0},{name:'Debu Radioaktif',rad:3,fatigue:.25,thirst:0},{name:'Jendela Aman',rad:-3,fatigue:-.2,thirst:0},{name:'Panas Kering',rad:1,fatigue:.35,thirst:1},{name:'Badai Abu',rad:5,fatigue:.65,thirst:.35}
];
const LOCS={
 house:{name:'Rumah Terbengkalai',unlock:1,time:3,rad:7,risk:'Rendah',focus:'Komponen / Snack'},market:{name:'Minimarket',unlock:1,time:4,rad:11,risk:'Sedang',focus:'Food / Water'},clinic:{name:'Klinik',unlock:1,time:5,rad:15,risk:'Tinggi',focus:'Obat / Filter'},apartment:{name:'Apartemen Rusak',unlock:1,time:3,rad:8,risk:'Rendah',focus:'Food / Water / Komponen'},gas:{name:'Pom Bensin',unlock:1,time:4,rad:12,risk:'Sedang',focus:'Fuel / Snack / Komponen'},fire:{name:'Pos Pemadam',unlock:1,time:4,rad:10,risk:'Sedang',focus:'Filter / Water / Komponen'},garage:{name:'Bengkel Otomotif',unlock:2,time:4,rad:10,risk:'Sedang',focus:'Fuel / Komponen'},water:{name:'Instalasi Air',unlock:4,time:5,rad:13,risk:'Sedang',focus:'Air / Filter / Komponen'},metro:{name:'Terowongan Metro',unlock:6,time:6,rad:18,risk:'Tinggi',focus:'Mixed high-risk loot'},relay:{name:'Stasiun Relay',unlock:99,time:5,rad:12,risk:'Sedang',focus:'MAIN QUEST'},depot:{name:'Depot Darurat',unlock:99,time:4,rad:9,risk:'Rendah',focus:'HAVEN cache'}
};
const PROLOGUE_FRAMES=[
 {title:'Siaran Darurat',text:'Peringatan darurat nasional masuk beberapa detik sebelum jaringan mati. Jalur evakuasi berubah menjadi sirene, static, dan instruksi yang saling bertabrakan.',image:'./assets/prologue/prologue_01_emergency.webp'},
 {title:'Langit Menyala',text:'Cahaya putih menelan horizon. Dalam beberapa detik, kota yang dikenal berubah menjadi siluet di bawah langit yang terbakar.',image:'./assets/prologue/prologue_02_flash.webp'},
 {title:'Kota Runtuh',text:'Sirene tidak pernah benar-benar berhenti. Jalan pecah, listrik padam, dan permukaan berubah menjadi wilayah yang tidak lagi bisa dipercaya.',image:'./assets/prologue/prologue_03_chaos.webp'},
 {title:'Di Bawah Rumah',text:'Di bawah rumah, pintu baja tua masih bisa disegel. Tidak nyaman. Tidak luas. Tapi cukup untuk membeli sedikit waktu.',image:'./assets/prologue/prologue_04_bunker.webp'},
 {title:'Lockdown Engaged',text:'Pintu menutup. Udara luar, radiasi, dan suara manusia kini hanya bisa dibaca lewat sensor dan radio.',image:'./assets/prologue/prologue_05_door.webp'},
 {title:'Sistem Kembali Hidup',text:'Generator menyala. Lampu bunker kembali satu per satu. Persediaan terbatas, tetapi sistem masih merespons.',image:'./assets/prologue/prologue_06_generator.webp'},
 {title:'Bertahan Bukan Tujuan Akhir',text:'Bunker hanya membeli waktu. Bertahan cukup lama untuk memahami permukaan, mencari sinyal kehidupan, dan menemukan apakah masih ada tempat aman.',image:'./assets/prologue/prologue_07_command.webp'}
];
function preloadPrologue(){PROLOGUE_FRAMES.forEach(f=>{const img=new Image();img.decoding='async';img.src=f.image})}
let state=null, view={screen:'menu',panel:null,modal:null,prologueFrame:0};
let installPrompt=null;
const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;

const AudioUI=(()=>{
 let ctx=null, master=null, sfxBus=null, ambienceBus=null, noiseBuffer=null;
 let radioSource=null, ambienceTimer=null, ambienceToken=0, ambienceRunning=false;
 const ambienceNodes=new Set();
 const buffers=new Map(), loads=new Map();
 const AC=window.AudioContext||window.webkitAudioContext;
 const FILES={
  radio:'./assets/audio/Radio Static SFX.wav',
  craft:'./assets/audio/Craft item SFX.wav',
  heal:'./assets/audio/Heal SFX.wav',
  ambience:'./assets/audio/Bunker AMBIENCE.wav',
 };
 function cfg(){return state?.settings||settings()}
 function wantsAmbience(){return !!(state&&view.screen==='game'&&cfg().ambience&&!document.hidden)}
 function init(){
  if(ctx||!AC)return !!ctx;
  ctx=new AC();
  master=ctx.createGain();sfxBus=ctx.createGain();ambienceBus=ctx.createGain();
  sfxBus.connect(master);ambienceBus.connect(master);master.connect(ctx.destination);
  const len=Math.max(1,Math.floor(ctx.sampleRate*2));noiseBuffer=ctx.createBuffer(1,len,ctx.sampleRate);const d=noiseBuffer.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
  sync(true);preloadAll();return true;
 }
 function ensure(){
  if(!init())return false;
  if(ctx.state==='suspended')ctx.resume().then(()=>{sync();if(wantsAmbience())startAmbience()}).catch(()=>{});
  sync();if(wantsAmbience())startAmbience();return true;
 }
 function load(name){
  if(buffers.has(name))return Promise.resolve(buffers.get(name));
  if(loads.has(name))return loads.get(name);
  const task=fetch(FILES[name],{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('Audio '+name+' '+r.status);return r.arrayBuffer()}).then(b=>ctx.decodeAudioData(b)).then(buf=>{buffers.set(name,buf);return buf}).catch(err=>{console.warn('[LOCKDOWN audio]',err.message);loads.delete(name);return null});
  loads.set(name,task);return task;
 }
 function preloadAll(){Object.keys(FILES).forEach(load)}
 function sync(immediate=false){
  if(!ctx)return;const s=cfg(),t=ctx.currentTime,tc=immediate?0:.035;
  master.gain.setTargetAtTime(clamp(Number(s.master)||0,0,100)/100,t,tc||.001);
  sfxBus.gain.setTargetAtTime(s.sfx?clamp(Number(s.sfxVol)||0,0,100)/100:0,t,tc||.001);
  ambienceBus.gain.setTargetAtTime(s.ambience&&view.screen==='game'?clamp(Number(s.ambienceVol)||0,0,100)/100:0,t,tc||.001);
 }
 function playAsset(name,{offset=0,duration=null,gain=1}={}){
  if(!ensure()||!cfg().sfx)return Promise.resolve(null);
  return load(name).then(buf=>{
   if(!buf||!ctx||!cfg().sfx)return null;
   const src=ctx.createBufferSource(),g=ctx.createGain();g.gain.value=gain;src.buffer=buf;src.connect(g);g.connect(sfxBus);
   const safeOffset=Math.max(0,Math.min(Number(offset)||0,Math.max(0,buf.duration-.01)));
   if(duration==null)src.start(0,safeOffset);else src.start(0,safeOffset,Math.max(.01,Math.min(Number(duration)||0,buf.duration-safeOffset)));
   return src;
  });
 }
 function tone(freq=500,dur=.05,gain=.025,type='square',when=0){
  if(!ensure()||!cfg().sfx)return;const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.72),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(sfxBus);o.start(t);o.stop(t+dur+.02)
 }
 function uiClick(){tone(780,.038,.018,'square')}
 function damage(){tone(72,.18,.05,'sawtooth');tone(48,.24,.03,'sine',.02)}
 function hammer(){
  if(!ensure()||!cfg().sfx)return;
  [0,.19,.38].forEach((off,i)=>{const t=ctx.currentTime+off,src=ctx.createBufferSource(),bp=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=noiseBuffer;bp.type='bandpass';bp.frequency.value=650+i*70;bp.Q.value=1.1;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.16,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.095);src.playbackRate.value=.92+Math.random()*.16;src.connect(bp);bp.connect(g);g.connect(sfxBus);src.start(t,Math.random()*.4,.12)})
 }
 function stopRadio(){if(radioSource){try{radioSource.stop()}catch{}radioSource=null}}
 function radioBurst(){
  stopRadio();
  if(!ensure()||!cfg().sfx)return;
  load('radio').then(buf=>{if(!buf||!ctx||!cfg().sfx)return;const src=ctx.createBufferSource();src.buffer=buf;src.connect(sfxBus);src.onended=()=>{if(radioSource===src)radioSource=null};radioSource=src;src.start(0)});
 }
 function craft(){playAsset('craft')}
 // User rule: only seconds 9.00–11.00 of Heal SFX are ever played.
 function heal(){playAsset('heal',{offset:9,duration:2})}
 function clearAmbienceTimer(){if(ambienceTimer){clearTimeout(ambienceTimer);ambienceTimer=null}}
 function stopAmbience(fade=.45){
  clearAmbienceTimer();ambienceToken++;ambienceRunning=false;
  if(!ctx){ambienceNodes.clear();return}
  const t=ctx.currentTime;
  ambienceNodes.forEach(({src,g})=>{try{g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(Math.max(.0001,g.gain.value),t);g.gain.linearRampToValueAtTime(.0001,t+fade);src.stop(t+fade+.06)}catch{}});
  ambienceNodes.clear();
 }
 function scheduleAmbienceNode(buf,when,token,first=false){
  if(!ctx||token!==ambienceToken||!wantsAmbience())return;
  const dur=buf.duration;
  if(!Number.isFinite(dur)||dur<1)return;
  const overlap=Math.min(4,Math.max(1.25,dur*.08));
  const safeWhen=Math.max(ctx.currentTime+.02,when);
  const endAt=safeWhen+dur;
  const nextAt=endAt-overlap;
  const src=ctx.createBufferSource(),g=ctx.createGain();
  src.buffer=buf;src.connect(g);g.connect(ambienceBus);
  g.gain.setValueAtTime(.0001,safeWhen);
  g.gain.linearRampToValueAtTime(1,safeWhen+(first?Math.min(1.5,overlap):overlap));
  g.gain.setValueAtTime(1,nextAt);
  g.gain.linearRampToValueAtTime(.0001,endAt);
  const node={src,g};ambienceNodes.add(node);src.onended=()=>ambienceNodes.delete(node);src.start(safeWhen);src.stop(endAt+.05);
  const delay=Math.max(120,(nextAt-ctx.currentTime-.35)*1000);
  clearAmbienceTimer();ambienceTimer=setTimeout(()=>scheduleAmbienceNode(buf,nextAt,token,false),delay);
 }
 function startAmbience(){
  if(!ctx||ambienceRunning||!wantsAmbience())return;
  ambienceRunning=true;const token=++ambienceToken;
  load('ambience').then(buf=>{
   if(!buf||token!==ambienceToken||!wantsAmbience()){ambienceRunning=false;return}
   scheduleAmbienceNode(buf,ctx.currentTime+.04,token,true);
  });
 }
 function scene(){
  if(!ctx)return;sync();
  if(wantsAmbience())startAmbience();else if(ambienceRunning||ambienceNodes.size)stopAmbience(.35);
 }
 function background(){if(!ctx)return;stopAmbience(.18);master.gain.setTargetAtTime(0,ctx.currentTime,.045);setTimeout(()=>{if(document.hidden&&ctx?.state==='running')ctx.suspend().catch(()=>{})},140)}
 function foreground(){if(!ctx)return;ctx.resume().then(()=>{sync();scene()}).catch(()=>{})}
 return {ensure,sync,scene,uiClick,damage,hammer,radioBurst,stopRadio,craft,heal,startAmbience,stopAmbience,background,foreground};
})();
function settings(){try{return {...DEFAULT_SETTINGS,...JSON.parse(localStorage.getItem(SETTINGS)||'{}')}}catch{return clone(DEFAULT_SETTINGS)}}
function fresh(){const s=clone(BASE);s.settings=settings();seedDaily(s);return s}
function validate(raw){const s={...fresh(),...raw};['health','hunger','thirst','fatigue','morale','radiation','power','integrity'].forEach(k=>s[k]=clamp(Number(s[k])||0));s.day=Math.max(1,Math.floor(Number(s.day)||1));s.hour=clamp(Math.floor(Number(s.hour)||0),0,23);s.filters=Math.max(0,Math.floor(Number(s.filters)||0));s.scrap=Math.max(0,Math.floor(Number(s.scrap)||0));s.items={...clone(BASE.items),...(raw.items||{})};s.upgrades={...clone(BASE.upgrades),...(raw.upgrades||{})};Object.keys(s.upgrades).forEach(k=>s.upgrades[k]=clamp(Math.floor(s.upgrades[k]||1),1,3));s.story={...clone(BASE.story),...(raw.story||{})};s.world={...clone(BASE.world),...(raw.world||{})};s.flags={...clone(BASE.flags),...(raw.flags||{})};s.progression={...clone(BASE.progression),...(raw.progression||{})};s.relations={...clone(BASE.relations),...(raw.relations||{})};s.meta={...clone(BASE.meta),...(raw.meta||{})};s.settings={...DEFAULT_SETTINGS,...(raw.settings||{})};['master','sfxVol','ambienceVol'].forEach(k=>s.settings[k]=clamp(Number(s.settings[k])||0,0,100));if(!Array.isArray(s.logs))s.logs=[];if(!Array.isArray(s.survivors))s.survivors=[];if(!Array.isArray(s.dailyObjectives))seedDaily(s);return s}
function save(){if(!state)return;state.meta={...clone(BASE.meta),...(state.meta||{}),location:view.panel?'Bunker 7B · '+panelTitle(view.panel):'Bunker 7B',lastSavedAt:Date.now()};localStorage.setItem(SAVE,JSON.stringify(state))}
function load(){try{const x=JSON.parse(localStorage.getItem(SAVE)||'null');return x?validate(x):null}catch{return null}}
function hasSave(){return !!localStorage.getItem(SAVE)}
function log(text){state.logs.unshift({day:state.day,hour:state.hour,text});state.logs=state.logs.slice(0,24)}
function toast(t){const el=$('#toast');if(!el)return;el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function vibrate(ms=30){if(state?.settings?.vibration&&navigator.vibrate)navigator.vibrate(ms)}
function damageFx(){const e=$('#damageFx'),app=$('#app');if(e){e.classList.remove('hit');void e.offsetWidth;e.classList.add('hit')}if(app){app.classList.remove('hit-shake');void app.offsetWidth;app.classList.add('hit-shake');setTimeout(()=>app.classList.remove('hit-shake'),360)}AudioUI.damage();vibrate(45)}
function applyHealing(amount){amount=Math.max(0,Number(amount)||0);if(amount<=0)return 0;const before=state.health;state.health=clamp(state.health+amount);AudioUI.heal();return state.health-before}
function fmtHour(h=state.hour){return String(h).padStart(2,'0')+':00'}
function worldCond(day=state.day){return WORLD[(day-1)%5]}
function moraleFatigue(){return state.morale>=75?-.35:state.morale>=45?0:state.morale>=25?.35:.85}
function genDrain(){let d=state.upgrades.generator===1?.90:state.upgrades.generator===2?.76:.63;const r=survivor('raka');if(r&&r.trust>=40)d-=.08;return Math.max(.35,d)}
function survivor(id){return state.survivors.find(s=>s.id===id)}
function totalFood(){return Object.values(state.items.foods).reduce((a,x)=>a+(x.qty||0),0)} function totalDrink(){return Object.values(state.items.drinks).reduce((a,x)=>a+(x.qty||0),0)}
function statClass(k,v){const lowGood=['hunger','thirst','fatigue','radiation'].includes(k);if(lowGood)return v>=80?'danger':v>=60?'warn':'';return v<=25?'danger':v<=45?'warn':''}

function statState(k,v){
 const cls=statClass(k,v); if(cls==='danger')return 'KRITIS'; if(cls==='warn')return 'WASPADA';
 return ['hunger','thirst','fatigue','radiation'].includes(k)?'TERKENDALI':'STABIL';
}
function stationLockReason(id){
 if(state.onboarding>=4)return '';
 const expected=['gudang','generator','security','radio'][state.onboarding];
 if(id===expected)return 'OBJECTIVE AKTIF';
 const names={gudang:'Gudang',generator:'Generator',security:'Keamanan',radio:'Radio'};
 return 'SELESAIKAN '+(names[expected]||'OBJECTIVE').toUpperCase();
}
function overall(){const vals=[statClass('health',state.health),statClass('hunger',state.hunger),statClass('thirst',state.thirst),statClass('fatigue',state.fatigue),statClass('morale',state.morale),statClass('radiation',state.radiation),statClass('power',state.power),statClass('integrity',state.integrity)];return vals.includes('danger')?'Kritis':vals.includes('warn')?'Waspada':'Aman'}
function seedDaily(s=state){const pool=[['scan','Pindai kondisi luar'],['consume','Gunakan makanan atau minuman'],['sleep','Tidur minimal 1 jam'],['radio','Gunakan Radio'],['expedition','Selesaikan ekspedisi'],['craft','Craft sesuatu']];let rot=(s.day*2)%pool.length;s.dailyObjectives=[0,1,2].map(i=>{const p=pool[(rot+i)%pool.length];return {id:p[0],text:p[1],done:false}});s.objectiveRewardClaimed=false}
function objective(id){const o=state.dailyObjectives.find(x=>x.id===id);if(o&&!o.done){o.done=true;log('Daily Objective selesai: '+o.text);if(state.dailyObjectives.every(x=>x.done)&&!state.objectiveRewardClaimed){state.scrap+=2;state.filters+=1;state.objectiveRewardClaimed=true;log('Reward Daily Objective: +2 Komponen, +1 Filter');toast('Daily 3/3: +2 Komponen, +1 Filter')}}}
function qty(path){const [cat,id]=path.split('.');return state.items[cat]?.[id]?.qty||0}
function addQty(cat,id,n){if(state.items[cat]?.[id])state.items[cat][id].qty=Math.max(0,(state.items[cat][id].qty||0)+n)}

function advance(hours,{expedition=false,sleep=false}={}){
 const beforeH=state.health,beforeR=state.radiation;
 for(let i=0;i<hours;i++){
  const wc=worldCond();state.hunger=clamp(state.hunger+2.2);state.thirst=clamp(state.thirst+3+wc.thirst);state.power=clamp(state.power-genDrain());
  if(!sleep){let f=(expedition?3.35:2.4)+wc.fatigue+moraleFatigue();if(globalHour()<state.flags.coffeeCrashUntil)f+=1.5;state.fatigue=clamp(state.fatigue+f)}
  if(state.integrity<50)state.radiation=clamp(state.radiation+.6);
  if(state.hunger>85)state.health=clamp(state.health-1);if(state.thirst>88)state.health=clamp(state.health-2);if(state.fatigue>=92)state.health=clamp(state.health-1);if(state.radiation>75)state.health=clamp(state.health-1);if(state.radiation>90)state.health=clamp(state.health-1);
  state.hour++;
  if(state.hour>=24){state.hour=0;state.day++;newDay()}
  checkStory(); if(isGameOver())break;
 }
 if(state.health<beforeH||state.radiation>beforeR)damageFx();
 save();render();
}
function globalHour(){return (state.day-1)*24+state.hour}
function newDay(){state.world.scoutedDay=0;seedDaily();state.world.unlocked=Object.keys(LOCS).filter(id=>LOCS[id].unlock<=state.day);if(state.story.relayUnlocked&&!state.world.unlocked.includes('relay'))state.world.unlocked.push('relay');if(state.story.havenChoice==='send'&&state.day>=4&&!state.world.unlocked.includes('depot'))state.world.unlocked.push('depot');survivorUpkeep();if(state.survivors.length>1){state.relations.tension=clamp(state.relations.tension+5);const avg=state.survivors.reduce((a,s)=>a+s.trust,0)/state.survivors.length;if(avg<45)state.relations.tension+=4;if(state.morale<45)state.relations.tension+=5;if(totalFood()<state.survivors.length)state.relations.tension+=4;if(totalDrink()<state.survivors.length)state.relations.tension+=4;state.relations.tension=clamp(state.relations.tension)}log('Hari '+state.day+' dimulai. Kondisi: '+worldCond().name)}
function survivorUpkeep(){for(const s of state.survivors){let f=consumeAny('foods'),d=consumeAny('drinks');if(f&&d){s.trust=clamp(s.trust+1);state.morale=clamp(state.morale+1)}else{s.trust=clamp(s.trust-8);state.morale=clamp(state.morale-5);state.relations.tension=clamp(state.relations.tension+6);log('Kekurangan jatah untuk '+s.name)}}}
function consumeAny(cat){const item=Object.values(state.items[cat]).find(x=>x.qty>0);if(item){item.qty--;return true}return false}
function isGameOver(){return state.health<=0||state.integrity<=0}

function mainQuest(){const p=state.progression.mainStage;const q={1:['Stabilkan Bunker','Buka Gudang dan cek persediaan.'],2:['Pastikan Daya Bertahan','Buka Generator dan pahami cadangan daya.'],3:['Lihat Dunia Luar','Pindai area luar dari Keamanan.'],4:['Cari Sinyal','Buka Radio dan dengarkan frekuensi.'],5:['Bertahan Sampai Malam','Bertahan hingga Hari 1 pukul 20:00.'],6:['Cari Sinyal Kehidupan','Gunakan Radio untuk mencari ECHO-7.'],7:['Ikuti Petunjuk ECHO-7','Tunggu koordinat Relay pada Hari 3.'],8:['Pulihkan Komunikasi','Ekspedisi ke Stasiun Relay.'],9:['Aktifkan Modul / HAVEN','Gunakan Radio setelah membawa Modul Relay.'],10:['Bertahan sampai finale','Siapkan bunker sampai transmisi Hari 7.']}[p]||['Chapter 1 Complete','Eastern Corridor menunggu di Chapter 2.'];return q}
function completeOnboarding(type){const expected=['gudang','generator','security','radio'][state.onboarding];if(type===expected){state.onboarding++;state.progression.mainStage=Math.min(5,state.progression.mainStage+1);if(state.onboarding===4)log('Core onboarding selesai. Semua station dibuka.');save()}}
function stationLocked(id){if(state.onboarding>=4)return false;const expected=['gudang','generator','security','radio'][state.onboarding];return id!==expected}

function checkStory(){
 if(state.day===1&&state.hour>=12&&!state.flags.mayaOffered&&!survivor('maya')){state.flags.mayaOffered=true;storyModal('Ketukan di Pintu','Seorang perempuan berseragam medis berdiri di depan kamera luar. Namanya Maya. Ia bilang klinik tempatnya bekerja sudah runtuh.',[
  ['Terima Maya','Moral +5. Membuka skill Medis.',()=>joinMaya()],['Tolak','Tidak ada biaya langsung.',()=>{log('Maya ditolak.');closeModal()}]
 ])}
 if(state.day===1&&state.hour>=20&&!state.story.night1){state.story.night1=true;state.progression.mainStage=6;storyModal('Malam Pertama','Lampu bunker meredup. Di balik dengung generator, frekuensi radio menangkap pola yang terlalu teratur untuk disebut noise.',[['Buka Radio','Main Quest diperbarui.',()=>{closeModal();openPanel('radio')}],['Nanti','Tetap bisa dilanjutkan dari Radio.',closeModal]])}
 if(state.day>=2&&state.story.echoContact&&state.progression.mainStage<7)state.progression.mainStage=7;
 if(state.day>=3&&state.story.echoContact&&!state.story.relayUnlocked){state.story.relayUnlocked=true;state.world.unlocked.push('relay');state.progression.mainStage=8;pushRadioArchive('ECHO-7 // RELAY COORDINATES','Transmisi kedua berisi koordinat Stasiun Relay. “Pulihkan node. Jangan percaya kanal terbuka.”','STORY');storyModal('ECHO-7: Koordinat','Transmisi kedua berisi koordinat Stasiun Relay. “Pulihkan node. Jangan percaya kanal terbuka.”',[['Catat koordinat','Stasiun Relay terbuka.',closeModal]])}
 if(state.day>=4&&state.hour>=10&&!state.flags.rakaOffered&&!survivor('raka')){state.flags.rakaOffered=true;storyModal('Seorang Teknisi','Raka menemukan bunker lewat jalur utilitas lama. Ia menawarkan bantuan untuk generator—dengan syarat ia mendapat tempat.',[['Terima Raka','Moral +3. Teknisi membantu generator.',()=>joinRaka()],['Tolak','Tidak ada biaya langsung.',closeModal]])}
 if(state.day>=5&&!state.story.day5&&state.story.relayRecovered){state.story.day5=true;const maya=survivor('maya'),raka=survivor('raka');if(state.story.havenChoice==='send')storyModal('HAVEN-3: Checksum','Pola angka berulang muncul di kanal HAVEN. '+(maya?'Maya menganggapnya janggal. ':'')+(raka?'Raka menyebutnya mungkin checksum normal.':''),[['Catat Kejanggalan','HAVEN Evidence +1'+(maya?' • Maya Trust +2':''),()=>{state.story.havenEvidence++;if(maya)maya.trust=clamp(maya.trust+2);closeModal()}],['Percaya Protokol','Moral +2'+(raka?' • Raka Trust +2':''),()=>{state.morale=clamp(state.morale+2);if(raka)raka.trust=clamp(raka.trust+2);closeModal()}]])
 else storyModal('Dead Air','Tidak ada handshake. Kanal tetap mati—tetapi noise-nya tidak sepenuhnya acak.',[['Dengarkan pasif','HAVEN Evidence +1',()=>{state.story.havenEvidence++;closeModal()}],['Biarkan kanal mati','Moral -1',()=>{state.morale=clamp(state.morale-1);closeModal()}]])}
 if(state.day>=6&&!state.story.day6){state.story.day6=true;storyModal('Tekanan Abu','Abu radioaktif menekan intake bunker. Sistem meminta prioritas.',[
  ['Prioritaskan Udara Bersih','Butuh 1 Filter • Radiasi -6',()=>{if(state.filters<1)return toast('Filter tidak cukup');state.filters--;state.radiation=clamp(state.radiation-6);const m=survivor('maya');if(m)m.trust=clamp(m.trust+3);closeModal()}],
  ['Prioritaskan Daya','Daya +8 • Moral -2',()=>{state.power=clamp(state.power+8);state.morale=clamp(state.morale-2);const r=survivor('raka');if(r)r.trust=clamp(r.trust+3);closeModal()}],
  ['Bagi Beban Sistem','Butuh 2 Komponen • Moral +3 • Tension -12',()=>{if(state.scrap<2)return toast('Komponen tidak cukup');state.scrap-=2;state.morale=clamp(state.morale+3);state.relations.tension=clamp(state.relations.tension-12);closeModal()}]
 ])}
 if(state.day>=7&&state.story.relayRecovered&&!state.story.chapterComplete){if(state.story.havenChoice==='send'&&!state.story.depotVisited)return;storyModal('EVAC-12 / EASTERN CORRIDOR','Siaran mengklaim ada koridor evakuasi ke timur. Jendela 72 jam. Tidak ada cara memastikan siapa yang menunggu di ujungnya.',[['Ikuti Koridor Timur','Moral +5',()=>finish('east',5,0)],['Perkuat Bunker Dulu','Komponen +2',()=>finish('prepare',0,2)],['Putus Kontak Luar','Moral -2',()=>finish('isolate',-2,0)]])}
 maybeConflict();
}
function maybeConflict(){const m=survivor('maya'),r=survivor('raka');if(!m||!r||state.day===m.joinedDay||state.day===r.joinedDay||state.relations.tension<20||state.relations.lastConflictDay===state.day||view.modal)return;state.relations.lastConflictDay=state.day;storyModal('Gesekan: Medis vs Daya','Maya ingin penerangan Medis tetap stabil. Raka ingin memotong konsumsi daya.',[['Dukung Maya','Maya +8 • Raka -7 • Moral -2 • Tension -10',()=>{m.trust=clamp(m.trust+8);r.trust=clamp(r.trust-7);state.morale=clamp(state.morale-2);state.relations.tension=clamp(state.relations.tension-10);closeModal()}],['Dukung Raka','Raka +8 • Maya -7 • Daya +6 • Tension -10',()=>{r.trust=clamp(r.trust+8);m.trust=clamp(m.trust-7);state.power=clamp(state.power+6);state.relations.tension=clamp(state.relations.tension-10);closeModal()}],['Kompromi','Butuh 1 Komponen • keduanya +4 • Moral +4 • Tension -25',()=>{if(state.scrap<1)return toast('Komponen tidak cukup');state.scrap--;m.trust=clamp(m.trust+4);r.trust=clamp(r.trust+4);state.morale=clamp(state.morale+4);state.relations.tension=clamp(state.relations.tension-25);closeModal()}]])}
function finish(choice,moral,scrap){state.story.finaleChoice=choice;state.story.chapterComplete=true;state.progression.mainStage=11;state.morale=clamp(state.morale+moral);state.scrap+=scrap;log('Chapter 1 Complete: '+choice);closeModal();save();render()}
function joinMaya(){state.survivors.push({id:'maya',name:'Maya',role:'Mantan Perawat',skill:'Medis',personality:'Tenang',trust:45,lastTalkDay:0,lastHelpDay:0,joinedDay:state.day});state.morale=clamp(state.morale+5);log('Maya bergabung.');closeModal()}
function joinRaka(){state.survivors.push({id:'raka',name:'Raka',role:'Mantan Teknisi Listrik',skill:'Teknisi',personality:'Pragmatis',trust:40,lastTalkDay:0,lastHelpDay:0,joinedDay:state.day});state.morale=clamp(state.morale+3);if(survivor('maya'))state.relations.tension=clamp(state.relations.tension+20);log('Raka bergabung.');closeModal()}

function randomEmergency(){if(view.modal||state.hour<4)return; if(state.flags.lastRandomEventDay===state.day&&state.flags.lastRandomEventHour===state.hour)return; if(Math.random()>.22)return;state.flags.lastRandomEventDay=state.day;state.flags.lastRandomEventHour=state.hour;const e=Math.floor(Math.random()*3);if(e===0)storyModal('Darurat: Ventilasi','Kontaminasi terdeteksi di intake.',[['Gunakan Filter','1 Filter • Radiasi +3 • Moral +2',()=>{if(state.filters<1)return toast('Filter tidak cukup');state.filters--;state.radiation=clamp(state.radiation+3);state.morale=clamp(state.morale+2);closeModal()}],['Matikan Ventilasi','Daya -8 • Radiasi +5',()=>{state.power=clamp(state.power-8);state.radiation=clamp(state.radiation+5);closeModal()}],['Abaikan','Radiasi +14 • Moral -7',()=>{state.radiation=clamp(state.radiation+14);state.morale=clamp(state.morale-7);closeModal()}]]);if(e===1)storyModal('Darurat: Benturan Struktur','Sesuatu menghantam sisi luar bunker.',[['Perkuat Struktur','2 Komponen • Bunker -4',()=>{if(state.scrap<2)return toast('Komponen tidak cukup');state.scrap-=2;state.integrity=clamp(state.integrity-4);closeModal()}],['Alihkan Daya','Daya -10 • Bunker -8',()=>{state.power=clamp(state.power-10);state.integrity=clamp(state.integrity-8);closeModal()}],['Biarkan','Bunker -18 • Moral -6',()=>{state.integrity=clamp(state.integrity-18);state.morale=clamp(state.morale-6);closeModal()}]]);if(e===2)storyModal('Darurat: Ketukan Pintu','Seseorang mengetuk tiga kali. Kamera penuh noise.',[['Cek Kamera','Daya -4 • 50% dapat Snack',()=>{state.power=clamp(state.power-4);if(Math.random()<.5)addQty('foods','snack',1);closeModal()}],['Buka Pintu','45% sukses; gagal Health -12, Rad +8',()=>{if(Math.random()<.45){state.scrap+=2;addQty('foods','can',1);toast('Mereka meninggalkan persediaan')}else{state.health=clamp(state.health-12);state.radiation=clamp(state.radiation+8);damageFx()}closeModal()}],['Abaikan','Tanpa biaya langsung.',closeModal]])}

function storyModal(title,text,choices){view.modal={title,text,choices};render()}
function closeModal(){view.modal=null;save();render()}
function openPanel(p){view.screen='game';view.panel=p;if(['gudang','generator','radio'].includes(p))completeOnboarding(p);if(p==='radio')AudioUI.radioBurst();render()}
function back(){if(view.modal){closeModal();return}if(view.panel){if(view.panel==='radio')AudioUI.stopRadio();view.panel=null;render();return}view.screen='menu';render()}

function useFood(id){const it=state.items.foods[id];if(!it||it.qty<=0)return;it.qty--;state.hunger=clamp(state.hunger+(it.hunger||0));state.thirst=clamp(state.thirst+(it.thirst||0));state.morale=clamp(state.morale+(it.morale||0));objective('consume');log('Mengonsumsi '+it.name);save();render()}
function useDrink(id){const it=state.items.drinks[id];if(!it||it.qty<=0)return;it.qty--;state.thirst=clamp(state.thirst+(it.thirst||0));state.fatigue=clamp(state.fatigue+(it.fatigue||0));state.morale=clamp(state.morale+(it.morale||0));if(id==='coffee')state.flags.coffeeCrashUntil=globalHour()+3;objective('consume');log('Minum '+it.name);save();render()}
function useMed(){const it=state.items.meds.med;if(it.qty<=0)return;it.qty--;let heal=28+(state.upgrades.medis-1)*5;if(survivor('maya'))heal+=8;applyHealing(heal);state.radiation=clamp(state.radiation-8);log('Obat Darurat digunakan. Health +'+heal+', Rad -8');save();render()}
function fuel(){if(qty('fuel.fuel')<=0)return toast('Fuel habis');addQty('fuel','fuel',-1);let gain=[0,35,42,50][state.upgrades.generator];const r=survivor('raka');if(r&&r.trust>=40)gain+=5;state.power=clamp(state.power+gain);log('Generator diisi Fuel. Daya +'+gain);save();render()}
function scan(){let cost=[0,5,4,3][state.upgrades.keamanan];if(state.power<cost)return toast('Daya tidak cukup');state.power-=cost;state.world.scoutedDay=state.day;objective('scan');completeOnboarding('security');log('Area luar dipindai. Rad ekspedisi -2 hari ini.');advance(1)}
function repair(){if(state.scrap<2)return toast('Komponen tidak cukup');state.scrap-=2;state.integrity=clamp(state.integrity+[0,10,13,16][state.upgrades.keamanan]);log('Integritas bunker diperbaiki.');save();render()}
function sleep(h){let lvl=state.upgrades.kasur;let healHr=[0,2.5,3.25,4][lvl],fatHr=[0,8,10,12][lvl];let mult=state.fatigue>=85?.75:state.fatigue>=65?.9:1;applyHealing(healHr*h*mult);state.fatigue=clamp(state.fatigue-fatHr*h);state.morale=clamp(state.morale+.35*h);objective('sleep');log('Tidur '+h+' jam.');advance(h,{sleep:true})}
function craft(type){if(type==='filter'){let c=[0,3,2,1][state.upgrades.workbench];if(state.scrap<c)return toast('Komponen tidak cukup');state.scrap-=c;state.filters++;log('Membuat 1 Filter.');objective('craft')}else{let c=state.upgrades.workbench===3?3:4;if(state.scrap<c)return toast('Komponen tidak cukup');state.scrap-=c;state.integrity=clamp(state.integrity+15);log('Bunker plate dipasang. +15 Integritas');objective('craft')}AudioUI.craft();save();render()}
function upgrade(key){let lvl=state.upgrades[key];if(lvl>=3)return;let c=lvl===1?5:9;if(state.scrap<c)return toast('Komponen tidak cukup');state.scrap-=c;state.upgrades[key]++;log('Upgrade '+key+' ke Lv'+state.upgrades[key]);AudioUI.hammer();vibrate(70);save();render()}
function pushRadioArchive(label,text,kind='RX'){
 const arr=Array.isArray(state.story.radioArchive)?state.story.radioArchive:(state.story.radioArchive=[]);
 arr.unshift({day:state.day,hour:state.hour,label,text,kind});
 state.story.radioArchive=arr.slice(0,20);
}
function radioSignalInfo(){
 if(state.day>=2&&!state.story.echoContact)return {live:true,status:'SIGNAL DETECTED',label:'UNKNOWN / ECHO PATTERN',copy:'Pola terstruktur menembus noise. Sumber tidak mengirim koordinat.',actionTitle:'Sinyal Kehidupan Terdeteksi',actionCopy:'Transmission ini dapat menggerakkan Main Quest ECHO-7.'};
 if(state.day>=3&&state.story.echoContact&&!state.story.relayUnlocked)return {live:true,status:'ECHO-7 PENDING',label:'ECHO-7 / RETURN CHANNEL',copy:'Kontak pertama sudah tercatat. Kanal ECHO-7 masih dipantau untuk koordinat berikutnya.',actionTitle:'Pantau Kanal ECHO-7',actionCopy:'Story progression berikutnya bergantung pada waktu dan state Chapter.'};
 if(state.story.relayRecovered&&state.story.havenChoice===null)return {live:true,status:'NETWORK SIGNAL',label:'HAVEN-3 / RELAY LINK',copy:'Modul Relay membuka jaringan baru. Handshake belum diputuskan.',actionTitle:'Buka Jaringan HAVEN-3',actionCopy:'Transmission ini memicu keputusan handshake atau tetap independen.'};
 if(state.day<2&&!state.story.echoContact)return {live:false,status:'LISTENING',label:'NO STRUCTURED SIGNAL',copy:'Radio hanya menangkap noise dan fragmen siaran. Bertahan sampai story window berikutnya.',actionTitle:'Cari Story Signal',actionCopy:'Belum ada story transmission terkonfirmasi pada state saat ini.'};
 return {live:false,status:'DEAD AIR',label:'NO NEW STORY SIGNAL',copy:'Tidak ada transmission baru yang relevan dengan progression saat ini.',actionTitle:'Story Scan',actionCopy:'Scan tetap memakai 4 Daya dan 1 jam; hasil dapat berupa dead air.'};
}
function radioStory(){
 if(state.power<4)return toast('Daya tidak cukup');
 state.power-=4;objective('radio');state.story.transmissions++;
 if(state.day>=2&&!state.story.echoContact){
  pushRadioArchive('ECHO-7 // FIRST CONTACT','“Jika ada yang hidup, balas singkat. Jangan kirim koordinat.”','STORY');
  storyModal('ECHO-7','“Jika ada yang hidup, balas singkat. Jangan kirim koordinat.”',[['Balas singkat','Moral +2'+(survivor('maya')?' • Maya Trust +2':''),()=>{state.story.echoResponse='reply';state.story.echoContact=true;state.morale=clamp(state.morale+2);const m=survivor('maya');if(m)m.trust=clamp(m.trust+2);state.progression.mainStage=7;closeModal()}],['Diam','Tetap anonim.',()=>{state.story.echoResponse='silent';state.story.echoContact=true;state.progression.mainStage=7;closeModal()}]]);
 } else if(state.story.relayRecovered&&state.story.havenChoice===null){
  pushRadioArchive('HAVEN-3 // HANDSHAKE','Modul Relay membuka jaringan baru. Sistem meminta handshake.','STORY');
  storyModal('HAVEN-3','Modul Relay membuka jaringan baru. Sistem meminta handshake.',[['Kirim Handshake','Moral +4'+(survivor('maya')?' • Maya Trust +3':'')+' • Depot terbuka besok',()=>{state.story.havenChoice='send';state.morale=clamp(state.morale+4);const m=survivor('maya');if(m)m.trust=clamp(m.trust+3);state.progression.mainStage=10;closeModal()}],['Simpan Kode','Moral +1 • tetap independen',()=>{state.story.havenChoice='keep';state.morale=clamp(state.morale+1);const m=survivor('maya');if(m)m.trust=clamp(m.trust-2);state.progression.mainStage=10;closeModal()}]]);
 } else {
  pushRadioArchive('STORY SCAN // DEAD AIR','Tidak ada transmisi story baru pada state saat ini.','DEAD AIR');
  toast('Tidak ada transmisi story baru.');
 }
 log('Radio story scan.');advance(1);
}
function radioRandom(){
 if(state.power<4)return toast('Daya tidak cukup');
 state.power-=4;objective('radio');
 const lines=['“Jangan menuju pusat kota.”','“Shelter tujuh... ulangi... shelter tujuh...”','“Air permukaan tidak aman.”','Nada berulang setiap 17 detik. Tidak ada suara manusia.'];
 const line=lines[Math.floor(Math.random()*lines.length)];
 pushRadioArchive('RANDOM SCAN',line,'SCAN');log('Radio: '+line);advance(1);
}
function survivorTalk(id){const s=survivor(id);if(!s)return;if(s.lastTalkDay===state.day)return toast('Sudah bicara hari ini');s.lastTalkDay=state.day;s.trust=clamp(s.trust+4);state.morale=clamp(state.morale+2);if(state.survivors.length>1)state.relations.tension=clamp(state.relations.tension-3);log('Bicara dengan '+s.name);save();render()}
function survivorFeed(id){const s=survivor(id);if(!s)return;if(!consumeAny('foods'))return toast('Makanan habis');s.trust=clamp(s.trust+7);state.morale=clamp(state.morale+3);state.relations.tension=clamp(state.relations.tension-4);log('Membagikan makanan ke '+s.name);save();render()}
function survivorHelp(id){const s=survivor(id);if(!s||s.trust<50)return toast('Trust belum cukup');if(s.lastHelpDay===state.day)return toast('Sudah digunakan hari ini');s.lastHelpDay=state.day;if(id==='maya'){applyHealing(8);state.morale=clamp(state.morale+2);log('Maya memberi Bantuan Medis.')}else{state.power=clamp(state.power+8);state.morale=clamp(state.morale+1);log('Raka melakukan Tuning Generator.')}save();render()}
function expedition(id){const l=LOCS[id];if(!l||!state.world.unlocked.includes(id))return;if(state.health<=35||state.fatigue>=75||state.radiation>=70||state.hunger>=82||state.thirst>=82)return toast('Kondisi tidak layak untuk ekspedisi');if(id==='relay')return relayMission();let extra=id==='metro'?4:id==='clinic'?2:0;let rad=l.rad+worldCond().rad+extra-(state.world.scoutedDay===state.day?2:0);state.radiation=clamp(state.radiation+rad);advance(l.time,{expedition:true});if(isGameOver())return;rollLoot(id);fatigueRisk();state.world.visited.push(id);objective('expedition');if(id==='clinic'){const m=survivor('maya');if(m&&!m.sideQuestDone){m.sideQuestDone=true;m.trust=clamp(m.trust+10);state.morale=clamp(state.morale+3);log('SIDE selesai: Jejak Klinik.')}}if(id==='garage'){const r=survivor('raka');if(r&&!r.sideQuestDone){r.sideQuestDone=true;r.trust=clamp(r.trust+10);state.scrap+=2;log('SIDE selesai: Suku Cadang Lama.')}}if(id==='depot'){state.story.depotVisited=true;state.story.havenEvidence++;log('Depot Darurat ditemukan. HAVEN Evidence +1.')}save();render();randomEmergency()}
function fatigueRisk(){let dmg=0;if(state.fatigue>=85)dmg+=7;else if(state.fatigue>=70&&Math.random()<.5)dmg+=5;if(state.morale<25&&Math.random()<.35)dmg+=4;if(dmg){state.health=clamp(state.health-dmg);state.morale=clamp(state.morale-2);log('Cedera ekspedisi: Health -'+dmg);damageFx()}}
function rollLoot(id){let got=false;const add=(cat,key,n=1)=>{addQty(cat,key,n);got=true};switch(id){case'house':state.scrap+=2;Math.random()<.7&&add('foods','snack');break;case'market':add('foods','can',1);add('drinks','water',1);break;case'clinic':add('meds','med',1);if(Math.random()<.6)state.filters++;break;case'apartment':state.scrap++;add('drinks','water');break;case'gas':add('fuel','fuel');if(Math.random()<.6)add('foods','snack');break;case'fire':state.filters++;add('drinks','water');break;case'garage':state.scrap+=2;add('fuel','fuel');break;case'water':add('drinks','water',2);state.filters++;break;case'metro':state.scrap+=3;add('meds','med');add('fuel','fuel');break;case'depot':state.scrap+=2;add('foods','can');add('drinks','water');break;}state.morale=clamp(state.morale+(got?3:-3));log(got?'Ekspedisi membawa loot.':'Tidak ada loot yang berarti.')}
function relayMission(){storyModal('Stasiun Relay — Stage 1','Pintu utama tidak merespons. Pilih cara masuk.',[['Pulihkan Daya Pintu','Cost 4 Daya • aman',()=>{if(state.power<4)return toast('Daya tidak cukup');state.power-=4;relayStage2()}],['Paksa Pintu Maintenance','30% chance Health -4',()=>{if(Math.random()<.3){state.health=clamp(state.health-4);damageFx()}relayStage2()}],['Ikuti Jalur Kabel Luar','+1 Komponen • risiko radiasi lebih tinggi',()=>{state.scrap++;state.radiation=clamp(state.radiation+4);relayStage2()}]])}
function relayStage2(){view.modal={title:'Stasiun Relay — Ruang Kontrol',text:'Modul relay masih utuh. Ada log jaringan dan server cadangan yang belum mati.',choices:[['Ambil Modul Sekarang','+2 Komponen • risiko rendah',()=>relayFinish('quick')],['Salin Log','HAVEN Evidence +1 • +3 Komponen • 18% injury • extra Rad 4',()=>relayFinish('logs')],['Server Cadangan','+5 Komponen • 50% Filter • 38% injury • extra Rad 6',()=>relayFinish('server')]]};render()}
function relayFinish(mode){if(mode==='quick')state.scrap+=2;if(mode==='logs'){state.scrap+=3;state.story.havenEvidence++;state.radiation=clamp(state.radiation+4);if(Math.random()<.18)state.health=clamp(state.health-5)}if(mode==='server'){state.scrap+=5;state.radiation=clamp(state.radiation+6);if(Math.random()<.5)state.filters++;if(Math.random()<.38)state.health=clamp(state.health-8)}state.story.relayRecovered=true;state.progression.mainStage=9;state.world.visited.push('relay');objective('expedition');log('Modul Relay berhasil dibawa pulang.');closeModal();advance(LOCS.relay.time,{expedition:true})}

function panelTitle(id){return ({radio:'Radio',medis:'Medis',gudang:'Gudang',kasur:'Kasur',security:'Keamanan',generator:'Generator',workbench:'Meja Kerja',expedition:'Ekspedisi',archive:'Story Archive',settings:'Settings'})[id]||'Bunker 7B'}
function formatSavedAt(ts){if(!ts)return 'BELUM TERCATAT';try{return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(ts)).toUpperCase()}catch{return 'LOCAL SAVE'}}
function saveDossier(){const s=load();if(!s)return `<div class="save-dossier empty"><div class="dossier-kicker">ACTIVE SAVE</div><strong>TIDAK ADA DATA</strong><p>Mulai Chapter 1 dari Hari 1 · 07:00.</p></div>`;const q=mainQuestFor(s.progression?.mainStage||1);return `<div class="save-dossier"><div class="dossier-top"><div><div class="dossier-kicker">ACTIVE SAVE // LOCAL</div><strong>${s.meta?.playerName||'PENGHUNI 7B'}</strong></div><span class="condition ${overallFor(s).toLowerCase()}">${overallFor(s)}</span></div><div class="save-grid"><div><small>HARI</small><b>${s.day}</b></div><div><small>WAKTU</small><b>${fmtHour(s.hour)}</b></div><div><small>LOKASI</small><b>${s.meta?.location||'Bunker 7B'}</b></div><div><small>LEVEL</small><b>${s.meta?.level??'—'}</b></div></div><div class="dossier-quest"><span>MAIN QUEST</span><b>${q[0]}</b></div><div class="dossier-foot">SAVE TERAKHIR // ${formatSavedAt(s.meta?.lastSavedAt)}</div></div>`}
function mainQuestFor(p){return ({1:['Stabilkan Bunker',''],2:['Pastikan Daya Bertahan',''],3:['Lihat Dunia Luar',''],4:['Cari Sinyal',''],5:['Bertahan Sampai Malam',''],6:['Cari Sinyal Kehidupan',''],7:['Ikuti Petunjuk ECHO-7',''],8:['Pulihkan Komunikasi',''],9:['Aktifkan Modul / HAVEN',''],10:['Bertahan sampai finale',''],11:['Chapter 1 Complete','']})[p]||['Chapter 1 Complete','']}
function overallFor(s){const c=(k,v)=>{const low=['hunger','thirst','fatigue','radiation'].includes(k);return low?(v>=80?'danger':v>=60?'warn':''):(v<=25?'danger':v<=45?'warn':'')};const vals=[c('health',s.health),c('hunger',s.hunger),c('thirst',s.thirst),c('fatigue',s.fatigue),c('morale',s.morale),c('radiation',s.radiation),c('power',s.power),c('integrity',s.integrity)];return vals.includes('danger')?'Kritis':vals.includes('warn')?'Waspada':'Aman'}
function menu(){const saved=hasSave();const install=installPrompt&&!isStandalone()?'<button class="menu-util" data-act="install"><span>INSTALL PWA</span><small>OFFLINE</small></button>':'';return `<main class="screen menu"><div class="menu-atmosphere"></div><div class="menu-frame"><div class="menu-topline"><span>LOCKDOWN PROTOCOL</span><span class="signal">● SYSTEM READY</span></div><div class="menu-inner"><div class="brand-block"><div class="eyebrow">Narrative Survival Management</div><div class="logo">LOCKDOWN</div><div class="chapter-mark">CHAPTER 01 // BUNKER 7B</div><p class="tagline">Bunker bukan tujuan akhir.<br>Bunker hanya membeli waktu.</p></div>${saved?saveDossier():''}<div class="menu-actions"><button class="btn primary continue-btn" data-act="continue" ${saved?'':'disabled'}><span>CONTINUE</span><small>${saved?'LANJUTKAN ACTIVE SAVE':'ACTIVE SAVE TIDAK DITEMUKAN'}</small></button><button class="btn newgame-btn" data-act="new"><span>NEW GAME</span><small>MULAI HARI 1 · 07:00</small></button></div><div class="menu-utils"><button class="menu-util" data-act="archive"><span>STORY ARCHIVE</span><small>TRANSMISSION</small></button><button class="menu-util" data-act="settings"><span>SETTINGS</span><small>AUDIO · HAPTIC</small></button><button class="menu-util" data-act="credits"><span>CREDITS</span><small>BUILD INFO</small></button>${install}</div><div class="version">PWA v0.8 · RADIO STATION PASS · OFFLINE READY</div></div></div></main>`}
function credits(){return `<main class="screen credits-screen"><header class="panel-head"><button class="back" data-act="back">‹</button><div><h2>CREDITS</h2><span>LOCKDOWN // CHAPTER 01</span></div></header><section class="credits-hero"><div class="credits-logo">LOCKDOWN</div><p>Narrative Survival Management · Android portrait · Offline PWA</p></section><section class="card credits-card"><div class="story-tag">PROJECT</div><h3>LOCKDOWN</h3><p>Chapter 1 · Hari 1–7. Survival, bunker management, survivor relationship, radio narrative, dan expedition/scavenging.</p></section><section class="card credits-card"><div class="story-tag">BUILD</div><p>HTML + CSS + Vanilla JavaScript<br>Local save · Offline-first · No account · No telemetry gameplay</p></section><div class="version">PWA v0.8 · LOCAL BUILD</div></main>`}

function prologue(){
 const f=PROLOGUE_FRAMES[view.prologueFrame],n=view.prologueFrame+1;
 return `<main class="screen prologue prologue-enter" data-frame="${n}">
  <div class="prologue-bg" style="--prologue-image:url('${f.image}')"></div>
  <div class="prologue-vignette"></div>
  <div class="prologue-top"><span>PROLOGUE</span><span>${String(n).padStart(2,'0')} / 07</span></div>
  <div class="prologue-inner">
   <div class="prologue-copy">
    <div class="story-tag">FRAME ${String(n).padStart(2,'0')} // LOCKDOWN</div>
    <h1>${f.title}</h1>
    <p>${f.text}</p>
   </div>
   <div class="pager" aria-label="Progress prologue">${PROLOGUE_FRAMES.map((_,i)=>`<i class="${i<=view.prologueFrame?'on':''}"></i>`).join('')}</div>
   <button class="btn primary prologue-next" data-act="prologue-next">${view.prologueFrame===6?'MASUK BUNKER':'LANJUT'}</button>
  </div>
 </main>`
}
function dashboard(){
 const q=mainQuest();
 const stats=[['health','Kesehatan','♥',state.health],['hunger','Lapar','◒',state.hunger],['thirst','Haus','◉',state.thirst],['fatigue','Kelelahan','⌁',state.fatigue],['morale','Moral','☺',state.morale],['radiation','Radiasi','☢',state.radiation],['power','Daya','ϟ',state.power],['integrity','Bunker','⬡',state.integrity]];
 const stations=[['radio','Radio','⌁','Sinyal & arsip'],['medis','Medis','✚','Obat & recovery'],['gudang','Gudang','▣','Food & drinks'],['kasur','Kasur','▱','Tidur & pulih'],['security','Keamanan','◉','Scan & repair'],['generator','Generator','ϟ','Fuel & daya'],['workbench','Meja Kerja','⚒','Craft & upgrade'],['expedition','Ekspedisi','⌖','Scavenge & story']];
 const done=state.dailyObjectives.filter(x=>x.done).length;
 const condition=overall();
 const activeOnboarding=state.onboarding<4?['gudang','generator','security','radio'][state.onboarding]:'';
 const world=worldCond();
 return `<main class="screen dashboard-screen">
 <header class="topbar dashboard-topbar">
  <div class="grow"><div class="day">HARI ${state.day} · BUNKER 7B</div><div class="clock">${fmtHour()}</div></div>
  <div class="condition-chip ${condition.toLowerCase()}"><span>${condition}</span><small>${world.name}</small></div>
  <button class="time-btn" data-act="skip"><b>+1</b><small>JAM</small></button>
  <button class="icon-btn" data-act="menu" aria-label="Menu">☰</button>
 </header>
 <section class="bunker-strip"><span><i>ϟ</i>Daya <b>${Math.round(state.power)}%</b></span><span><i>⬡</i>Bunker <b>${Math.round(state.integrity)}%</b></span><span><i>☢</i>Rad <b>${Math.round(state.radiation)}</b></span></section>
 ${isGameOver()?`<section class="card gameover-card"><div class="story-tag">GAME OVER</div><strong>${state.health<=0?'Tubuh lo tidak bertahan.':'Bunker runtuh.'}</strong><p>Save ini tidak bisa melanjutkan gameplay. Mulai ulang dari Settings atau New Game.</p></section>`:''}
 <section class="quest command-card">
  <div class="quest-kicker"><span>MAIN QUEST</span><span>STAGE ${Math.min(state.progression.mainStage,10)} / 10</span></div>
  <strong>${q[0]}</strong><p>${q[1]}</p>
  <div class="quest-progress"><i style="width:${Math.min(100,(Math.min(state.progression.mainStage,10)/10)*100)}%"></i></div>
  <div class="quest-footer"><span>PRIORITAS UTAMA</span><b>${state.onboarding<4?'GUIDED ONBOARDING':'CHAPTER 01'}</b></div>
 </section>
 <div class="section-head"><h3>Status</h3><span>${condition} · ${world.name}</span></div>
 <section class="stats dashboard-stats">${stats.map(([k,n,i,v])=>`<div class="stat ${statClass(k,v)}"><div class="stat-head"><span class="stat-name"><i>${i}</i>${n}</span><span class="stat-value">${Math.round(v)}</span></div><div class="bar"><i style="width:${v}%"></i></div><div class="stat-foot"><span>${statState(k,v)}</span><small>${['hunger','thirst','fatigue','radiation'].includes(k)?'RENDAH = BAIK':'TINGGI = BAIK'}</small></div></div>`).join('')}</section>
 <div class="section-head"><h3>Station</h3><span>${state.onboarding<4?'Onboarding '+(state.onboarding+1)+'/4':'8 station online'}</span></div>
 <section class="station-grid dashboard-stations">${stations.map(([id,n,ico,sub])=>{const locked=stationLocked(id)||isGameOver();const reason=stationLockReason(id);const upgradeKey=id==='security'?'keamanan':id;const hasLv=['generator','medis','kasur','security','workbench'].includes(id);return `<button class="station ${locked?'locked':''} ${id===activeOnboarding?'active-objective':''}" data-panel="${id}" ${locked?'disabled':''}><div class="station-top"><span class="ico">${ico}</span>${hasLv&&!stationLocked(id)?`<span class="badge">LV ${state.upgrades[upgradeKey]}</span>`:''}</div><span class="station-copy"><b>${n}</b><small>${sub}</small></span>${reason?`<span class="lock-reason">${reason}</span>`:''}</button>`}).join('')}</section>
 ${state.survivors.length?`<div class="section-head"><h3>Survivor</h3><span>Tension ${Math.round(state.relations.tension)} · ${state.relations.tension>=65?'Tegang':state.relations.tension>=30?'Ada Gesekan':'Stabil'}</span></div><section class="card survivor-list survivor-dashboard">${state.survivors.map(s=>`<button class="survivor" data-survivor="${s.id}"><div class="avatar">${s.name[0]}</div><div class="grow"><b>${s.name}</b><small>${s.role} · ${s.skill}</small></div><div class="trust"><small>TRUST</small>${Math.round(s.trust)}</div></button>`).join('')}</section>`:''}
 <div class="section-head"><h3>Daily Objective</h3><span>${done}/3 · reward otomatis</span></div>
 <section class="card objective-card"><div class="daily-progress"><i style="width:${done/3*100}%"></i></div>${state.dailyObjectives.map(o=>`<div class="objective ${o.done?'done':''}"><span class="dot">${o.done?'✓':''}</span><span>${o.text}</span></div>`).join('')}<div class="daily-reward"><span>3/3 REWARD</span><b>+2 Komponen · +1 Filter</b></div></section>
 <div class="section-head"><h3>Activity Log</h3><span>4 terbaru</span></div>
 <section class="card log-card">${state.logs.length?state.logs.slice(0,4).map(l=>`<div class="log"><time>D${l.day} ${fmtHour(l.hour)}</time>${l.text}</div>`).join(''):'<div class="log">Belum ada aktivitas.</div>'}</section>
 <div class="version">LOCKDOWN · PWA v0.8 · RADIO STATION PASS · OFFLINE</div>
 </main>`;
}
function panel(){
 const p=view.panel;
 let title='';
 let body='';
 const res=`<div class="resource-row"><span class="pill">Komponen <b>${state.scrap}</b></span><span class="pill">Filter <b>${state.filters}</b></span><span class="pill">Daya <b>${Math.round(state.power)}</b></span></div>`;

 if(p==='gudang'){
  title='Gudang';
  const foods=Object.entries(state.items.foods).filter(([,x])=>x.qty>0).map(([id,x])=>`<div class="item"><b>${x.name}</b><div class="qty">×${x.qty}</div><p>${id==='snack'?'Lapar -12 · Moral +2':'Lapar -28 · Haus +4 · Moral +1'}</p><button class="btn" data-use-food="${id}">GUNAKAN</button></div>`).join('')||'<div class="card">Persediaan makanan kosong.</div>';
  const drinks=Object.entries(state.items.drinks).filter(([,x])=>x.qty>0).map(([id,x])=>`<div class="item"><b>${x.name}</b><div class="qty">×${x.qty}</div><p>${id==='water'?'Haus -28':'Haus -8 · Fatigue -18 · Moral +2 · crash 3h'}</p><button class="btn" data-use-drink="${id}">MINUM</button></div>`).join('')||'<div class="card">Persediaan minuman kosong.</div>';
  body=`<p class="hero-line">Inventory contextual: food dan minuman. Item dengan qty 0 hilang dari daftar.</p>${res}<div class="section-head"><h3>Food</h3><span>${totalFood()} item</span></div><div class="item-grid">${foods}</div><div class="section-head"><h3>Drinks</h3><span>${totalDrink()} item</span></div><div class="item-grid">${drinks}</div>`;
 }

 if(p==='generator'){
  title='Generator';
  const raka=survivor('raka');
  const gain=[0,35,42,50][state.upgrades.generator]+(raka&&raka.trust>=40?5:0);
  body=`<p class="hero-line">Drain saat ini ±${genDrain().toFixed(2)} daya/jam. Fuel mengisi +${gain} daya.</p>${res}<div class="action-list"><button class="action ${qty('fuel.fuel')?'':'disabled'}" data-act="fuel"><div class="action-top"><div class="grow"><b>Gunakan Fuel</b><p>Isi ulang generator.</p></div><strong>×${qty('fuel.fuel')}</strong></div><div class="costs"><span class="cost">+${gain} Daya</span><span class="cost">0 jam</span></div>${qty('fuel.fuel')?'':'<div class="reason">Fuel habis.</div>'}</button>${upgradeCard('generator','Generator')}</div>`;
 }

 if(p==='medis'){
  title='Medis';
  const heal=28+(state.upgrades.medis-1)*5+(survivor('maya')?8:0);
  body=`<p class="hero-line">Obat menyembuhkan Health dan menurunkan radiasi. Upgrade dan skill Maya stack.</p>${res}<div class="action-list"><button class="action ${qty('meds.med')?'':'disabled'}" data-act="med"><b>Obat Darurat ×${qty('meds.med')}</b><p>Gunakan satu dosis.</p><div class="costs"><span class="cost">Health +${heal}</span><span class="cost">Radiasi -8</span></div></button>${upgradeCard('medis','Medis')}</div>`;
 }

 if(p==='kasur'){
  title='Kasur';
  body=`<p class="hero-line">Tidur memulihkan fatigue dan health. Lapar/haus tetap berjalan.</p>${res}<div class="range-wrap"><div class="range-top"><span>Durasi Tidur</span><span id="sleepLabel">4 jam</span></div><input id="sleepRange" type="range" min="1" max="8" value="4"/><button class="btn primary" data-act="sleep">TIDUR</button></div><div class="action-list" style="margin-top:10px">${upgradeCard('kasur','Kasur')}</div>`;
 }

 if(p==='security'){
  title='Keamanan';
  const c=[0,5,4,3][state.upgrades.keamanan];
  const rep=[0,10,13,16][state.upgrades.keamanan];
  body=`<p class="hero-line">Scan memberi -2 radiasi untuk semua ekspedisi hari ini. Repair memulihkan integritas bunker.</p>${res}<div class="action-list"><button class="action ${state.power>=c?'':'disabled'}" data-act="scan"><b>Pindai Area Luar</b><p>${state.world.scoutedDay===state.day?'Area hari ini sudah dipindai.':'Buka data kondisi permukaan.'}</p><div class="costs"><span class="cost">${c} Daya</span><span class="cost">+1 jam</span><span class="cost">Expedition Rad -2</span></div></button><button class="action ${state.scrap>=2?'':'disabled'}" data-act="repair"><b>Repair Bunker</b><p>Perkuat struktur dari station keamanan.</p><div class="costs"><span class="cost">2 Komponen</span><span class="cost">Bunker +${rep}</span></div></button>${upgradeCard('keamanan','Keamanan')}</div>`;
 }

 if(p==='workbench'){
  title='Meja Kerja';
  const fc=[0,3,2,1][state.upgrades.workbench];
  const pc=state.upgrades.workbench===3?3:4;
  body=`<p class="hero-line">Crafting dan gateway upgrade bunker.</p>${res}<div class="action-list"><button class="action ${state.scrap>=fc?'':'disabled'}" data-craft="filter"><b>Craft Filter</b><p>Untuk event ventilasi dan risiko radiasi.</p><div class="costs"><span class="cost">${fc} Komponen</span><span class="cost">+1 Filter</span></div></button><button class="action ${state.scrap>=pc?'':'disabled'}" data-craft="plate"><b>Craft Bunker Plate</b><p>Perkuat integritas.</p><div class="costs"><span class="cost">${pc} Komponen</span><span class="cost">Bunker +15</span></div></button>${upgradeCard('workbench','Meja Kerja')}</div>`;
 }

 if(p==='radio'){
  title='Radio';
  const signal=radioSignalInfo();
  const archive=Array.isArray(state.story.radioArchive)?state.story.radioArchive:[];
  const wave=[28,48,72,38,64,88,42,58,82,34,70,52,92,46,68,32,76,56,84,40,62,90,50,72].map(h=>`<i style="--h:${h}%"></i>`).join('');
  const archiveHtml=archive.length?archive.slice(0,8).map((x,i)=>`<div class="radio-archive-row"><div class="radio-archive-meta"><span>${x.kind||'RX'}</span><time>D${x.day} ${fmtHour(x.hour)}</time></div><b>${x.label}</b><p>${x.text}</p></div>`).join(''):`<div class="radio-empty"><span>NO STORED SIGNAL</span><p>Belum ada hasil scan atau transmission yang tersimpan di Radio Archive.</p></div>`;
  body=`<section class="radio-console">
   <div class="radio-console-top"><div><span class="radio-kicker">BUNKER 7B // RADIO</span><strong>RX AUTO-SCAN</strong></div><div class="radio-led ${signal.live?'live':''}"><i></i>${signal.status}</div></div>
   <div class="radio-wave" aria-hidden="true">${wave}</div>
   <div class="radio-readout"><span>CHANNEL</span><b>${signal.label}</b><p>${signal.copy}</p></div>
   <div class="radio-telemetry"><span><small>DAYA</small><b>${Math.round(state.power)}%</b></span><span><small>COST / SCAN</small><b>4 DAYA</b></span><span><small>WAKTU</small><b>+1 JAM</b></span></div>
  </section>
  <div class="section-head radio-section-head"><h3>Transmission Control</h3><span>mekanik terlihat sebelum aksi</span></div>
  <div class="radio-actions">
   <button class="radio-action story ${state.power>=4?'':'disabled'}" data-act="radio-story" ${state.power>=4?'':'disabled'}><div class="radio-action-icon">◉</div><div class="grow"><span>STORY TRANSMISSION</span><b>${signal.actionTitle}</b><p>${signal.actionCopy}</p><div class="costs"><span class="cost">4 Daya</span><span class="cost">+1 jam</span><span class="cost">Story state</span></div>${state.power<4?'<div class="reason">Daya tidak cukup.</div>':''}</div></button>
   <button class="radio-action scan ${state.power>=4?'':'disabled'}" data-act="radio-random" ${state.power>=4?'':'disabled'}><div class="radio-action-icon">⌁</div><div class="grow"><span>RANDOM SCAN</span><b>Pindai Frekuensi Permukaan</b><p>Cari noise, peringatan, atau fragmen siaran yang tidak menggerakkan Main Quest.</p><div class="costs"><span class="cost">4 Daya</span><span class="cost">+1 jam</span><span class="cost">Flavor signal</span></div>${state.power<4?'<div class="reason">Daya tidak cukup.</div>':''}</div></button>
  </div>
  <div class="section-head radio-section-head"><h3>Radio Archive</h3><span>${archive.length} tersimpan · ${state.story.transmissions} story scan</span></div>
  <section class="radio-archive">${archiveHtml}</section>
  <section class="radio-story-state"><div><small>ECHO-7</small><b>${state.story.echoResponse||'BELUM ADA RESPONS'}</b></div><div><small>RELAY</small><b>${state.story.relayRecovered?'RECOVERED':state.story.relayUnlocked?'COORDINATES':'—'}</b></div><div><small>HAVEN-3</small><b>${state.story.havenChoice||'—'}</b></div><div><small>EVIDENCE</small><b>${state.story.havenEvidence}</b></div></section>`;
 }

 if(p==='expedition'){
  title='Ekspedisi';
  const ok=state.health>35&&state.fatigue<75&&state.radiation<70&&state.hunger<82&&state.thirst<82;
  const warning=ok?'':'<div class="card"><b>Lanjut Jelajah nonaktif.</b><p class="hero-line">Butuh Health >35, Fatigue <75, Rad <70, Hunger <82, Thirst <82.</p></div>';
  const locations=Object.entries(LOCS).filter(([id])=>state.world.unlocked.includes(id)).map(([id,l])=>{
   const scout=state.world.scoutedDay===state.day?'<span class="cost">Scout -2 Rad</span>':'';
   return `<div class="location"><div class="location-top"><b>${l.name}</b><span class="risk ${l.risk.toLowerCase()}">${l.risk}</span></div><p>${l.focus}</p><div class="costs"><span class="cost">${l.time} jam</span><span class="cost">Base Rad ${l.rad}</span>${scout}</div><button class="btn ${id==='relay'?'primary':''}" data-exp="${id}" ${ok?'':'disabled'}>MULAI EKSPEDISI</button></div>`;
  }).join('');
  body=`<p class="hero-line">Pilih lokasi, baca waktu/radiasi/risk, lalu bawa loot pulang. Security scan mengurangi radiasi hari ini.</p>${res}${warning}<div>${locations}</div>`;
 }

 if(p==='survivor'){
  title='Survivor';
  const s=survivor(view.survivorId)||state.survivors[0];
  if(s){
   const trustLabel=s.trust>=70?'Percaya':s.trust>=45?'Netral':s.trust>=25?'Waspada':'Curiga';
   body=`<div class="card"><div class="survivor"><div class="avatar">${s.name[0]}</div><div class="grow"><b>${s.name}</b><small>${s.role} · ${s.personality}</small></div><div class="trust">${Math.round(s.trust)}</div></div><p class="hero-line">Skill: ${s.skill}. Trust: ${trustLabel}.</p></div><div class="action-list"><button class="action" data-talk="${s.id}"><b>Bicara</b><p>Trust +4 · Moral +2 · sekali/hari.</p></button><button class="action" data-feed="${s.id}"><b>Bagikan Makanan</b><p>Consume 1 makanan · Trust +7 · Moral +3.</p></button><button class="action ${s.trust>=50?'':'disabled'}" data-help="${s.id}"><b>${s.id==='maya'?'Bantuan Medis':'Tuning Generator'}</b><p>${s.id==='maya'?'Health +8 · Moral +2':'Daya +8 · Moral +1'} · Trust 50+ · sekali/hari.</p></button></div>`;
  } else body='<div class="card">Belum ada survivor.</div>';
 }

 if(p==='archive'){
  title='Story Archive';
  const visited=state.world.visited.map(x=>LOCS[x]?.name||x).join(', ')||'—';
  body=`<div class="card"><div class="log">Chapter: ${state.story.chapterComplete?'1 Complete':'1 In Progress'}</div><div class="log">Transmission: ${state.story.transmissions}</div><div class="log">HAVEN Evidence: ${state.story.havenEvidence}</div><div class="log">Finale Choice: ${state.story.finaleChoice||'—'}</div><div class="log">Visited: ${visited}</div></div><button class="btn" data-act="replay-prologue">REPLAY PROLOGUE</button>`;
 }

 if(p==='settings'){
  title='Settings';
  body=settingsPanel();
 }

 return `<main class="screen panel ${p==='radio'?'radio-panel':''}"><header class="panel-head ${p==='radio'?'radio-head':''}"><button class="back" data-act="back">←</button><div class="grow"><h1>${title}</h1>${p==='radio'?'<span>COMMUNICATION STATION // OFFLINE ARCHIVE</span>':''}</div><small>D${state.day} ${fmtHour()}</small></header>${body}</main>`;
}
function upgradeCard(key,label){let lvl=state.upgrades[key],cost=lvl===1?5:lvl===2?9:0;return `<button class="action ${lvl>=3||state.scrap<cost?'disabled':''}" data-upgrade="${key}" ${lvl>=3?'disabled':''}><b>${label} Lv${lvl} ${lvl>=3?'· MAX':'→ Lv'+(lvl+1)}</b><p>${lvl>=3?'Upgrade Maksimum. Tetap terlihat sebagai state MAX.':'Tingkatkan efisiensi station.'}</p><div class="costs"><span class="cost">${lvl>=3?'MAX':cost+' Komponen'}</span></div>${lvl<3&&state.scrap<cost?'<div class="reason">Komponen tidak cukup.</div>':''}</button>`}
function settingsPanel(){const range=(key,label)=>`<label class="setting-range"><span>${label}<b id="${key}Label">${state.settings[key]}</b></span><input type="range" min="0" max="100" value="${state.settings[key]}" data-volume="${key}"></label>`;return `<div class="card setting-card"><div class="objective"><span>SFX</span><span style="margin-left:auto"><input type="checkbox" data-setting="sfx" ${state.settings.sfx?'checked':''}></span></div><div class="objective"><span>Ambience</span><span style="margin-left:auto"><input type="checkbox" data-setting="ambience" ${state.settings.ambience?'checked':''}></span></div><div class="objective"><span>Vibration</span><span style="margin-left:auto"><input type="checkbox" data-setting="vibration" ${state.settings.vibration?'checked':''}></span></div></div><div class="card setting-card">${range('master','Master Volume')}${range('sfxVol','SFX Volume')}${range('ambienceVol','Ambience Volume')}</div><p class="settings-note">Ambience memakai Bunker AMBIENCE.wav dengan crossfade-loop selama gameplay. Radio/Craft/Heal tetap memakai SFX asset lokal; Heal hanya memainkan detik 9–11.</p><button class="btn" style="width:100%;margin-bottom:8px" data-act="to-menu">MAIN MENU</button><button class="btn danger" style="width:100%" data-act="restart">RESTART GAME</button>`}
function modal(){if(!view.modal)return'';return `<div class="modal-wrap"><div class="modal"><div class="story-tag">DECISION</div><h2>${view.modal.title}</h2><p>${view.modal.text}</p><div class="choice">${view.modal.choices.map((c,i)=>`<button class="btn ${i===0?'primary':''}" data-choice="${i}">${c[0]}<small>${c[1]||''}</small></button>`).join('')}</div></div></div>`}
function render(){let html=view.screen==='menu'?menu():view.screen==='prologue'?prologue():view.screen==='credits'?credits():view.panel?panel():dashboard();$('#app').innerHTML=html+modal();bind();AudioUI.scene();}
function bind(){
 document.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>act(b.dataset.act));
 document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>openPanel(b.dataset.panel));
 document.querySelectorAll('[data-use-food]').forEach(b=>b.onclick=()=>useFood(b.dataset.useFood));
 document.querySelectorAll('[data-use-drink]').forEach(b=>b.onclick=()=>useDrink(b.dataset.useDrink));
 document.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>upgrade(b.dataset.upgrade));
 document.querySelectorAll('[data-craft]').forEach(b=>b.onclick=()=>craft(b.dataset.craft));
 document.querySelectorAll('[data-exp]').forEach(b=>b.onclick=()=>expedition(b.dataset.exp));
 document.querySelectorAll('[data-survivor]').forEach(b=>b.onclick=()=>{view.panel='survivor';view.survivorId=b.dataset.survivor;render()});
 document.querySelectorAll('[data-talk]').forEach(b=>b.onclick=()=>survivorTalk(b.dataset.talk));
 document.querySelectorAll('[data-feed]').forEach(b=>b.onclick=()=>survivorFeed(b.dataset.feed));
 document.querySelectorAll('[data-help]').forEach(b=>b.onclick=()=>survivorHelp(b.dataset.help));
 document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{const c=view.modal?.choices?.[Number(b.dataset.choice)];if(c)c[2]()});
 document.querySelectorAll('[data-setting]').forEach(i=>i.onchange=()=>{state.settings[i.dataset.setting]=i.checked;localStorage.setItem(SETTINGS,JSON.stringify(state.settings));AudioUI.ensure();AudioUI.sync();AudioUI.scene();save()});
 document.querySelectorAll('[data-volume]').forEach(i=>i.oninput=()=>{const k=i.dataset.volume,v=clamp(Number(i.value)||0,0,100);state.settings[k]=v;const lab=$('#'+k+'Label');if(lab)lab.textContent=v;localStorage.setItem(SETTINGS,JSON.stringify(state.settings));AudioUI.ensure();AudioUI.sync();AudioUI.scene();save()});
 document.querySelectorAll('button:not([disabled])').forEach(b=>b.addEventListener('pointerdown',()=>AudioUI.uiClick(),{passive:true}));
 const r=$('#sleepRange');if(r)r.oninput=()=>$('#sleepLabel').textContent=r.value+' jam';
 const pg=document.querySelector('.prologue');
 if(pg){
  pg.addEventListener('click',e=>{if(!e.target.closest('button'))act('prologue-next')});
  let sx=0,sy=0;
  pg.addEventListener('touchstart',e=>{const t=e.changedTouches[0];sx=t.clientX;sy=t.clientY},{passive:true});
  pg.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.25&&dx<0)act('prologue-next')},{passive:true});
 }
}
function act(a){if(a==='install'){if(installPrompt){installPrompt.prompt();installPrompt.userChoice.finally(()=>{installPrompt=null;render()})}else toast('Gunakan menu browser → Install app');return}if(a==='continue'){state=load();view.screen='game';view.panel=null;render()}if(a==='new'){if(hasSave()&&!confirm('Active save akan diganti. Mulai game baru?'))return;state=fresh();localStorage.setItem(SAVE,JSON.stringify(state));view.screen='prologue';view.prologueFrame=0;render()}if(a==='archive'){state=load()||fresh();view.screen='game';view.panel='archive';render()}if(a==='settings'){state=load()||fresh();view.screen='game';view.panel='settings';render()}if(a==='credits'){view.screen='credits';view.panel=null;render()}if(a==='prologue-next'){if(view.prologueFrame<6){view.prologueFrame++;render()}else{state.story.prologueDone=true;log('LOCKDOWN engaged. Day 1 07:00.');save();view.screen='game';view.panel=null;render()}}if(a==='skip'){if(!isGameOver()){advance(1);randomEmergency()}}if(a==='menu'){view.panel='settings';render()}if(a==='back')back();if(a==='fuel')fuel();if(a==='med')useMed();if(a==='scan')scan();if(a==='repair')repair();if(a==='sleep'){const h=Number($('#sleepRange')?.value||4);sleep(h)}if(a==='radio-story')radioStory();if(a==='radio-random')radioRandom();if(a==='replay-prologue'){view.screen='prologue';view.panel=null;view.prologueFrame=0;render()}if(a==='to-menu'){view.screen='menu';view.panel=null;save();render()}if(a==='restart'){if(confirm('Hapus active game save dan mulai ulang dari Day 1 07:00? Settings audio/haptic dipertahankan.')){const set=state.settings;localStorage.removeItem(SAVE);state=fresh();state.settings=set;localStorage.setItem(SETTINGS,JSON.stringify(set));localStorage.setItem(SAVE,JSON.stringify(state));view.screen='prologue';view.panel=null;view.prologueFrame=0;render()}}}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;if(view.screen==='menu')render()});window.addEventListener('appinstalled',()=>{installPrompt=null;toast('LOCKDOWN terpasang')});window.addEventListener('pagehide',()=>{save();AudioUI.background()});document.addEventListener('visibilitychange',()=>{if(document.hidden){save();AudioUI.background()}else AudioUI.foreground()});window.addEventListener('keydown',e=>{if(e.key==='Escape')back()});window.addEventListener('popstate',()=>back());
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
preloadPrologue();state=load();view.screen='menu';render();
})();
