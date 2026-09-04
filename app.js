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
 onboarding:0,dailyObjectives:[],objectiveRewardClaimed:false,story:{prologueDone:false,night1:false,echoResponse:null,echoContact:false,relayUnlocked:false,relayRecovered:false,havenChoice:null,havenEvidence:0,day5:false,day6:false,finaleChoice:null,chapterComplete:false,depotVisited:false,transmissions:0,radioArchive:[],journal:[]},
 progression:{mainStage:1},flags:{coffeeCrashUntil:0,lastRandomEventDay:0,lastRandomEventHour:-1,mayaOffered:false,rakaOffered:false},logs:[],lastThreat:null
};
const WORLD=[
 {name:'Udara Stabil',rad:0,fatigue:0,thirst:0},{name:'Debu Radioaktif',rad:3,fatigue:.25,thirst:0},{name:'Jendela Aman',rad:-3,fatigue:-.2,thirst:0},{name:'Panas Kering',rad:1,fatigue:.35,thirst:1},{name:'Badai Abu',rad:5,fatigue:.65,thirst:.35}
];
const LOCS={
 house:{name:'Rumah Terbengkalai',unlock:1,time:3,rad:7,risk:'Rendah',focus:'Komponen / Snack'},market:{name:'Minimarket',unlock:1,time:4,rad:11,risk:'Sedang',focus:'Food / Water'},clinic:{name:'Klinik',unlock:1,time:5,rad:15,risk:'Tinggi',focus:'Obat / Filter'},apartment:{name:'Apartemen Rusak',unlock:1,time:3,rad:8,risk:'Rendah',focus:'Food / Water / Komponen'},gas:{name:'Pom Bensin',unlock:1,time:4,rad:12,risk:'Sedang',focus:'Fuel / Snack / Komponen'},fire:{name:'Pos Pemadam',unlock:1,time:4,rad:10,risk:'Sedang',focus:'Filter / Water / Komponen'},garage:{name:'Bengkel Otomotif',unlock:2,time:4,rad:10,risk:'Sedang',focus:'Fuel / Komponen'},water:{name:'Instalasi Air',unlock:4,time:5,rad:13,risk:'Sedang',focus:'Air / Filter / Komponen'},metro:{name:'Terowongan Metro',unlock:6,time:6,rad:18,risk:'Tinggi',focus:'Mixed high-risk loot'},relay:{name:'Stasiun Relay',unlock:99,time:5,rad:12,risk:'Sedang',focus:'MAIN QUEST'},depot:{name:'Depot Darurat',unlock:99,time:4,rad:9,risk:'Rendah',focus:'HAVEN cache'}
};
const ENCOUNTER_FLAVOR={
 house:['Periksa Lemari','Naik ke Lantai Atas','Ambil Barang Terlihat'],
 market:['Rak Dekat Pintu','Masuk ke Gudang Belakang','Bongkar Rolling Door'],
 clinic:['Lemari Triage','Ruang Perawatan','Farmasi Terkunci'],
 apartment:['Unit Lantai Dasar','Naik Dua Lantai','Masuk Unit Retak'],
 gas:['Kios Depan','Periksa Pompa','Buka Tangki Servis'],
 fire:['Locker Personel','Garasi Armada','Ruang Peralatan Rusak'],
 garage:['Rak Suku Cadang','Area Lift Mobil','Bongkar Mobil Tertutup'],
 water:['Gudang Operator','Ruang Filtrasi','Masuk Jalur Intake'],
 metro:['Peron Dekat','Gerbong Mati','Terowongan Gelap'],
 depot:['Cache Terbuka','Kontainer Terkunci','Telusuri Ruang Arsip']
};
const ENCOUNTER_RULES={
 safe:{label:'SAFE',extraRad:0,injuryChance:0,injury:0,loot:'Kecil',className:'safe'},
 balanced:{label:'BALANCED',extraRad:2,injuryChance:.15,injury:4,loot:'Menengah',className:'balanced'},
 high:{label:'HIGH RISK',extraRad:5,injuryChance:.35,injury:7,loot:'Besar',className:'high'}
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
let state=null, view={screen:'menu',panel:null,modal:null,prologueFrame:0,expeditionResult:null,expeditionRun:null};
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
function validate(raw){const s={...fresh(),...raw};['health','hunger','thirst','fatigue','morale','radiation','power','integrity'].forEach(k=>s[k]=clamp(Number(s[k])||0));s.day=Math.max(1,Math.floor(Number(s.day)||1));s.hour=clamp(Math.floor(Number(s.hour)||0),0,23);s.filters=Math.max(0,Math.floor(Number(s.filters)||0));s.scrap=Math.max(0,Math.floor(Number(s.scrap)||0));s.items={...clone(BASE.items),...(raw.items||{})};s.upgrades={...clone(BASE.upgrades),...(raw.upgrades||{})};Object.keys(s.upgrades).forEach(k=>s.upgrades[k]=clamp(Math.floor(s.upgrades[k]||1),1,3));s.story={...clone(BASE.story),...(raw.story||{})};s.world={...clone(BASE.world),...(raw.world||{})};s.flags={...clone(BASE.flags),...(raw.flags||{})};s.progression={...clone(BASE.progression),...(raw.progression||{})};s.relations={...clone(BASE.relations),...(raw.relations||{})};s.meta={...clone(BASE.meta),...(raw.meta||{})};s.settings={...DEFAULT_SETTINGS,...(raw.settings||{})};['master','sfxVol','ambienceVol'].forEach(k=>s.settings[k]=clamp(Number(s.settings[k])||0,0,100));if(!Array.isArray(s.logs))s.logs=[];if(!Array.isArray(s.survivors))s.survivors=[];if(!Array.isArray(s.story.radioArchive))s.story.radioArchive=[];if(!Array.isArray(s.story.journal))s.story.journal=[];if(!Array.isArray(s.dailyObjectives))seedDaily(s);return s}
function save(){if(!state)return;state.meta={...clone(BASE.meta),...(state.meta||{}),location:view.panel?'Bunker 7B · '+panelTitle(view.panel):'Bunker 7B',lastSavedAt:Date.now()};localStorage.setItem(SAVE,JSON.stringify(state))}
function load(){try{const x=JSON.parse(localStorage.getItem(SAVE)||'null');return x?validate(x):null}catch{return null}}
function hasSave(){return !!localStorage.getItem(SAVE)}
function log(text){state.logs.unshift({day:state.day,hour:state.hour,text});state.logs=state.logs.slice(0,24)}
function toast(t){const el=$('#toast');if(!el)return;el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function vibrate(ms=30){if(state?.settings?.vibration&&navigator.vibrate)navigator.vibrate(ms)}
function damageFx(){const e=$('#damageFx'),app=$('#app');if(e){e.classList.remove('hit');void e.offsetWidth;e.classList.add('hit')}if(app){app.classList.remove('hit-shake');void app.offsetWidth;app.classList.add('hit-shake');setTimeout(()=>app.classList.remove('hit-shake'),360)}AudioUI.damage();vibrate(45)}
function applyHealing(amount){amount=Math.max(0,Number(amount)||0);if(amount<=0)return 0;const before=state.health;state.health=clamp(state.health+amount);const healed=state.health-before;AudioUI.heal();const app=$('#app');if(app){app.classList.remove('heal-pulse');void app.offsetWidth;app.classList.add('heal-pulse');setTimeout(()=>app.classList.remove('heal-pulse'),520)}return healed}
function fmtHour(h=state.hour){return String(h).padStart(2,'0')+':00'}
function worldCond(day=state.day){return WORLD[(day-1)%5]}
function moraleFatigue(){return state.morale>=75?-.35:state.morale>=45?0:state.morale>=25?.35:.85}
function genDrain(){let d=state.upgrades.generator===1?.90:state.upgrades.generator===2?.76:.63;const r=survivor('raka');if(r&&r.trust>=40)d-=.08;return Math.max(.35,d)}
function generatorBaseDrain(lvl=state.upgrades.generator){return [0,.90,.76,.63][lvl]||.90}
function generatorFuelGain(lvl=state.upgrades.generator){return [0,35,42,50][lvl]||35}
const UPGRADE_LABELS={generator:'Generator',medis:'Medis',kasur:'Kasur',keamanan:'Keamanan',workbench:'Meja Kerja'};
function upgradeEffectSummary(key,lvl){
 if(key==='generator')return `Drain ${generatorBaseDrain(lvl).toFixed(2)}/j · Fuel +${generatorFuelGain(lvl)}`;
 if(key==='medis')return `Obat +${28+(lvl-1)*5} Health`;
 if(key==='kasur')return `Heal +${[0,2.5,3.25,4][lvl]}/j · Fatigue -${[0,8,10,12][lvl]}/j`;
 if(key==='keamanan')return `Scan ${[0,5,4,3][lvl]} Daya · Repair +${[0,10,13,16][lvl]}`;
 if(key==='workbench')return `Filter ${[0,3,2,1][lvl]} Komp · Plate ${lvl===3?3:4} Komp`;
 return 'Station efficiency';
}
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

function advance(hours,{expedition=false,sleep=false,deferEvents=false}={}){
 const beforeH=state.health,beforeR=state.radiation;
 for(let i=0;i<hours;i++){
  const wc=worldCond();state.hunger=clamp(state.hunger+2.2);state.thirst=clamp(state.thirst+3+wc.thirst);state.power=clamp(state.power-genDrain());
  if(!sleep){let f=(expedition?3.35:2.4)+wc.fatigue+moraleFatigue();if(globalHour()<state.flags.coffeeCrashUntil)f+=1.5;state.fatigue=clamp(state.fatigue+f)}
  if(state.integrity<50)state.radiation=clamp(state.radiation+.6);
  if(state.hunger>85)state.health=clamp(state.health-1);if(state.thirst>88)state.health=clamp(state.health-2);if(state.fatigue>=92)state.health=clamp(state.health-1);if(state.radiation>75)state.health=clamp(state.health-1);if(state.radiation>90)state.health=clamp(state.health-1);
  state.hour++;
  if(state.hour>=24){state.hour=0;state.day++;newDay()}
  if(isGameOver())break;
 }
 if(state.health<beforeH||state.radiation>beforeR)damageFx();
 save();
 if(isGameOver()){presentGameOver();return false}
 if(!deferEvents)postTimeActionEvents();
 render();return true;
}
function postTimeActionEvents(){
 if(isGameOver()){presentGameOver();return true}
 // Strict event priority after a time-advancing action: Chapter/arrival/conflict first, random emergency last.
 if(checkStory())return true;
 return randomEmergency();
}
function globalHour(){return (state.day-1)*24+state.hour}
function newDay(){state.world.scoutedDay=0;seedDaily();state.world.unlocked=Object.keys(LOCS).filter(id=>LOCS[id].unlock<=state.day);if(state.story.relayUnlocked&&!state.world.unlocked.includes('relay'))state.world.unlocked.push('relay');if(state.story.havenChoice==='send'&&state.day>=4&&!state.world.unlocked.includes('depot'))state.world.unlocked.push('depot');survivorUpkeep();if(state.survivors.length>1){state.relations.tension=clamp(state.relations.tension+5);const avg=state.survivors.reduce((a,s)=>a+s.trust,0)/state.survivors.length;if(avg<45)state.relations.tension+=4;if(state.morale<45)state.relations.tension+=5;if(totalFood()<state.survivors.length)state.relations.tension+=4;if(totalDrink()<state.survivors.length)state.relations.tension+=4;state.relations.tension=clamp(state.relations.tension)}log('Hari '+state.day+' dimulai. Kondisi: '+worldCond().name)}
function survivorUpkeep(){for(const s of state.survivors){const hasFood=totalFood()>0,hasDrink=totalDrink()>0;if(hasFood&&hasDrink){consumeAny('foods');consumeAny('drinks');s.trust=clamp(s.trust+1);state.morale=clamp(state.morale+1);log('Jatah harian '+s.name+' terpenuhi. Trust +1 · Moral +1.')}else{s.trust=clamp(s.trust-8);state.morale=clamp(state.morale-5);state.relations.tension=clamp(state.relations.tension+6);log('Jatah '+s.name+' kurang. Trust -8 · Moral -5 · Tension +6.')}}}
function consumeAny(cat){const item=Object.values(state.items[cat]).find(x=>x.qty>0);if(item){item.qty--;return true}return false}
function isGameOver(){return state.health<=0||state.integrity<=0}

function mainQuest(){
 const p=state.progression.mainStage;
 if(p===10&&state.story.havenChoice==='send'&&!state.story.depotVisited)return ['Periksa Depot Darurat','HAVEN-3 membuka cache darurat. Ekspedisi ke Depot sebelum finale.'];
 if(p===10&&state.story.havenChoice==='keep')return ['Bertahan sampai finale','Tetap independen. Siapkan bunker sampai transmisi Hari 7.'];
 const q={1:['Stabilkan Bunker','Buka Gudang dan cek persediaan.'],2:['Pastikan Daya Bertahan','Buka Generator dan pahami cadangan daya.'],3:['Lihat Dunia Luar','Pindai area luar dari Keamanan.'],4:['Cari Sinyal','Buka Radio dan dengarkan frekuensi.'],5:['Bertahan Sampai Malam','Bertahan hingga Hari 1 pukul 20:00.'],6:['Cari Sinyal Kehidupan','Gunakan Radio untuk mencari ECHO-7.'],7:['Ikuti Petunjuk ECHO-7','Tunggu koordinat Relay pada Hari 3.'],8:['Pulihkan Komunikasi','Ekspedisi ke Stasiun Relay.'],9:['Aktifkan Modul / HAVEN','Gunakan Radio setelah membawa Modul Relay.'],10:['Bertahan sampai finale','Siapkan bunker sampai transmisi Hari 7.']}[p]||['Chapter 1 Complete','Eastern Corridor menunggu di Chapter 2.'];
 return q;
}
function completeOnboarding(type){const expected=['gudang','generator','security','radio'][state.onboarding];if(type===expected){state.onboarding++;state.progression.mainStage=Math.min(5,state.progression.mainStage+1);if(state.onboarding===4)log('Core onboarding selesai. Semua station dibuka.');save()}}
function stationLocked(id){if(state.onboarding>=4)return false;const expected=['gudang','generator','security','radio'][state.onboarding];return id!==expected}

function pushStoryBeat(id,title,text,kind='STORY'){
 const journal=Array.isArray(state.story.journal)?state.story.journal:(state.story.journal=[]);
 if(journal.some(x=>x.id===id))return;
 journal.unshift({id,day:state.day,hour:state.hour,title,text,kind});
 state.story.journal=journal.slice(0,40);
}
function choiceLabel(v,map){return map[v]||'—'}
function checkStory(){
 if(view.modal)return true;
 // Priority 1 — Chapter content
 if(!state.story.night1&&(state.day>1||(state.day===1&&state.hour>=20))){
  state.story.night1=true;state.progression.mainStage=6;
  pushStoryBeat('night1','Malam Pertama','Pola radio terstruktur muncul dari balik noise bunker.','CHAPTER');
  storyModal('Malam Pertama','Lampu bunker meredup. Di balik dengung generator, frekuensi radio menangkap pola yang terlalu teratur untuk disebut noise.',[['Buka Radio','Main Quest diperbarui.',()=>{closeModal();openPanel('radio')}],['Nanti','Tetap bisa dilanjutkan dari Radio.',closeModal]],{kind:'story',tag:'CHAPTER 01 // NIGHT 1',meta:'HARI 1 · 20:00 // UNKNOWN SIGNAL'});return true;
 }
 if(state.day>=2&&state.story.echoContact&&state.progression.mainStage<7)state.progression.mainStage=7;
 if(state.day>=3&&state.story.echoContact&&!state.story.relayUnlocked){
  state.story.relayUnlocked=true;if(!state.world.unlocked.includes('relay'))state.world.unlocked.push('relay');state.progression.mainStage=8;
  pushRadioArchive('ECHO-7 // RELAY COORDINATES','Transmisi kedua berisi koordinat Stasiun Relay. “Pulihkan node. Jangan percaya kanal terbuka.”','STORY');
  pushStoryBeat('echo-relay','ECHO-7: Koordinat Relay','ECHO-7 mengirim koordinat Stasiun Relay dan peringatan untuk tidak mempercayai kanal terbuka.','TRANSMISSION');
  storyModal('ECHO-7: Koordinat','Transmisi kedua berisi koordinat Stasiun Relay. “Pulihkan node. Jangan percaya kanal terbuka.”',[['Catat Koordinat','Stasiun Relay terbuka.',closeModal]],{kind:'story',tag:'ECHO-7 // PRIORITY TRANSMISSION',meta:'NEW LOCATION // STASIUN RELAY'});return true;
 }
 // Day 5 hanya valid setelah pemain menentukan HAVEN path.
 if(state.day>=5&&!state.story.day5&&state.story.relayRecovered&&state.story.havenChoice!==null){
  state.story.day5=true;const maya=survivor('maya'),raka=survivor('raka');
  if(state.story.havenChoice==='send'){
   pushStoryBeat('day5-checksum','HAVEN-3: Checksum','Pola angka berulang muncul pada kanal HAVEN-3.','CHAPTER');
   storyModal('HAVEN-3: Checksum','Pola angka berulang muncul di kanal HAVEN. '+(maya?'Maya menganggapnya janggal. ':'')+(raka?'Raka menyebutnya mungkin checksum normal.':''),[
    ['Catat Kejanggalan','HAVEN Evidence +1'+(maya?' • Maya Trust +2':''),()=>{state.story.havenEvidence++;if(maya)maya.trust=clamp(maya.trust+2);pushStoryBeat('day5-choice','Catat Kejanggalan','Checksum HAVEN dicatat sebagai bukti yang belum terjelaskan.','CHOICE');closeModal()}],
    ['Percaya Protokol','Moral +2'+(raka?' • Raka Trust +2':''),()=>{state.morale=clamp(state.morale+2);if(raka)raka.trust=clamp(raka.trust+2);pushStoryBeat('day5-choice','Percaya Protokol','Checksum HAVEN dianggap bagian normal dari protokol jaringan.','CHOICE');closeModal()}]
   ],{kind:'story',tag:'DAY 5 // HAVEN-3',meta:`EVIDENCE ${state.story.havenEvidence} // HANDSHAKE SENT`});
  }else{
   pushStoryBeat('day5-deadair','Dead Air','Jalur independen hanya menangkap noise yang tidak sepenuhnya acak.','CHAPTER');
   storyModal('Dead Air','Tidak ada handshake. Kanal tetap mati—tetapi noise-nya tidak sepenuhnya acak.',[
    ['Dengarkan Pasif','HAVEN Evidence +1',()=>{state.story.havenEvidence++;pushStoryBeat('day5-choice','Dengarkan Pasif','Noise kanal independen disimpan sebagai kemungkinan bukti.','CHOICE');closeModal()}],
    ['Biarkan Kanal Mati','Moral -1',()=>{state.morale=clamp(state.morale-1);pushStoryBeat('day5-choice','Biarkan Kanal Mati','Kanal dibiarkan mati untuk mempertahankan independensi.','CHOICE');closeModal()}]
   ],{kind:'story',tag:'DAY 5 // INDEPENDENT',meta:`EVIDENCE ${state.story.havenEvidence} // NO HANDSHAKE`});
  }
  return true;
 }
 if(state.day>=6&&!state.story.day6){
  state.story.day6=true;pushStoryBeat('day6-pressure','Tekanan Abu','Badai abu menekan intake dan memaksa bunker memilih prioritas sistem.','CHAPTER');
  const noFilter=state.filters<1,noScrap=state.scrap<2;
  storyModal('Tekanan Abu','Abu radioaktif menekan intake bunker. Sistem meminta prioritas.',[
   ['Prioritaskan Udara Bersih','Butuh 1 Filter • Radiasi -6'+(survivor('maya')?' • Maya Trust +3':''),()=>{if(state.filters<1)return toast('Filter tidak cukup');state.filters--;state.radiation=clamp(state.radiation-6);const m=survivor('maya');if(m)m.trust=clamp(m.trust+3);pushStoryBeat('day6-choice','Prioritaskan Udara Bersih','Filter dipakai untuk menekan paparan radiasi intake.','CHOICE');closeModal()},'safe',noFilter],
   ['Prioritaskan Daya','Daya +8 • Moral -2'+(survivor('raka')?' • Raka Trust +3':''),()=>{state.power=clamp(state.power+8);state.morale=clamp(state.morale-2);const r=survivor('raka');if(r)r.trust=clamp(r.trust+3);pushStoryBeat('day6-choice','Prioritaskan Daya','Daya dipertahankan dengan menerima tekanan moral.','CHOICE');closeModal()},'balanced'],
   ['Bagi Beban Sistem','Butuh 2 Komponen • Moral +3 • Tension -12',()=>{if(state.scrap<2)return toast('Komponen tidak cukup');state.scrap-=2;state.morale=clamp(state.morale+3);state.relations.tension=clamp(state.relations.tension-12);pushStoryBeat('day6-choice','Bagi Beban Sistem','Komponen dikorbankan untuk menyeimbangkan sistem bunker.','CHOICE');closeModal()},'safe',noScrap]
  ],{kind:'story',tag:'DAY 6 // PRESSURE EVENT',meta:`FILTER ${state.filters} // KOMPONEN ${state.scrap} // DAYA ${Math.round(state.power)}`});return true;
 }
 if(state.day>=7&&state.story.relayRecovered&&!state.story.chapterComplete){
  if(state.story.havenChoice==='send'&&!state.story.depotVisited)return false;
  pushStoryBeat('day7-evac','EVAC-12 / Eastern Corridor','Siaran mengklaim koridor evakuasi timur terbuka selama 72 jam.','FINALE');
  storyModal('EVAC-12 / EASTERN CORRIDOR','Siaran mengklaim ada koridor evakuasi ke timur. Jendela 72 jam. Tidak ada cara memastikan siapa yang menunggu di ujungnya.',[
   ['Ikuti Koridor Timur','Moral +5',()=>finish('east',5,0)],
   ['Perkuat Bunker Dulu','Komponen +2',()=>finish('prepare',0,2)],
   ['Putus Kontak Luar','Moral -2',()=>finish('isolate',-2,0)]
  ],{kind:'finale',tag:'DAY 7 // CHAPTER FINALE',meta:`EVAC WINDOW 72H // EVIDENCE ${state.story.havenEvidence}`});return true;
 }
 // Priority 2 — Survivor arrival
 if((state.day>1||(state.day===1&&state.hour>=12))&&!state.flags.mayaOffered&&!survivor('maya')){state.flags.mayaOffered=true;storyModal('Ketukan di Pintu','Seorang perempuan berseragam medis berdiri di depan kamera luar. Namanya Maya. Ia bilang klinik tempatnya bekerja sudah runtuh.',[
  ['Terima Maya','Moral +5. Membuka skill Medis.',()=>joinMaya()],['Tolak','Tidak ada biaya langsung.',()=>{log('Maya ditolak.');pushStoryBeat('maya-arrival','Maya Ditolak','Maya tidak diberi akses ke bunker.','SURVIVOR');closeModal()}]
 ],{kind:'story',tag:'SURVIVOR CONTACT // MAYA'});return true}
 if((state.day>4||(state.day===4&&state.hour>=10))&&!state.flags.rakaOffered&&!survivor('raka')){state.flags.rakaOffered=true;storyModal('Seorang Teknisi','Raka menemukan bunker lewat jalur utilitas lama. Ia menawarkan bantuan untuk generator—dengan syarat ia mendapat tempat.',[['Terima Raka','Moral +3. Teknisi membantu generator.',()=>joinRaka()],['Tolak','Tidak ada biaya langsung.',()=>{pushStoryBeat('raka-arrival','Raka Ditolak','Raka tidak diberi tempat di bunker.','SURVIVOR');closeModal()}]],{kind:'story',tag:'SURVIVOR CONTACT // RAKA'});return true}
 // Priority 3 — Survivor conflict
 maybeConflict();return !!view.modal;
}
function maybeConflict(){const m=survivor('maya'),r=survivor('raka');if(!m||!r||state.day===m.joinedDay||state.day===r.joinedDay||state.relations.tension<20||state.relations.lastConflictDay===state.day||view.modal)return;state.relations.lastConflictDay=state.day;storyModal('Gesekan: Medis vs Daya','Maya ingin penerangan Medis tetap stabil. Raka ingin memotong konsumsi daya.',[['Dukung Maya','Maya +8 • Raka -7 • Moral -2 • Tension -10',()=>{m.trust=clamp(m.trust+8);r.trust=clamp(r.trust-7);state.morale=clamp(state.morale-2);state.relations.tension=clamp(state.relations.tension-10);pushStoryBeat('conflict-d'+state.day,'Dukung Maya','Konflik penerangan Medis diselesaikan dengan mendukung Maya.','SURVIVOR');closeModal()}],['Dukung Raka','Raka +8 • Maya -7 • Daya +6 • Tension -10',()=>{r.trust=clamp(r.trust+8);m.trust=clamp(m.trust-7);state.power=clamp(state.power+6);state.relations.tension=clamp(state.relations.tension-10);pushStoryBeat('conflict-d'+state.day,'Dukung Raka','Konflik penerangan Medis diselesaikan dengan penghematan Daya.','SURVIVOR');closeModal()}],['Kompromi','Butuh 1 Komponen • keduanya +4 • Moral +4 • Tension -25',()=>{if(state.scrap<1)return toast('Komponen tidak cukup');state.scrap--;m.trust=clamp(m.trust+4);r.trust=clamp(r.trust+4);state.morale=clamp(state.morale+4);state.relations.tension=clamp(state.relations.tension-25);pushStoryBeat('conflict-d'+state.day,'Kompromi','Satu Komponen dipakai untuk menurunkan ketegangan Maya dan Raka.','SURVIVOR');closeModal()}]],{kind:'story',tag:'SURVIVOR CONFLICT',meta:`TENSION ${Math.round(state.relations.tension)}`})}
function finish(choice,moral,scrap){
 state.story.finaleChoice=choice;state.story.chapterComplete=true;state.progression.mainStage=11;state.morale=clamp(state.morale+moral);state.scrap+=scrap;
 const names={east:'Ikuti Koridor Timur',prepare:'Perkuat Bunker Dulu',isolate:'Putus Kontak Luar'};
 pushStoryBeat('finale-choice',names[choice]||choice,'Chapter 1 selesai. Keputusan ini akan menjadi konteks Chapter berikutnya.','FINALE');log('Chapter 1 Complete: '+choice);save();
 view.modal={kind:'chapter-complete',tag:'CHAPTER 01 // COMPLETE',title:'LOCKDOWN — CHAPTER 1 COMPLETE',text:'Tujuh hari pertama berakhir. Bunker berhasil membeli waktu—dan sekarang keputusan berikutnya berada di luar pintu baja.',meta:`FINALE // ${names[choice]||choice} · HAVEN EVIDENCE ${state.story.havenEvidence}`,choices:[['BUKA STORY ARCHIVE','Lihat transmission, evidence, dan keputusan Chapter 1.',()=>{view.modal=null;openPanel('archive')}],['KEMBALI KE BUNKER','Chapter 2 belum diimplementasikan.',()=>{view.modal=null;save();render()}]]};render();
}
function joinMaya(){state.survivors.push({id:'maya',name:'Maya',role:'Mantan Perawat',skill:'Medis',personality:'Tenang',trust:45,lastTalkDay:0,lastHelpDay:0,joinedDay:state.day,sideQuestDone:false});state.morale=clamp(state.morale+5);log('Maya bergabung.');pushStoryBeat('maya-arrival','Maya Bergabung','Mantan perawat bergabung dengan Bunker 7B.','SURVIVOR');closeModal()}
function joinRaka(){state.survivors.push({id:'raka',name:'Raka',role:'Mantan Teknisi Listrik',skill:'Teknisi',personality:'Pragmatis',trust:40,lastTalkDay:0,lastHelpDay:0,joinedDay:state.day,sideQuestDone:false});state.morale=clamp(state.morale+3);if(survivor('maya'))state.relations.tension=clamp(state.relations.tension+20);log('Raka bergabung.');pushStoryBeat('raka-arrival','Raka Bergabung','Mantan teknisi listrik bergabung dengan Bunker 7B.','SURVIVOR');closeModal()}

function emergencyOutcome(id,title,outcome,changes={}){
 const before={health:state.health,radiation:state.radiation,power:state.power,integrity:state.integrity,morale:state.morale,filters:state.filters,scrap:state.scrap};
 Object.entries(changes).forEach(([k,v])=>{if(['health','radiation','power','integrity','morale'].includes(k))state[k]=clamp(state[k]+v);else if(k==='filters')state.filters=Math.max(0,state.filters+v);else if(k==='scrap')state.scrap=Math.max(0,state.scrap+v)});
 state.lastThreat={id,title,outcome,day:state.day,hour:state.hour,before,after:{health:state.health,radiation:state.radiation,power:state.power,integrity:state.integrity,morale:state.morale,filters:state.filters,scrap:state.scrap}};
 log(`DARURAT ${title}: ${outcome}.`);
 pushStoryBeat(`emergency-${id}-d${state.day}h${state.hour}-${Date.now()}`,`Darurat: ${title}`,outcome,'EMERGENCY');
 const damaged=state.health<before.health||state.integrity<before.integrity||state.radiation>before.radiation;if(damaged)damageFx();
 view.modal=null;save();
 if(isGameOver()){presentGameOver();return}
 render();
}
function randomEmergency(forceId=null){
 if(view.modal||isGameOver()||state.hour<4)return false;
 if(state.flags.lastRandomEventDay===state.day&&state.flags.lastRandomEventHour===state.hour)return false;
 // Master spec: random emergency generally 55% after a time-advancing action when no higher-priority event fired.
 if(!forceId&&Math.random()>.55)return false;
 state.flags.lastRandomEventDay=state.day;state.flags.lastRandomEventHour=state.hour;
 const ids=['ventilation','structural','door'];const id=forceId&&ids.includes(forceId)?forceId:ids[Math.floor(Math.random()*ids.length)];
 if(id==='ventilation'){
  const noFilter=state.filters<1;
  storyModal('Darurat: Ventilasi','Sensor intake mendeteksi kontaminasi. Pilihan ini memengaruhi paparan bunker secara langsung.',[
   ['Gunakan Filter','Butuh 1 Filter • Radiasi +3 • Moral +2',()=>{if(state.filters<1)return toast('Filter tidak cukup');emergencyOutcome('ventilation','Ventilasi','Filter dipasang pada intake',{filters:-1,radiation:+3,morale:+2})},'safe',noFilter],
   ['Matikan Ventilasi','Daya -8 • Radiasi +5',()=>emergencyOutcome('ventilation','Ventilasi','Ventilasi dimatikan sementara',{power:-8,radiation:+5}),'balanced'],
   ['Abaikan Kontaminasi','Radiasi +14 • Moral -7',()=>emergencyOutcome('ventilation','Ventilasi','Kontaminasi dibiarkan masuk',{radiation:+14,morale:-7}),'high']
  ],{kind:'emergency',tag:'BUNKER EMERGENCY // AIR',meta:`FILTER ${state.filters} // RAD ${Math.round(state.radiation)} // DAYA ${Math.round(state.power)}`});return true;
 }
 if(id==='structural'){
  const noScrap=state.scrap<2;
  storyModal('Darurat: Benturan Struktur','Benturan berat mengguncang sisi bunker. Integrity akan turun pada semua opsi; pilih kerusakan yang masih bisa ditanggung.',[
   ['Perkuat Struktur','Butuh 2 Komponen • Bunker -4',()=>{if(state.scrap<2)return toast('Komponen tidak cukup');emergencyOutcome('structural','Benturan Struktur','Struktur diperkuat sebelum benturan kedua',{scrap:-2,integrity:-4})},'safe',noScrap],
   ['Alihkan Daya Sekunder','Daya -10 • Bunker -8',()=>emergencyOutcome('structural','Benturan Struktur','Daya sekunder dialihkan ke sistem penahan',{power:-10,integrity:-8}),'balanced'],
   ['Biarkan Benturan','Bunker -18 • Moral -6',()=>emergencyOutcome('structural','Benturan Struktur','Benturan diterima tanpa mitigasi',{integrity:-18,morale:-6}),'high']
  ],{kind:'emergency',tag:'BUNKER EMERGENCY // STRUCTURE',meta:`BUNKER ${Math.round(state.integrity)} // KOMPONEN ${state.scrap} // DAYA ${Math.round(state.power)}`});return true;
 }
 storyModal('Darurat: Ketukan Pintu','Tiga ketukan terdengar dari balik pintu baja. Kamera luar penuh noise dan identitas orang di luar tidak dapat dipastikan.',[
  ['Cek Kamera','Daya -4 • 50% dapat Snack',()=>{const got=Math.random()<.5;state.power=clamp(state.power-4);if(got)addQty('foods','snack',1);state.lastThreat={id:'door',title:'Ketukan Pintu',outcome:got?'Kamera menemukan cache kecil: +1 Snack':'Kamera tidak menemukan apa pun',day:state.day,hour:state.hour};log('DARURAT Ketukan Pintu: '+state.lastThreat.outcome+'.');view.modal=null;save();render()},'safe'],
  ['Buka Pintu','45% sukses: +2 Komponen +1 Kaleng • gagal: Health -12, Rad +8',()=>{if(Math.random()<.45){state.scrap+=2;addQty('foods','can',1);state.lastThreat={id:'door',title:'Ketukan Pintu',outcome:'Kontak aman: +2 Komponen, +1 Makanan Kaleng',day:state.day,hour:state.hour};log('DARURAT Ketukan Pintu: kontak aman.');view.modal=null;save();render()}else emergencyOutcome('door','Ketukan Pintu','Kontak luar berbahaya',{health:-12,radiation:+8})},'high'],
  ['Abaikan','Tanpa biaya langsung',()=>{state.lastThreat={id:'door',title:'Ketukan Pintu',outcome:'Ketukan diabaikan; tidak ada biaya langsung',day:state.day,hour:state.hour};log('DARURAT Ketukan Pintu diabaikan.');view.modal=null;save();render()},'balanced']
 ],{kind:'emergency',tag:'BUNKER EMERGENCY // DOOR',meta:`HEALTH ${Math.round(state.health)} // RAD ${Math.round(state.radiation)} // DAYA ${Math.round(state.power)}`});return true;
}
function gameOverReason(){return state.health<=0?'Kesehatan mencapai 0. Tubuh penghuni bunker tidak mampu bertahan.':'Integritas bunker mencapai 0. Struktur Bunker 7B runtuh.'}
function buildGameOverModal(){return {kind:'gameover',tag:'LOCKDOWN // TERMINAL STATE',title:'GAME OVER',text:gameOverReason(),meta:`DAY ${state.day} // ${fmtHour()} // ${state.health<=0?'HEALTH 0':'BUNKER 0'}`,choices:[['KEMBALI KE MAIN MENU','Save terminal tetap tersimpan untuk arsip.',()=>{view.modal=null;view.panel=null;view.screen='menu';save();render()},'ghost'],['RESTART GAME','Mulai ulang Day 1 · 07:00. Settings audio/haptic dipertahankan.',()=>restartGame(),'danger']]}}
function presentGameOver(){if(!isGameOver())return false;view.expeditionRun=null;view.expeditionResult=null;view.panel=null;view.screen='game';view.modal=buildGameOverModal();save();render();return true}
function restartGame(){const set=state.settings;localStorage.removeItem(SAVE);state=fresh();state.settings=set;localStorage.setItem(SETTINGS,JSON.stringify(set));localStorage.setItem(SAVE,JSON.stringify(state));view.modal=null;view.screen='prologue';view.panel=null;view.prologueFrame=0;render()}

function storyModal(title,text,choices,opts={}){view.modal={title,text,choices,...opts};render()}
function closeModal(){view.modal=null;save();render()}
function openPanel(p){view.screen='game';view.panel=p;if(['gudang','generator','radio'].includes(p))completeOnboarding(p);if(p==='radio')AudioUI.radioBurst();render()}
function back(){if(view.modal){if(view.modal.kind==='gameover'){toast('Game Over: pilih Restart atau Main Menu.');return}closeModal();return}if(view.panel){if(view.panel==='radio')AudioUI.stopRadio();view.panel=null;render();return}view.screen='menu';render()}

function useFood(id){
 const it=state.items.foods[id];if(!it||it.qty<=0)return;
 const before={hunger:state.hunger,thirst:state.thirst,morale:state.morale};
 it.qty--;state.hunger=clamp(state.hunger+(it.hunger||0));state.thirst=clamp(state.thirst+(it.thirst||0));state.morale=clamp(state.morale+(it.morale||0));
 objective('consume');
 const h=Math.round(before.hunger-state.hunger),t=Math.round(state.thirst-before.thirst),m=Math.round(state.morale-before.morale);
 log(`${it.name}: Lapar -${h}${t?` · Haus ${t>0?'+':''}${t}`:''}${m?` · Moral ${m>0?'+':''}${m}`:''}`);save();render();
}
function useDrink(id){
 const it=state.items.drinks[id];if(!it||it.qty<=0)return;
 const before={thirst:state.thirst,fatigue:state.fatigue,morale:state.morale};
 it.qty--;state.thirst=clamp(state.thirst+(it.thirst||0));state.fatigue=clamp(state.fatigue+(it.fatigue||0));state.morale=clamp(state.morale+(it.morale||0));
 if(id==='coffee')state.flags.coffeeCrashUntil=globalHour()+3;objective('consume');
 const t=Math.round(before.thirst-state.thirst),f=Math.round(before.fatigue-state.fatigue),m=Math.round(state.morale-before.morale);
 log(`${it.name}: Haus -${t}${f?` · Fatigue -${f}`:''}${m?` · Moral ${m>0?'+':''}${m}`:''}${id==='coffee'?' · Coffee Crash 3 jam':''}`);save();render();
}
function warehousePreview(item){
 const before={hunger:state.hunger,thirst:state.thirst,fatigue:state.fatigue,morale:state.morale};
 const after={
  hunger:clamp(before.hunger+(item.hunger||0)),
  thirst:clamp(before.thirst+(item.thirst||0)),
  fatigue:clamp(before.fatigue+(item.fatigue||0)),
  morale:clamp(before.morale+(item.morale||0))
 };
 return {before,after};
}
function warehouseItemCard(id,item,type){
 const p=warehousePreview(item);
 const effects=[];
 const rows=[];
 const defs=[['hunger','LAPAR',false],['thirst','HAUS',false],['fatigue','FATIGUE',false],['morale','MORAL',true]];
 for(const [k,label,highGood] of defs){
  const raw=item[k]||0;if(!raw)continue;
  const delta=Math.round(p.after[k]-p.before[k]);
  effects.push(`${label} ${delta>0?'+':''}${delta}`);
  rows.push(`<div class="warehouse-preview-row"><span>${label}</span><b>${Math.round(p.before[k])} → ${Math.round(p.after[k])}</b><small class="${highGood?(delta>=0?'benefit':'cost'):(delta<=0?'benefit':'cost')}">${delta>0?'+':''}${delta}</small></div>`);
 }
 const coffee=id==='coffee';
 const trade=id==='can'?'<div class="warehouse-tradeoff"><b>TRADE-OFF</b><span>Mengenyangkan paling efektif, tetapi Haus +4.</span></div>':coffee?'<div class="warehouse-tradeoff coffee"><b>COFFEE CRASH</b><span>Setelah diminum, fatigue rate +1.5/jam selama 3 jam.</span></div>':'';
 const kind=type==='food'?'FOOD RATION':'DRINK';
 const icon=type==='food'?(id==='can'?'▤':'▰'):(id==='coffee'?'◒':'◉');
 return `<article class="warehouse-item ${id}"><div class="warehouse-item-top"><div class="warehouse-item-icon">${icon}</div><div class="grow"><span>${kind}</span><b>${item.name}</b><small>${effects.join(' · ')}</small></div><div class="warehouse-qty"><small>STOCK</small><b>×${item.qty}</b></div></div><div class="warehouse-preview">${rows.join('')}</div>${trade}<button class="warehouse-use" ${type==='food'?`data-use-food="${id}"`:`data-use-drink="${id}"`}><span>${type==='food'?'KONSUMSI':'MINUM'}</span><b>${item.name}</b></button></article>`;
}

function useMed(){const it=state.items.meds.med;if(it.qty<=0)return toast('Obat Darurat habis');it.qty--;let heal=28+(state.upgrades.medis-1)*5;if(survivor('maya'))heal+=8;const healed=applyHealing(heal);const beforeRad=state.radiation;state.radiation=clamp(state.radiation-8);const radDown=Math.max(0,beforeRad-state.radiation);log('Obat Darurat digunakan. Health +'+Math.round(healed)+', Rad -'+Math.round(radDown));toast('Treatment selesai · Health +'+Math.round(healed)+' · Rad -'+Math.round(radDown));save();render()}
function fuel(){
 if(qty('fuel.fuel')<=0)return toast('Fuel habis');
 if(state.power>=100)return toast('Daya sudah maksimum');
 const raka=survivor('raka'),bonus=raka&&raka.trust>=40?5:0;
 const potential=generatorFuelGain()+bonus,before=state.power;
 addQty('fuel','fuel',-1);state.power=clamp(state.power+potential);
 const actual=Math.max(0,state.power-before);
 log('Generator diisi Fuel. Daya +'+Math.round(actual)+(bonus?' · bonus Raka aktif':''));
 toast('Generator +'+Math.round(actual)+' Daya');save();render();
}
function scan(){
 const cost=[0,5,4,3][state.upgrades.keamanan];
 if(state.world.scoutedDay===state.day)return toast('Scout hari ini sudah aktif');
 if(state.power<cost)return toast('Daya tidak cukup');
 state.power-=cost;state.world.scoutedDay=state.day;objective('scan');completeOnboarding('security');
 log('Area luar dipindai. Scout aktif: Rad ekspedisi -2 sampai pergantian hari.');advance(1)
}
function repair(){
 if(state.integrity>=100)return toast('Integritas bunker sudah maksimum');
 if(state.scrap<2)return toast('Komponen tidak cukup');
 const before=state.integrity,gain=[0,10,13,16][state.upgrades.keamanan];
 state.scrap-=2;state.integrity=clamp(state.integrity+gain);
 const actual=Math.max(0,state.integrity-before);AudioUI.hammer();vibrate(45);
 log('Repair bunker selesai. Integritas +'+Math.round(actual));toast('Bunker +'+Math.round(actual)+' Integrity');save();render()
}
function sleepPreview(h){
 h=clamp(Math.round(Number(h)||1),1,8);
 const lvl=state.upgrades.kasur;
 const healHr=[0,2.5,3.25,4][lvl],fatHr=[0,8,10,12][lvl];
 const mult=state.fatigue>=85?.75:state.fatigue>=65?.9:1;
 const before={health:state.health,hunger:state.hunger,thirst:state.thirst,fatigue:state.fatigue,morale:state.morale,power:state.power,radiation:state.radiation,day:state.day,hour:state.hour};
 const out={...before};
 const healPotential=healHr*h*mult;
 out.health=clamp(out.health+healPotential);
 out.fatigue=clamp(out.fatigue-fatHr*h);
 out.morale=clamp(out.morale+.35*h);
 let d=out.day,hr=out.hour;
 for(let i=0;i<h;i++){
  const wc=worldCond(d);
  out.hunger=clamp(out.hunger+2.2);
  out.thirst=clamp(out.thirst+3+wc.thirst);
  out.power=clamp(out.power-genDrain());
  if(state.integrity<50)out.radiation=clamp(out.radiation+.6);
  if(out.hunger>85)out.health=clamp(out.health-1);
  if(out.thirst>88)out.health=clamp(out.health-2);
  if(out.fatigue>=92)out.health=clamp(out.health-1);
  if(out.radiation>75)out.health=clamp(out.health-1);
  if(out.radiation>90)out.health=clamp(out.health-1);
  hr++;
  if(hr>=24){hr=0;d++}
 }
 out.day=d;out.hour=hr;
 return {hours:h,lvl,healHr,fatHr,mult,healPotential,before,after:out,crossesDay:d!==before.day};
}
function sleep(h){
 const p=sleepPreview(h),b=p.before;
 applyHealing(p.healPotential);
 state.fatigue=clamp(state.fatigue-p.fatHr*p.hours);
 state.morale=clamp(state.morale+.35*p.hours);
 objective('sleep');
 log('Tidur '+p.hours+' jam · Health '+Math.round(b.health)+'→'+Math.round(Math.min(100,b.health+p.healPotential))+' · Fatigue '+Math.round(b.fatigue)+'→'+Math.round(state.fatigue));
 advance(p.hours,{sleep:true});
}
function craft(type){
 if(type==='filter'){
  const c=[0,3,2,1][state.upgrades.workbench];if(state.scrap<c)return toast('Komponen tidak cukup');
  state.scrap-=c;state.filters++;log('Craft Filter selesai. -'+c+' Komponen · +1 Filter');objective('craft');toast('+1 Filter');
 }else{
  const c=state.upgrades.workbench===3?3:4;if(state.scrap<c)return toast('Komponen tidak cukup');if(state.integrity>=100)return toast('Integritas sudah maksimum');
  const before=state.integrity;state.scrap-=c;state.integrity=clamp(state.integrity+15);const actual=state.integrity-before;
  log('Bunker Plate dipasang. -'+c+' Komponen · Integrity +'+Math.round(actual));objective('craft');toast('Bunker +'+Math.round(actual));
 }
 AudioUI.craft();save();render();
}
function upgrade(key){
 const lvl=state.upgrades[key];if(lvl>=3)return toast('Upgrade sudah maksimum');
 const c=lvl===1?5:9;if(state.scrap<c)return toast('Komponen tidak cukup');
 state.scrap-=c;state.upgrades[key]++;const label=UPGRADE_LABELS[key]||key;
 log(label+' di-upgrade ke Lv'+state.upgrades[key]+'. -'+c+' Komponen');toast(label+' Lv'+state.upgrades[key]);AudioUI.hammer();vibrate(70);save();render();
}
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
  pushRadioArchive('ECHO-7 // FIRST CONTACT','“Jika ada yang hidup, balas singkat. Jangan kirim koordinat.”','STORY');pushStoryBeat('echo-first','ECHO-7: First Contact','Sinyal kehidupan meminta balasan singkat tanpa koordinat.','TRANSMISSION');
  storyModal('ECHO-7','“Jika ada yang hidup, balas singkat. Jangan kirim koordinat.”',[['Balas singkat','Moral +2'+(survivor('maya')?' • Maya Trust +2':''),()=>{state.story.echoResponse='reply';state.story.echoContact=true;state.morale=clamp(state.morale+2);const m=survivor('maya');if(m)m.trust=clamp(m.trust+2);state.progression.mainStage=7;pushStoryBeat('echo-choice','Balas Singkat','Bunker mengonfirmasi kehidupan tanpa mengirim koordinat.','CHOICE');closeModal()}],['Diam','Tetap anonim.',()=>{state.story.echoResponse='silent';state.story.echoContact=true;state.progression.mainStage=7;pushStoryBeat('echo-choice','Tetap Diam','Bunker tetap anonim terhadap ECHO-7.','CHOICE');closeModal()}]]);
 } else if(state.story.relayRecovered&&state.story.havenChoice===null){
  pushRadioArchive('HAVEN-3 // HANDSHAKE','Modul Relay membuka jaringan baru. Sistem meminta handshake.','STORY');pushStoryBeat('haven-contact','HAVEN-3','Modul Relay membuka jaringan baru dan meminta keputusan handshake.','TRANSMISSION');
  storyModal('HAVEN-3','Modul Relay membuka jaringan baru. Sistem meminta handshake.',[['Kirim Handshake','Moral +4'+(survivor('maya')?' • Maya Trust +3':'')+' • Depot terbuka besok',()=>{state.story.havenChoice='send';state.morale=clamp(state.morale+4);const m=survivor('maya');if(m)m.trust=clamp(m.trust+3);state.progression.mainStage=10;pushStoryBeat('haven-choice','Kirim Handshake','Bunker mengirim handshake ke HAVEN-3. Depot Darurat menjadi bagian jalur berikutnya.','CHOICE');closeModal()}],['Simpan Kode','Moral +1 • tetap independen',()=>{state.story.havenChoice='keep';state.morale=clamp(state.morale+1);const m=survivor('maya');if(m)m.trust=clamp(m.trust-2);state.progression.mainStage=10;pushStoryBeat('haven-choice','Simpan Kode','Bunker menyimpan kode HAVEN tanpa mengirim handshake dan tetap independen.','CHOICE');closeModal()}]]);
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
function trustLabelFor(v){return v>=70?'Percaya':v>=45?'Netral':v>=25?'Waspada':'Curiga'}
function tensionLabel(){return state.relations.tension>=65?'Tegang':state.relations.tension>=30?'Ada Gesekan':'Stabil'}
function survivorSideQuest(s){if(!s)return null;if(s.id==='maya')return {name:'Jejak Klinik',objective:'Ekspedisi ke Klinik.',reward:'Maya Trust +10 · Moral +3',location:'Klinik',done:!!s.sideQuestDone};if(s.id==='raka')return {name:'Suku Cadang Lama',objective:'Ekspedisi ke Bengkel Otomotif.',reward:'Raka Trust +10 · Komponen +2',location:'Bengkel Otomotif',done:!!s.sideQuestDone};return null}
function storyArchiveEntries(){
 const saved=Array.isArray(state.story.journal)?state.story.journal:[];
 const rows=[...saved];
 const add=(id,day,hour,title,text,kind='STORY')=>{if(!rows.some(x=>x.id===id))rows.push({id,day,hour,title,text,kind})};
 if(state.story.night1)add('night1',1,20,'Malam Pertama','Pola radio terstruktur muncul dari balik noise bunker.','CHAPTER');
 if(state.story.echoContact)add('echo-first',2,0,'ECHO-7: First Contact','Kontak kehidupan berhasil dikonfirmasi.','TRANSMISSION');
 if(state.story.relayUnlocked)add('echo-relay',3,0,'ECHO-7: Koordinat Relay','Koordinat Stasiun Relay diterima.','TRANSMISSION');
 if(state.story.relayRecovered)add('relay-recovered',Math.max(3,state.day),0,'Relay Recovered','Modul Relay berhasil dipulihkan.','MISSION');
 if(state.story.havenChoice)add('haven-choice',Math.max(3,state.day),0,state.story.havenChoice==='send'?'Kirim Handshake':'Simpan Kode',state.story.havenChoice==='send'?'Handshake HAVEN-3 dikirim.':'Bunker tetap independen terhadap HAVEN-3.','CHOICE');
 if(state.story.day5)add('day5',5,0,state.story.havenChoice==='send'?'HAVEN-3: Checksum':'Dead Air','Story beat Hari 5 telah diproses.','CHAPTER');
 if(state.story.day6)add('day6-pressure',6,0,'Tekanan Abu','Pressure event Hari 6 telah diproses.','CHAPTER');
 if(state.story.depotVisited)add('depot',Math.max(4,state.day),0,'Depot Darurat','Cache HAVEN telah diperiksa.','MISSION');
 if(state.story.chapterComplete)add('finale-choice',7,0,'Chapter 1 Complete','Eastern Corridor finale selesai.','FINALE');
 return rows.sort((a,b)=>(b.day-a.day)||(b.hour-a.hour));
}
function completedQuests(){const out=[];if(state.onboarding>=4)out.push(['MAIN','Stabilkan Bunker','Core onboarding bunker selesai.']);if(state.story.echoContact)out.push(['MAIN','ECHO-7','Kontak kehidupan berhasil dikonfirmasi.']);if(state.story.relayRecovered)out.push(['MAIN','Relay','Modul Relay berhasil dipulihkan.']);const m=survivor('maya'),r=survivor('raka');if(m?.sideQuestDone)out.push(['SIDE','Jejak Klinik','Maya memperoleh kembali jejak klinik.']);if(r?.sideQuestDone)out.push(['SIDE','Suku Cadang Lama','Raka memperoleh suku cadang dari bengkel.']);if(state.story.depotVisited)out.push(['MAIN','Depot Darurat','Cache HAVEN telah diperiksa.']);if(state.story.chapterComplete)out.push(['MAIN','Chapter 1','Eastern Corridor finale selesai.']);return out}
function questLogData(){const mq=mainQuest();const sides=state.survivors.map(s=>({survivor:s,quest:survivorSideQuest(s)})).filter(x=>x.quest&&!x.quest.done);return {main:{title:mq[0],text:mq[1],stage:state.progression.mainStage},sides,completed:completedQuests()}}
function survivorTalk(id){const s=survivor(id);if(!s)return;if(s.lastTalkDay===state.day)return toast('Sudah bicara hari ini');const beforeT=state.relations.tension;s.lastTalkDay=state.day;s.trust=clamp(s.trust+4);state.morale=clamp(state.morale+2);if(state.survivors.length>1)state.relations.tension=clamp(state.relations.tension-3);log('Bicara dengan '+s.name+'. Trust +4 · Moral +2'+(beforeT!==state.relations.tension?' · Tension -'+Math.round(beforeT-state.relations.tension):'')+'.');save();render()}
function survivorFeed(id){const s=survivor(id);if(!s)return;if(!consumeAny('foods'))return toast('Makanan habis');s.trust=clamp(s.trust+7);state.morale=clamp(state.morale+3);const beforeT=state.relations.tension;state.relations.tension=clamp(state.relations.tension-4);log('Makanan dibagikan ke '+s.name+'. Trust +7 · Moral +3'+(beforeT!==state.relations.tension?' · Tension -'+Math.round(beforeT-state.relations.tension):'')+'.');save();render()}
function survivorHelp(id){const s=survivor(id);if(!s||s.trust<50)return toast('Trust 50 diperlukan');if(s.lastHelpDay===state.day)return toast('Sudah digunakan hari ini');s.lastHelpDay=state.day;if(id==='maya'){const healed=applyHealing(8);state.morale=clamp(state.morale+2);log('Maya memberi Bantuan Medis. Health +'+Math.round(healed)+' · Moral +2.')}else{const before=state.power;state.power=clamp(state.power+8);state.morale=clamp(state.morale+1);log('Raka melakukan Tuning Generator. Daya +'+Math.round(state.power-before)+' · Moral +1.')}save();render()}
function expeditionReadiness(){
 const checks=[
  {key:'health',label:'Health',value:state.health,ok:state.health>35,rule:'> 35'},
  {key:'fatigue',label:'Fatigue',value:state.fatigue,ok:state.fatigue<75,rule:'< 75'},
  {key:'radiation',label:'Radiasi',value:state.radiation,ok:state.radiation<70,rule:'< 70'},
  {key:'hunger',label:'Lapar',value:state.hunger,ok:state.hunger<82,rule:'< 82'},
  {key:'thirst',label:'Haus',value:state.thirst,ok:state.thirst<82,rule:'< 82'}
 ];
 return {checks,ok:checks.every(x=>x.ok)};
}
function isLocationUnlocked(id){
 const l=LOCS[id];if(!l)return false;
 if(id==='relay')return !!state.story.relayUnlocked;
 if(id==='depot')return state.story.havenChoice==='send'&&state.day>=4;
 return state.day>=l.unlock;
}
function locationUnlockReason(id){
 const l=LOCS[id];if(!l)return 'Lokasi tidak tersedia.';
 if(id==='relay')return state.story.relayUnlocked?'Koordinat ECHO-7 diterima.':'Dibuka oleh Main Quest ECHO-7.';
 if(id==='depot')return state.story.havenChoice==='send'?(state.day>=4?'HAVEN cache tersedia.':'Tersedia mulai Hari 4.'):'Dibuka melalui jalur HAVEN-3.';
 return state.day>=l.unlock?'TERSEDIA':`Terbuka pada Hari ${l.unlock}.`;
}
function expeditionRadiation(id){
 const l=LOCS[id],wc=worldCond(),scout=state.world.scoutedDay===state.day?2:0;
 const total=Math.max(0,(l?.rad||0)+(Number(wc.rad)||0)-scout);
 return {base:l?.rad||0,world:Number(wc.rad)||0,scout,total};
}
function expeditionTravelPreview(id){
 const l=LOCS[id],wc=worldCond(),hours=l?.time||0;
 let hunger=state.hunger,thirst=state.thirst,fatigue=state.fatigue,power=state.power,health=state.health,rad=state.radiation;
 let gh=globalHour();
 const r=expeditionRadiation(id);rad=clamp(rad+r.total);
 for(let i=0;i<hours;i++){
  hunger=clamp(hunger+2.2);thirst=clamp(thirst+3+wc.thirst);power=clamp(power-genDrain());
  let f=3.35+wc.fatigue+moraleFatigue();if(gh+i<state.flags.coffeeCrashUntil)f+=1.5;fatigue=clamp(fatigue+f);
  if(state.integrity<50)rad=clamp(rad+.6);
  if(hunger>85)health=clamp(health-1);if(thirst>88)health=clamp(health-2);if(fatigue>=92)health=clamp(health-1);if(rad>75)health=clamp(health-1);if(rad>90)health=clamp(health-1);
 }
 return {hours,radiation:r,before:{health:state.health,hunger:state.hunger,thirst:state.thirst,fatigue:state.fatigue,power:state.power,radiation:state.radiation},after:{health,hunger,thirst,fatigue,power,radiation:rad}};
}
function expedition(id){
 const l=LOCS[id];if(!l)return;
 if(!isLocationUnlocked(id))return toast(locationUnlockReason(id));
 const ready=expeditionReadiness();if(!ready.ok)return toast('Kondisi belum memenuhi syarat ekspedisi');
 const p=expeditionTravelPreview(id),r=p.radiation;
 view.modal={title:'Konfirmasi Ekspedisi',text:`${l.name} • ${l.time} jam • estimasi Radiasi +${Math.round(r.total)}. World ${r.world>=0?'+':''}${r.world}${r.scout?' • Scout -2':''}.`,choices:[['BERANGKAT',`Risk ${l.risk} • ${l.focus}`,()=>{closeModal();startExpedition(id)}],['BATAL','Kembali ke daftar lokasi.',closeModal]]};render();
}
function startExpedition(id){
 const l=LOCS[id];if(!l||!isLocationUnlocked(id))return;
 const ready=expeditionReadiness();if(!ready.ok)return toast('Kondisi berubah. Ekspedisi dibatalkan.');
 const started={day:state.day,hour:state.hour,health:state.health,hunger:state.hunger,thirst:state.thirst,fatigue:state.fatigue,morale:state.morale,radiation:state.radiation,power:state.power};
 const rad=expeditionRadiation(id);state.radiation=clamp(state.radiation+rad.total);
 view.expeditionRun={id,name:l.name,time:l.time,risk:l.risk,focus:l.focus,started,baseRad:rad,travelEnded:null,encounter:null,loot:[],injury:0,extras:[]};
 advance(l.time,{expedition:true,deferEvents:true});
 if(isGameOver()){view.expeditionRun=null;save();render();return;}
 view.expeditionRun.travelEnded={day:state.day,hour:state.hour,health:state.health,hunger:state.hunger,thirst:state.thirst,fatigue:state.fatigue,morale:state.morale,radiation:state.radiation,power:state.power};
 if(id==='relay')return relayMission();
 openEncounter(id);
}
function encounterRules(mode,id){
 const base=ENCOUNTER_RULES[mode]||ENCOUNTER_RULES.balanced,highLoc=LOCS[id]?.risk==='Tinggi';
 return {...base,extraRad:base.extraRad+(highLoc&&mode!=='safe'?1:0),injuryChance:Math.min(.9,base.injuryChance+(highLoc&&mode!=='safe'?.08:0))};
}
function openEncounter(id){
 const l=LOCS[id],names=ENCOUNTER_FLAVOR[id]||['Cari Jalur Aman','Telusuri Area','Ambil Risiko'];
 const choice=(mode,i)=>{const r=encounterRules(mode,id);return [names[i],`${r.label} • Loot ${r.loot} • extra Rad +${r.extraRad}${r.injuryChance?` • ${Math.round(r.injuryChance*100)}% cedera -${r.injury}`:' • tanpa injury encounter'}`,()=>resolveEncounter(id,mode),r.className]};
 view.modal={kind:'encounter',tag:'FIELD ENCOUNTER',title:l.name,text:'Kamu sudah tiba di lokasi. Pilih seberapa jauh kamu mau mendorong pencarian. Risiko kelelahan perjalanan tetap dihitung setelah encounter.',meta:`BASE TRIP RAD +${Math.round(view.expeditionRun?.baseRad?.total||0)} // ${l.time} JAM`,choices:[choice('safe',0),choice('balanced',1),choice('high',2)]};render();
}
function resolveEncounter(id,mode){
 const run=view.expeditionRun;if(!run||run.id!==id)return;
 const r=encounterRules(mode,id);run.encounter={mode,label:r.label,extraRad:r.extraRad};
 if(r.extraRad){state.radiation=clamp(state.radiation+r.extraRad);if(r.extraRad>0)damageFx()}
 let encounterInjury=0;if(r.injuryChance&&Math.random()<r.injuryChance){encounterInjury=r.injury;state.health=clamp(state.health-encounterInjury);state.morale=clamp(state.morale-2);log(`Encounter ${r.label}: cedera Health -${encounterInjury}`);damageFx()}
 const loot=rollLoot(id,mode),travelInjury=fatigueRisk();run.loot=loot.items;run.injury=encounterInjury+travelInjury;
 finishExpeditionRun(id);
}
function finishExpeditionRun(id){
 const run=view.expeditionRun;if(!run||run.id!==id)return;
 if(!state.world.visited.includes(id))state.world.visited.push(id);
 objective('expedition');
 if(id==='clinic'){const m=survivor('maya');if(m&&!m.sideQuestDone){m.sideQuestDone=true;m.trust=clamp(m.trust+10);state.morale=clamp(state.morale+3);run.extras.push('SIDE selesai: Jejak Klinik');log('SIDE selesai: Jejak Klinik.')}}
 if(id==='garage'){const r=survivor('raka');if(r&&!r.sideQuestDone){r.sideQuestDone=true;r.trust=clamp(r.trust+10);state.scrap+=2;run.loot.push('+2 Komponen (Side Quest)');run.extras.push('SIDE selesai: Suku Cadang Lama');log('SIDE selesai: Suku Cadang Lama.')}}
 if(id==='depot'){state.story.depotVisited=true;state.story.havenEvidence++;run.extras.push('HAVEN Evidence +1');pushStoryBeat('depot','Depot Darurat','Cache HAVEN diperiksa. Evidence bertambah satu.','MISSION');log('Depot Darurat ditemukan. HAVEN Evidence +1.')}
 view.modal=null;
 view.expeditionResult={id,name:run.name,time:run.time,risk:run.risk,started:run.started,ended:{day:state.day,hour:state.hour,health:state.health,hunger:state.hunger,thirst:state.thirst,fatigue:state.fatigue,morale:state.morale,radiation:state.radiation,power:state.power},rad:{...run.baseRad,total:(run.baseRad?.total||0)+(run.encounter?.extraRad||0),encounter:run.encounter?.extraRad||0},loot:run.loot,injury:run.injury,extras:run.extras,encounter:run.encounter};
 view.expeditionRun=null;save();view.panel='expedition';render();
}
function fatigueRisk(){let dmg=0;if(state.fatigue>=85)dmg+=7;else if(state.fatigue>=70&&Math.random()<.5)dmg+=5;if(state.morale<25&&Math.random()<.35)dmg+=4;if(dmg){state.health=clamp(state.health-dmg);state.morale=clamp(state.morale-2);log('Cedera ekspedisi: Health -'+dmg);damageFx()}return dmg}
function rollLoot(id,mode='balanced'){
 let got=false;const items=[];
 const add=(cat,key,n=1)=>{addQty(cat,key,n);got=true;items.push(`+${n} ${state.items[cat]?.[key]?.name||key}`)};
 const scrap=n=>{state.scrap+=n;got=true;items.push(`+${n} Komponen`)};
 const filter=n=>{state.filters+=n;got=true;items.push(`+${n} Filter`)};
 const safe=mode==='safe',high=mode==='high';
 switch(id){
  case'house':safe?(scrap(1),Math.random()<.45&&add('foods','snack')):high?(scrap(3),add('foods','snack')):(scrap(2),Math.random()<.7&&add('foods','snack'));break;
  case'market':safe?add('drinks','water',1):high?(add('foods','can',2),add('drinks','water',2)):(add('foods','can',1),add('drinks','water',1));break;
  case'clinic':safe?add('meds','med',1):high?(add('meds','med',2),filter(1)):(add('meds','med',1),Math.random()<.6&&filter(1));break;
  case'apartment':safe?scrap(1):high?(scrap(2),add('drinks','water',2),Math.random()<.6&&add('foods','snack')):(scrap(1),add('drinks','water'));break;
  case'gas':safe?add('foods','snack'):high?(add('fuel','fuel',2),add('foods','snack'),scrap(1)):(add('fuel','fuel'),Math.random()<.6&&add('foods','snack'));break;
  case'fire':safe?add('drinks','water'):high?(filter(2),add('drinks','water',2),scrap(1)):(filter(1),add('drinks','water'));break;
  case'garage':safe?scrap(1):high?(scrap(4),add('fuel','fuel',2)):(scrap(2),add('fuel','fuel'));break;
  case'water':safe?add('drinks','water',1):high?(add('drinks','water',3),filter(2)):(add('drinks','water',2),filter(1));break;
  case'metro':safe?scrap(2):high?(scrap(5),add('meds','med',2),add('fuel','fuel',2),Math.random()<.6&&filter(1)):(scrap(3),add('meds','med'),add('fuel','fuel'));break;
  case'depot':safe?scrap(1):high?(scrap(4),add('foods','can',2),add('drinks','water',2),filter(1)):(scrap(2),add('foods','can'),add('drinks','water'));break;
 }
 state.morale=clamp(state.morale+(got?3:-3));log(got?'Ekspedisi membawa loot.':'Tidak ada loot yang berarti.');return {got,items};
}
function relayMission(){
 const run=view.expeditionRun;if(!run)return;
 const canPower=state.power>=4;
 view.modal={kind:'relay',tag:'MAIN QUEST // STAGE 1',title:'Stasiun Relay — Akses',text:'Pintu utama tidak merespons. Sistem darurat masih punya sedikit daya, tetapi jalur maintenance dan kabel luar tetap bisa dipakai.',meta:`RELAY NODE // BASE RAD +${Math.round(run.baseRad?.total||0)} // ${run.time} JAM PERJALANAN`,choices:[
  ['Pulihkan Daya Pintu','Cost 4 Daya • aman',()=>{state.power=clamp(state.power-4);run.extras.push('Stage 1: Daya pintu dipulihkan (-4 Daya)');relayStage2()},'safe',!canPower],
  ['Paksa Pintu Maintenance','30% chance Health -4',()=>{let dmg=0;if(Math.random()<.3){dmg=4;state.health=clamp(state.health-4);state.morale=clamp(state.morale-2);damageFx()}run.injury+=dmg;run.extras.push(dmg?'Stage 1: Cedera maintenance -4 Health':'Stage 1: Maintenance berhasil tanpa cedera');relayStage2()},'balanced'],
  ['Ikuti Jalur Kabel Luar','+1 Komponen • extra Rad +4',()=>{state.scrap++;state.radiation=clamp(state.radiation+4);run.baseRad={...run.baseRad,total:(run.baseRad?.total||0)+4};run.loot.push('+1 Komponen (Jalur Kabel)');run.extras.push('Stage 1: Jalur kabel luar, Radiasi +4');damageFx();relayStage2()},'high']
 ]};render();
}
function relayStage2(){
 const run=view.expeditionRun;if(!run)return;
 view.modal={kind:'relay',tag:'MAIN QUEST // STAGE 2',title:'Stasiun Relay — Ruang Kontrol',text:'Modul relay masih utuh. Di sampingnya ada log jaringan dan server cadangan yang belum mati. Modul wajib dibawa pulang; sisanya adalah pilihan risiko.',meta:`HAVEN EVIDENCE ${state.story.havenEvidence} // HEALTH ${Math.round(state.health)} // RAD ${Math.round(state.radiation)}`,choices:[
  ['Ambil Modul Sekarang','+2 Komponen • Modul Relay • risiko rendah',()=>relayFinish('quick'),'safe'],
  ['Salin Log','HAVEN Evidence +1 • +3 Komponen • 18% injury -5 • extra Rad +4',()=>relayFinish('logs'),'balanced'],
  ['Server Cadangan','+5 Komponen • 50% Filter • 38% injury -8 • extra Rad +6',()=>relayFinish('server'),'high']
 ]};render();
}
function relayFinish(mode){
 const run=view.expeditionRun;if(!run)return;
 let encounterInjury=0,extraRad=0;
 if(mode==='quick'){state.scrap+=2;run.loot.push('+2 Komponen');run.extras.push('Stage 2: Modul Relay diamankan.')}
 if(mode==='logs'){state.scrap+=3;state.story.havenEvidence++;extraRad=4;state.radiation=clamp(state.radiation+4);run.loot.push('+3 Komponen');run.extras.push('HAVEN Evidence +1');if(Math.random()<.18){encounterInjury=5;state.health=clamp(state.health-5);state.morale=clamp(state.morale-2);damageFx()}}
 if(mode==='server'){state.scrap+=5;extraRad=6;state.radiation=clamp(state.radiation+6);run.loot.push('+5 Komponen');if(Math.random()<.5){state.filters++;run.loot.push('+1 Filter')}if(Math.random()<.38){encounterInjury=8;state.health=clamp(state.health-8);state.morale=clamp(state.morale-2);damageFx()}}
 run.injury+=encounterInjury;run.encounter={mode:'relay',label:mode==='quick'?'MODULE ONLY':mode==='logs'?'COPY LOG':'BACKUP SERVER',extraRad};
 state.story.relayRecovered=true;state.progression.mainStage=9;pushStoryBeat('relay-recovered','Relay Recovered','Modul Relay dibawa kembali ke bunker dan membuka akses menuju jaringan HAVEN-3.','MISSION');if(!state.world.visited.includes('relay'))state.world.visited.push('relay');objective('expedition');log('Modul Relay berhasil dibawa pulang.');
 const travelInjury=fatigueRisk();run.injury+=travelInjury;
 view.modal=null;view.expeditionResult={id:'relay',name:run.name,time:run.time,risk:run.risk,started:run.started,ended:{day:state.day,hour:state.hour,health:state.health,hunger:state.hunger,thirst:state.thirst,fatigue:state.fatigue,morale:state.morale,radiation:state.radiation,power:state.power},rad:{...run.baseRad,total:(run.baseRad?.total||0)+extraRad,encounter:extraRad},loot:run.loot,injury:run.injury,extras:run.extras,encounter:run.encounter};view.expeditionRun=null;save();view.panel='expedition';render();
}

function panelTitle(id){return ({radio:'Radio',medis:'Medis',gudang:'Gudang',kasur:'Kasur',security:'Keamanan',generator:'Generator',workbench:'Meja Kerja',expedition:'Ekspedisi',questlog:'Quest Log',archive:'Story Archive',settings:'Settings'})[id]||'Bunker 7B'}
function formatSavedAt(ts){if(!ts)return 'BELUM TERCATAT';try{return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(ts)).toUpperCase()}catch{return 'LOCAL SAVE'}}
function saveDossier(){const s=load();if(!s)return `<div class="save-dossier empty"><div class="dossier-kicker">ACTIVE SAVE</div><strong>TIDAK ADA DATA</strong><p>Mulai Chapter 1 dari Hari 1 · 07:00.</p></div>`;const q=mainQuestFor(s.progression?.mainStage||1);return `<div class="save-dossier"><div class="dossier-top"><div><div class="dossier-kicker">ACTIVE SAVE // LOCAL</div><strong>${s.meta?.playerName||'PENGHUNI 7B'}</strong></div><span class="condition ${overallFor(s).toLowerCase()}">${overallFor(s)}</span></div><div class="save-grid"><div><small>HARI</small><b>${s.day}</b></div><div><small>WAKTU</small><b>${fmtHour(s.hour)}</b></div><div><small>LOKASI</small><b>${s.meta?.location||'Bunker 7B'}</b></div><div><small>LEVEL</small><b>${s.meta?.level??'—'}</b></div></div><div class="dossier-quest"><span>MAIN QUEST</span><b>${q[0]}</b></div><div class="dossier-foot">SAVE TERAKHIR // ${formatSavedAt(s.meta?.lastSavedAt)}</div></div>`}
function mainQuestFor(p){return ({1:['Stabilkan Bunker',''],2:['Pastikan Daya Bertahan',''],3:['Lihat Dunia Luar',''],4:['Cari Sinyal',''],5:['Bertahan Sampai Malam',''],6:['Cari Sinyal Kehidupan',''],7:['Ikuti Petunjuk ECHO-7',''],8:['Pulihkan Komunikasi',''],9:['Aktifkan Modul / HAVEN',''],10:['Bertahan sampai finale',''],11:['Chapter 1 Complete','']})[p]||['Chapter 1 Complete','']}
function overallFor(s){const c=(k,v)=>{const low=['hunger','thirst','fatigue','radiation'].includes(k);return low?(v>=80?'danger':v>=60?'warn':''):(v<=25?'danger':v<=45?'warn':'')};const vals=[c('health',s.health),c('hunger',s.hunger),c('thirst',s.thirst),c('fatigue',s.fatigue),c('morale',s.morale),c('radiation',s.radiation),c('power',s.power),c('integrity',s.integrity)];return vals.includes('danger')?'Kritis':vals.includes('warn')?'Waspada':'Aman'}
function menu(){const saved=hasSave();const install=installPrompt&&!isStandalone()?'<button class="menu-util" data-act="install"><span>INSTALL PWA</span><small>OFFLINE</small></button>':'';return `<main class="screen menu"><div class="menu-atmosphere"></div><div class="menu-frame"><div class="menu-topline"><span>LOCKDOWN PROTOCOL</span><span class="signal">● SYSTEM READY</span></div><div class="menu-inner"><div class="brand-block"><div class="eyebrow">Narrative Survival Management</div><div class="logo">LOCKDOWN</div><div class="chapter-mark">CHAPTER 01 // BUNKER 7B</div><p class="tagline">Bunker bukan tujuan akhir.<br>Bunker hanya membeli waktu.</p></div>${saved?saveDossier():''}<div class="menu-actions"><button class="btn primary continue-btn" data-act="continue" ${saved?'':'disabled'}><span>CONTINUE</span><small>${saved?'LANJUTKAN ACTIVE SAVE':'ACTIVE SAVE TIDAK DITEMUKAN'}</small></button><button class="btn newgame-btn" data-act="new"><span>NEW GAME</span><small>MULAI HARI 1 · 07:00</small></button></div><div class="menu-utils"><button class="menu-util" data-act="archive"><span>STORY ARCHIVE</span><small>TRANSMISSION</small></button><button class="menu-util" data-act="settings"><span>SETTINGS</span><small>AUDIO · HAPTIC</small></button><button class="menu-util" data-act="credits"><span>CREDITS</span><small>BUILD INFO</small></button>${install}</div><div class="version">PWA v0.18 · EMERGENCY & GAME STATE PASS</div></div></div></main>`}
function credits(){return `<main class="screen credits-screen"><header class="panel-head"><button class="back" data-act="back">‹</button><div><h2>CREDITS</h2><span>LOCKDOWN // CHAPTER 01</span></div></header><section class="credits-hero"><div class="credits-logo">LOCKDOWN</div><p>Narrative Survival Management · Android portrait · Offline PWA</p></section><section class="card credits-card"><div class="story-tag">PROJECT</div><h3>LOCKDOWN</h3><p>Chapter 1 · Hari 1–7. Survival, bunker management, survivor relationship, radio narrative, dan expedition/scavenging.</p></section><section class="card credits-card"><div class="story-tag">BUILD</div><p>HTML + CSS + Vanilla JavaScript<br>Local save · Offline-first · No account · No telemetry gameplay</p></section><div class="version">PWA v0.18 · EMERGENCY & GAME STATE PASS</div></main>`}

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
  <div class="quest-footer"><span>PRIORITAS UTAMA</span><b>${state.onboarding<4?'GUIDED ONBOARDING':'CHAPTER 01'}</b></div><button class="quest-log-link" data-panel="questlog">BUKA QUEST LOG <span>→</span></button>
 </section>
 <div class="section-head"><h3>Status</h3><span>${condition} · ${world.name}</span></div>
 <section class="stats dashboard-stats">${stats.map(([k,n,i,v])=>`<div class="stat ${statClass(k,v)}"><div class="stat-head"><span class="stat-name"><i>${i}</i>${n}</span><span class="stat-value">${Math.round(v)}</span></div><div class="bar"><i style="width:${v}%"></i></div><div class="stat-foot"><span>${statState(k,v)}</span><small>${['hunger','thirst','fatigue','radiation'].includes(k)?'RENDAH = BAIK':'TINGGI = BAIK'}</small></div></div>`).join('')}</section>
 <div class="section-head"><h3>Station</h3><span>${state.onboarding<4?'Onboarding '+(state.onboarding+1)+'/4':'8 station online'}</span></div>
 <section class="station-grid dashboard-stations">${stations.map(([id,n,ico,sub])=>{const locked=stationLocked(id)||isGameOver();const reason=stationLockReason(id);const upgradeKey=id==='security'?'keamanan':id;const hasLv=['generator','medis','kasur','security','workbench'].includes(id);return `<button class="station ${locked?'locked':''} ${id===activeOnboarding?'active-objective':''}" data-panel="${id}" ${locked?'disabled':''}><div class="station-top"><span class="ico">${ico}</span>${hasLv&&!stationLocked(id)?`<span class="badge">LV ${state.upgrades[upgradeKey]}</span>`:''}</div><span class="station-copy"><b>${n}</b><small>${sub}</small></span>${reason?`<span class="lock-reason">${reason}</span>`:''}</button>`}).join('')}</section>
 ${state.survivors.length?`<div class="section-head"><h3>Survivor</h3><span>Tension ${Math.round(state.relations.tension)} · ${tensionLabel()}</span></div><section class="card survivor-list survivor-dashboard">${state.survivors.map(s=>{const sq=survivorSideQuest(s);return `<button class="survivor" data-survivor="${s.id}"><div class="avatar">${s.name[0]}</div><div class="grow"><b>${s.name}</b><small>${s.role} · ${s.skill}</small>${sq&&!sq.done?`<em>SIDE // ${sq.name}</em>`:''}</div><div class="trust"><small>${trustLabelFor(s.trust).toUpperCase()}</small>${Math.round(s.trust)}</div></button>`}).join('')}</section>`:''}
 ${state.lastThreat?`<div class="section-head"><h3>Threat Report</h3><span>D${state.lastThreat.day} ${fmtHour(state.lastThreat.hour)}</span></div><section class="card threat-report"><div class="threat-icon">!</div><div><span>LAST EMERGENCY</span><b>${state.lastThreat.title||state.lastThreat.id||'Unknown Threat'}</b><p>${state.lastThreat.outcome||'Emergency resolved.'}</p></div></section>`:''}
 <div class="section-head"><h3>Daily Objective</h3><span>${done}/3 · reward otomatis</span></div>
 <section class="card objective-card"><div class="daily-progress"><i style="width:${done/3*100}%"></i></div>${state.dailyObjectives.map(o=>`<div class="objective ${o.done?'done':''}"><span class="dot">${o.done?'✓':''}</span><span>${o.text}</span></div>`).join('')}<div class="daily-reward"><span>3/3 REWARD</span><b>+2 Komponen · +1 Filter</b></div></section>
 <div class="section-head"><h3>Activity Log</h3><span>4 terbaru</span></div>
 <section class="card log-card">${state.logs.length?state.logs.slice(0,4).map(l=>`<div class="log"><time>D${l.day} ${fmtHour(l.hour)}</time>${l.text}</div>`).join(''):'<div class="log">Belum ada aktivitas.</div>'}</section>
 <div class="version">LOCKDOWN · PWA v0.18 · EMERGENCY & GAME STATE PASS</div>
 </main>`;
}
function sleepDeltaLabel(key,b,a){
 const delta=a-b;
 const highGood=['health','morale','power'].includes(key);
 const good=highGood?delta>=0:delta<=0;
 const abs=Math.abs(delta);
 return `<small class="${good?'benefit':'cost'}">${delta>0?'+':''}${Math.round(delta*10)/10}</small>`;
}
function sleepPreviewHtml(p){
 const rows=[['health','HEALTH'],['fatigue','FATIGUE'],['morale','MORAL'],['hunger','LAPAR'],['thirst','HAUS'],['power','DAYA']];
 return rows.map(([k,label])=>`<div class="sleep-preview-row"><span>${label}</span><b>${Math.round(p.before[k])} → ${Math.round(p.after[k])}</b>${sleepDeltaLabel(k,p.before[k],p.after[k])}</div>`).join('');
}
function sleepDayWarningHtml(){return `<section class="sleep-warning"><b>PERGANTIAN HARI</b><p>Tidur melewati 00:00. Daily survivor upkeep, objective baru, dan story yang memenuhi syarat dapat ikut diproses.</p></section>`}
function updateSleepPreview(){
 const r=$('#sleepRange');if(!r)return;
 const p=sleepPreview(Number(r.value));
 const label=$('#sleepLabel'),end=$('#sleepEndTime'),prev=$('#sleepPreview'),warn=$('#sleepDayWarning'),btn=$('#sleepButtonLabel'),meta=$('#sleepButtonMeta');
 if(label)label.textContent=p.hours+' JAM';
 if(end)end.textContent='→ D'+p.after.day+' '+fmtHour(p.after.hour);
 if(prev)prev.innerHTML=sleepPreviewHtml(p);
 if(warn)warn.innerHTML=p.crossesDay?sleepDayWarningHtml():'';
 if(btn)btn.textContent='TIDUR '+p.hours+' JAM';
 if(meta)meta.textContent='Selesai D'+p.after.day+' '+fmtHour(p.after.hour);
}
function panel(){
 const p=view.panel;
 let title='';
 let body='';
 const res=`<div class="resource-row"><span class="pill">Komponen <b>${state.scrap}</b></span><span class="pill">Filter <b>${state.filters}</b></span><span class="pill">Daya <b>${Math.round(state.power)}</b></span></div>`;

 if(p==='gudang'){
  title='Gudang';
  const foodEntries=Object.entries(state.items.foods).filter(([,x])=>x.qty>0);
  const drinkEntries=Object.entries(state.items.drinks).filter(([,x])=>x.qty>0);
  const foods=foodEntries.map(([id,x])=>warehouseItemCard(id,x,'food')).join()||'<section class="warehouse-empty"><b>FOOD RACK EMPTY</b><p>Tidak ada makanan tersisa. Prioritaskan ekspedisi ke Minimarket, apartemen, atau lokasi dengan food loot.</p></section>';
  const drinks=drinkEntries.map(([id,x])=>warehouseItemCard(id,x,'drink')).join()||'<section class="warehouse-empty"><b>DRINK RACK EMPTY</b><p>Tidak ada minuman tersisa. Dehidrasi menjadi ancaman utama saat Haus melewati 88.</p></section>';
  const crashLeft=Math.max(0,state.flags.coffeeCrashUntil-globalHour());
  body=`<section class="warehouse-status"><div><span>SUPPLY STORAGE // BUNKER 7B</span><strong>${totalFood()+totalDrink()>=6?'STOCK TERKENDALI':totalFood()+totalDrink()>=3?'STOCK MENIPIS':'STOCK KRITIS'}</strong><p>Gudang hanya menampilkan food dan drink. Item dengan stok 0 otomatis hilang dari rack.</p></div><div class="warehouse-counts"><div><small>FOOD</small><b>${totalFood()}</b></div><div><small>DRINK</small><b>${totalDrink()}</b></div></div></section>
  <section class="warehouse-body-state"><div class="${statClass('hunger',state.hunger)}"><span>LAPAR</span><b>${Math.round(state.hunger)}</b><small>${statState('hunger',state.hunger)}</small></div><div class="${statClass('thirst',state.thirst)}"><span>HAUS</span><b>${Math.round(state.thirst)}</b><small>${statState('thirst',state.thirst)}</small></div><div class="${statClass('fatigue',state.fatigue)}"><span>FATIGUE</span><b>${Math.round(state.fatigue)}</b><small>${statState('fatigue',state.fatigue)}</small></div><div class="${statClass('morale',state.morale)}"><span>MORAL</span><b>${Math.round(state.morale)}</b><small>${statState('morale',state.morale)}</small></div></section>
  ${crashLeft?`<section class="coffee-crash-active"><span>COFFEE CRASH ACTIVE</span><b>${crashLeft} jam tersisa</b><p>Fatigue rate +1.5/jam sampai efek berakhir.</p></section>`:''}
  <div class="section-head warehouse-section-head"><h3>Food Rack</h3><span>${totalFood()} unit</span></div><div class="warehouse-grid">${foods}</div>
  <div class="section-head warehouse-section-head"><h3>Drink Rack</h3><span>${totalDrink()} unit</span></div><div class="warehouse-grid">${drinks}</div>`;
 }

 if(p==='generator'){
  title='Generator';
  const lvl=state.upgrades.generator,raka=survivor('raka'),rakaActive=!!(raka&&raka.trust>=40);
  const baseDrain=generatorBaseDrain(lvl),drain=genDrain(),rakaDrain=Math.max(0,baseDrain-drain);
  const baseGain=generatorFuelGain(lvl),rakaGain=rakaActive?5:0,potentialGain=baseGain+rakaGain;
  const projectedPower=Math.min(100,state.power+potentialGain),actualGain=Math.max(0,projectedPower-state.power);
  const fuelCount=qty('fuel.fuel'),fuelDisabled=fuelCount<=0||state.power>=100;
  const reserve=drain>0?state.power/drain:0,powerState=statState('power',state.power);
  body=`<section class="generator-status"><div><span>POWER CONTROL // GENERATOR LV ${lvl}</span><strong>${powerState==='KRITIS'?'POWER CRITICAL':powerState==='WASPADA'?'CADANGAN MENIPIS':'OUTPUT STABLE'}</strong><p>Generator menguras Daya setiap jam. Level lebih tinggi menurunkan drain dan meningkatkan energi dari setiap Fuel.</p></div><div class="generator-output"><small>DAYA</small><b>${Math.round(state.power)}%</b><span>±${reserve.toFixed(1)} jam tersisa</span></div></section>
  <section class="generator-meter ${statClass('power',state.power)}"><div><span>POWER RESERVE</span><b>${Math.round(state.power)} / 100</b></div><div class="generator-bar"><i style="width:${state.power}%"></i></div><small>Drain aktif ${drain.toFixed(2)} Daya/jam${rakaActive?` · Raka menghemat ${rakaDrain.toFixed(2)}/jam`:''}.</small></section>
  <section class="generator-telemetry"><div><small>BASE DRAIN</small><b>${baseDrain.toFixed(2)}/j</b></div><div class="${rakaActive?'active':''}"><small>RAKA MOD</small><b>${rakaActive?'-0.08/j':'OFF'}</b></div><div><small>FUEL STOCK</small><b>×${fuelCount}</b></div><div><small>FUEL OUTPUT</small><b>+${potentialGain}</b></div></section>
  ${raka?`<section class="generator-tech ${rakaActive?'active':''}"><div class="avatar">R</div><div class="grow"><span>TECHNICIAN LINK</span><b>Raka · Trust ${Math.round(raka.trust)}</b><p>${rakaActive?'Passive aktif: drain -0.08/jam dan setiap Fuel mendapat +5 Daya.':'Trust 40 diperlukan untuk mengaktifkan passive teknisi.'}</p></div><div class="generator-tech-state">${rakaActive?'ACTIVE':'LOCKED'}</div></section>`:''}
  <div class="section-head generator-section-head"><h3>Fuel Injection</h3><span>${fuelCount} unit tersedia</span></div>
  <button class="generator-refuel ${fuelDisabled?'disabled':''}" data-act="fuel" ${fuelDisabled?'disabled':''}><div class="generator-refuel-icon">ϟ</div><div class="grow"><span>GENERATOR FEED</span><b>GUNAKAN 1 FUEL</b><p>Output potensial +${potentialGain} Daya. Preview menghitung cap maksimum 100.</p><div class="generator-refill-preview"><span>DAYA</span><b>${Math.round(state.power)} → ${Math.round(projectedPower)}</b><small>aktual +${Math.round(actualGain)}</small></div><div class="costs"><span class="cost">1 Fuel</span><span class="cost">0 jam</span><span class="cost">+${Math.round(actualGain)} Daya</span></div>${fuelCount<=0?'<div class="reason">Fuel habis. Cari di Pom Bensin atau Bengkel Otomotif.</div>':state.power>=100?'<div class="reason">Daya sudah maksimum. Fuel tidak perlu digunakan.</div>':''}</div></button>
  <div class="section-head generator-section-head"><h3>Station Upgrade</h3><span>drain turun · fuel output naik</span></div><div class="action-list generator-upgrade">${upgradeCard('generator','Generator')}</div>`;
 }

 if(p==='medis'){
  title='Medis';
  const medLv=state.upgrades.medis;
  const maya=survivor('maya');
  const baseHeal=28,upgradeBonus=(medLv-1)*5,mayaBonus=maya?8:0;
  const heal=baseHeal+upgradeBonus+mayaBonus;
  const projectedHealth=Math.min(100,state.health+heal),actualHeal=Math.max(0,projectedHealth-state.health);
  const projectedRad=Math.max(0,state.radiation-8),actualRad=Math.max(0,state.radiation-projectedRad);
  const meds=qty('meds.med');
  const healthState=statState('health',state.health),radState=statState('radiation',state.radiation);
  body=`<section class="medical-vitals">
   <div class="medical-vital ${statClass('health',state.health)}"><div class="medical-vital-top"><span>HEALTH</span><b>${Math.round(state.health)}</b></div><div class="medical-meter"><i style="width:${state.health}%"></i></div><small>${healthState} · tinggi = baik</small></div>
   <div class="medical-vital ${statClass('radiation',state.radiation)} radiation"><div class="medical-vital-top"><span>RADIASI</span><b>${Math.round(state.radiation)}</b></div><div class="medical-meter"><i style="width:${state.radiation}%"></i></div><small>${radState} · rendah = baik</small></div>
  </section>
  <section class="medical-diagnostic"><div><span>MEDICAL STATION // LV ${medLv}</span><strong>${healthState==='KRITIS'||radState==='KRITIS'?'INTERVENSI DISARANKAN':healthState==='WASPADA'||radState==='WASPADA'?'MONITOR KONDISI':'KONDISI TERKENDALI'}</strong><p>Obat Darurat memulihkan Health sekaligus menurunkan paparan radiasi. Bonus upgrade Medis dan skill Maya ditumpuk.</p></div><div class="medical-stock"><small>STOCK</small><b>×${meds}</b><span>OBAT</span></div></section>
  <div class="section-head medical-section-head"><h3>Potensi Treatment</h3><span>sebelum penggunaan</span></div>
  <section class="treatment-breakdown"><div><small>BASE HEAL</small><b>+${baseHeal}</b></div><div><small>MEDIS LV${medLv}</small><b>+${upgradeBonus}</b></div><div class="${maya?'active':'muted'}"><small>MAYA</small><b>+${mayaBonus}</b></div><div class="total"><small>TOTAL</small><b>+${heal}</b></div></section>
  <section class="treatment-preview"><div><span>HEALTH</span><b>${Math.round(state.health)} → ${Math.round(projectedHealth)}</b><small>aktual +${Math.round(actualHeal)}</small></div><div><span>RADIASI</span><b>${Math.round(state.radiation)} → ${Math.round(projectedRad)}</b><small>aktual -${Math.round(actualRad)}</small></div></section>
  <div class="section-head medical-section-head"><h3>Treatment</h3><span>${meds?meds+' dosis tersedia':'stok kosong'}</span></div>
  <button class="medical-treatment ${meds?'':'disabled'}" data-act="med" ${meds?'':'disabled'}><div class="medical-cross">✚</div><div class="grow"><span>OBAT DARURAT</span><b>Gunakan 1 Dosis</b><p>Health hingga +${heal} · Radiasi hingga -8. Efek aktual mengikuti batas stat 0–100.</p><div class="costs"><span class="cost">1 Obat</span><span class="cost">0 jam</span><span class="cost">Health +${Math.round(actualHeal)}</span><span class="cost">Rad -${Math.round(actualRad)}</span></div>${meds?'':'<div class="reason">Obat Darurat habis. Cari di Klinik atau event loot.</div>'}</div></button>
  ${maya?`<section class="medical-provider"><div class="avatar">M</div><div class="grow"><span>MEDICAL SUPPORT</span><b>Maya · Mantan Perawat</b><p>Skill aktif di station: setiap Obat Darurat mendapat bonus +8 Health.</p></div><div class="medical-provider-trust"><small>TRUST</small><b>${Math.round(maya.trust)}</b></div></section>`:''}
  <div class="section-head medical-section-head"><h3>Station Upgrade</h3><span>maksimum Lv3</span></div><div class="action-list medical-upgrade">${upgradeCard('medis','Medis')}</div>`;
 }

 if(p==='kasur'){
  title='Kasur';
  const sp=sleepPreview(4);
  const multLabel=sp.mult===1?'100%':Math.round(sp.mult*100)+'%';
  body=`<section class="sleep-status"><div><span>REST MODULE // BUNKER 7B</span><strong>${state.fatigue>=80?'KELELAHAN KRITIS':state.fatigue>=60?'ISTIRAHAT DISARANKAN':'KONDISI TERKENDALI'}</strong><p>Tidur memulihkan Health, Fatigue, dan Moral. Lapar, Haus, Daya, serta paparan dari bunker rusak tetap bergerak selama waktu berlalu.</p></div><div class="sleep-level"><small>KASUR</small><b>LV ${sp.lvl}</b><span>${sp.healHr}/j heal · -${sp.fatHr}/j fatigue</span></div></section>
  <section class="sleep-body-state"><div class="${statClass('health',state.health)}"><span>HEALTH</span><b>${Math.round(state.health)}</b><small>${statState('health',state.health)}</small></div><div class="${statClass('fatigue',state.fatigue)}"><span>FATIGUE</span><b>${Math.round(state.fatigue)}</b><small>${statState('fatigue',state.fatigue)}</small></div><div class="${statClass('hunger',state.hunger)}"><span>LAPAR</span><b>${Math.round(state.hunger)}</b><small>${statState('hunger',state.hunger)}</small></div><div class="${statClass('thirst',state.thirst)}"><span>HAUS</span><b>${Math.round(state.thirst)}</b><small>${statState('thirst',state.thirst)}</small></div></section>
  <section class="sleep-efficiency ${sp.mult<1?'limited':''}"><div><span>HEAL EFFICIENCY</span><b id="sleepHealEfficiency">${multLabel}</b></div><p id="sleepEfficiencyText">${state.fatigue>=85?'Fatigue ≥85: heal Kasur dikurangi menjadi 75%.':state.fatigue>=65?'Fatigue ≥65: heal Kasur dikurangi menjadi 90%.':'Fatigue di bawah 65: heal Kasur bekerja penuh.'}</p></section>
  <div class="section-head sleep-section-head"><h3>Durasi Istirahat</h3><span>1–8 jam</span></div>
  <section class="sleep-control"><div class="sleep-clock"><small>DURASI</small><b id="sleepLabel">4 JAM</b><span id="sleepEndTime">→ D${sp.after.day} ${fmtHour(sp.after.hour)}</span></div><input id="sleepRange" type="range" min="1" max="8" value="4"/><div class="sleep-scale"><span>1J</span><span>4J</span><span>8J</span></div></section>
  <div class="section-head sleep-section-head"><h3>Preview</h3><span>sebelum → sesudah</span></div>
  <section class="sleep-preview" id="sleepPreview">${sleepPreviewHtml(sp)}</section>
  <div id="sleepDayWarning">${sp.crossesDay?sleepDayWarningHtml():''}</div>
  <button class="sleep-confirm" data-act="sleep"><span>ISTIRAHAT</span><b id="sleepButtonLabel">TIDUR 4 JAM</b><small id="sleepButtonMeta">Selesai D${sp.after.day} ${fmtHour(sp.after.hour)}</small></button>
  <div class="section-head sleep-section-head"><h3>Station Upgrade</h3><span>maksimum Lv3</span></div><div class="action-list sleep-upgrade">${upgradeCard('kasur','Kasur')}</div>`;
 }

 if(p==='security'){
  title='Keamanan';
  const lvl=state.upgrades.keamanan;
  const c=[0,5,4,3][lvl],rep=[0,10,13,16][lvl],wc=worldCond();
  const scouted=state.world.scoutedDay===state.day;
  const integrityState=statState('integrity',state.integrity);
  const projectedIntegrity=Math.min(100,state.integrity+rep),actualRepair=Math.max(0,projectedIntegrity-state.integrity);
  const scanDisabled=scouted||state.power<c;
  const repairDisabled=state.integrity>=100||state.scrap<2;
  const worldRad=Number(wc.rad)||0,fieldRad=worldRad-(scouted?2:0);
  const fmtSigned=n=>`${n>0?'+':''}${n}`;
  body=`<section class="security-status"><div><span>SECURITY CONTROL // LV ${lvl}</span><strong>${integrityState==='KRITIS'?'STRUCTURAL ALERT':integrityState==='WASPADA'?'MAINTENANCE REQUIRED':'PERIMETER STABLE'}</strong><p>Keamanan menghubungkan kondisi bunker dengan risiko permukaan. Scout berlaku sampai pergantian hari.</p></div><div class="security-level"><small>BUNKER</small><b>${Math.round(state.integrity)}%</b><span>${integrityState}</span></div></section>
  <section class="security-integrity ${statClass('integrity',state.integrity)}"><div class="security-integrity-top"><span>STRUCTURAL INTEGRITY</span><b>${Math.round(state.integrity)} / 100</b></div><div class="security-meter"><i style="width:${state.integrity}%"></i></div><small>${state.integrity<=25?'Keruntuhan bunker semakin dekat. Repair segera.':state.integrity<=45?'Struktur melemah dan membutuhkan repair.':'Struktur masih berada dalam batas operasional.'}</small></section>
  <section class="security-scout ${scouted?'active':''}"><div class="security-radar"><i></i><i></i><i></i><span></span></div><div class="grow"><span>SURFACE SCOUT // DAY ${state.day}</span><b>${scouted?'SCOUT ACTIVE':'NO CURRENT SCAN'}</b><p>${scouted?'Data permukaan sudah dikalibrasi. Semua ekspedisi hari ini mendapat pengurangan Radiasi -2.':'Belum ada pemindaian aktif untuk hari ini.'}</p></div><div class="security-scout-state"><small>FIELD RAD</small><b>${fmtSigned(fieldRad)}</b><span>world ${fmtSigned(worldRad)}${scouted?' · scout -2':''}</span></div></section>
  <section class="security-world"><div><small>KONDISI LUAR</small><b>${wc.name}</b></div><div><small>RAD MOD</small><b>${fmtSigned(worldRad)}</b></div><div><small>FATIGUE</small><b>${fmtSigned(wc.fatigue)}</b></div><div><small>THIRST</small><b>${fmtSigned(wc.thirst)}</b></div></section>
  <div class="section-head security-section-head"><h3>Surface Scan</h3><span>${scouted?'aktif sampai besok':'belum aktif'}</span></div>
  <button class="security-action scan ${scanDisabled?'disabled':''}" data-act="scan" ${scanDisabled?'disabled':''}><div class="security-action-icon">◉</div><div class="grow"><span>PERIMETER SCAN</span><b>${scouted?'SCOUT SUDAH AKTIF':'PINDAI AREA LUAR'}</b><p>${scouted?'Pemindaian ulang hari ini tidak memberi manfaat tambahan.':`Gunakan ${c} Daya dan 1 jam untuk mengurangi Radiasi semua ekspedisi hari ini.`}</p><div class="costs"><span class="cost">${c} Daya</span><span class="cost">+1 jam</span><span class="cost">Expedition Rad -2</span></div>${scouted?'<div class="reason">Scout hari ini sudah aktif.</div>':state.power<c?'<div class="reason">Daya tidak cukup.</div>':''}</div></button>
  <div class="section-head security-section-head"><h3>Structural Repair</h3><span>2 Komponen / repair</span></div>
  <button class="security-action repair ${repairDisabled?'disabled':''}" data-act="repair" ${repairDisabled?'disabled':''}><div class="security-action-icon">▧</div><div class="grow"><span>STRUCTURAL MAINTENANCE</span><b>REPAIR BUNKER</b><p>Keamanan Lv${lvl} dapat memulihkan hingga +${rep} Integrity per repair.</p><div class="security-repair-preview"><span>INTEGRITY</span><b>${Math.round(state.integrity)} → ${Math.round(projectedIntegrity)}</b><small>aktual +${Math.round(actualRepair)}</small></div><div class="costs"><span class="cost">2 Komponen</span><span class="cost">Bunker +${Math.round(actualRepair)}</span><span class="cost">0 jam</span></div>${state.integrity>=100?'<div class="reason">Integritas bunker sudah maksimum.</div>':state.scrap<2?'<div class="reason">Komponen tidak cukup.</div>':''}</div></button>
  <div class="section-head security-section-head"><h3>Station Upgrade</h3><span>scan lebih hemat · repair lebih kuat</span></div><div class="action-list security-upgrade">${upgradeCard('keamanan','Keamanan')}</div>`;
 }

 if(p==='workbench'){
  title='Meja Kerja';
  const lvl=state.upgrades.workbench,fc=[0,3,2,1][lvl],pc=lvl===3?3:4;
  const plateAfter=Math.min(100,state.integrity+15),plateActual=Math.max(0,plateAfter-state.integrity);
  const filterDisabled=state.scrap<fc,plateDisabled=state.scrap<pc||state.integrity>=100;
  const upgradeKeys=['generator','medis','kasur','keamanan','workbench'];
  body=`<section class="workbench-status"><div><span>FABRICATION BENCH // LV ${lvl}</span><strong>${state.scrap>=5?'MATERIAL READY':state.scrap>=2?'MATERIAL LIMITED':'MATERIAL CRITICAL'}</strong><p>Komponen dipakai untuk crafting, repair, dan upgrade. Meja Kerja menjadi gateway peningkatan semua sistem bunker.</p></div><div class="workbench-scrap"><small>KOMPONEN</small><b>${state.scrap}</b><span>AVAILABLE</span></div></section>
  <section class="workbench-inventory"><div><small>FILTER</small><b>${state.filters}</b><span>ventilation / rad event</span></div><div><small>BUNKER</small><b>${Math.round(state.integrity)}%</b><span>${statState('integrity',state.integrity)}</span></div><div><small>CRAFT LV</small><b>${lvl}</b><span>max 3</span></div></section>
  <div class="section-head workbench-section-head"><h3>Fabrication</h3><span>0 jam · langsung selesai</span></div>
  <div class="workbench-craft-grid">
   <button class="workbench-craft ${filterDisabled?'disabled':''}" data-craft="filter" ${filterDisabled?'disabled':''}><div class="workbench-craft-icon">◫</div><span>CONSUMABLE</span><b>CRAFT FILTER</b><p>Filter digunakan pada kontaminasi ventilasi dan beberapa event radiasi.</p><div class="craft-output"><div><small>STOCK</small><b>${state.filters} → ${state.filters+1}</b></div><div><small>COST</small><b>${fc} Komp</b></div></div><div class="costs"><span class="cost">-${fc} Komponen</span><span class="cost">+1 Filter</span><span class="cost">0 jam</span></div>${filterDisabled?'<div class="reason">Komponen tidak cukup.</div>':''}</button>
   <button class="workbench-craft plate ${plateDisabled?'disabled':''}" data-craft="plate" ${plateDisabled?'disabled':''}><div class="workbench-craft-icon">▧</div><span>STRUCTURAL</span><b>BUNKER PLATE</b><p>Fabricate dan pasang plate untuk memulihkan hingga +15 Integrity.</p><div class="craft-output"><div><small>INTEGRITY</small><b>${Math.round(state.integrity)} → ${Math.round(plateAfter)}</b></div><div><small>AKTUAL</small><b>+${Math.round(plateActual)}</b></div></div><div class="costs"><span class="cost">-${pc} Komponen</span><span class="cost">Bunker +${Math.round(plateActual)}</span><span class="cost">0 jam</span></div>${state.integrity>=100?'<div class="reason">Integritas bunker sudah maksimum.</div>':state.scrap<pc?'<div class="reason">Komponen tidak cukup.</div>':''}</button>
  </div>
  <section class="workbench-efficiency"><div><small>FILTER COST</small><b>${fc}</b><span>Lv1 3 · Lv2 2 · Lv3 1</span></div><div><small>PLATE COST</small><b>${pc}</b><span>Lv3 turun menjadi 3</span></div></section>
  <div class="section-head workbench-section-head"><h3>Bunker Upgrades</h3><span>5 Komp → Lv2 · 9 Komp → Lv3</span></div>
  <div class="upgrade-grid">${upgradeKeys.map(k=>upgradeCard(k,UPGRADE_LABELS[k])).join('')}</div>`;
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
  const ready=expeditionReadiness(),wc=worldCond(),scouted=state.world.scoutedDay===state.day,result=view.expeditionResult;
  const fmt=n=>`${n>0?'+':''}${Math.round(n*10)/10}`;
  const readiness=ready.checks.map(x=>`<div class="exp-ready ${x.ok?'ok':'bad'}"><span>${x.label}</span><b>${Math.round(x.value)}</b><small>${x.rule}</small></div>`).join('');
  const resultHtml=result?`<section class="exp-result"><div class="exp-result-top"><div><span>EXPEDITION COMPLETE</span><strong>${result.name}</strong><p>D${result.started.day} ${fmtHour(result.started.hour)} → D${result.ended.day} ${fmtHour(result.ended.hour)} · ${result.time} jam</p></div><div class="risk ${result.risk.toLowerCase()}">${result.risk}</div></div><div class="exp-result-stats"><div><small>HEALTH</small><b>${Math.round(result.started.health)} → ${Math.round(result.ended.health)}</b></div><div><small>FATIGUE</small><b>${Math.round(result.started.fatigue)} → ${Math.round(result.ended.fatigue)}</b></div><div><small>RADIASI</small><b>${Math.round(result.started.radiation)} → ${Math.round(result.ended.radiation)}</b></div><div><small>DAYA</small><b>${Math.round(result.started.power)} → ${Math.round(result.ended.power)}</b></div></div><div class="exp-result-loot"><span>LOOT RECOVERED</span>${result.loot.length?result.loot.map(x=>`<b>${x}</b>`).join(''):'<b>Tidak ada loot berarti.</b>'}${result.encounter?`<p class="encounter-result">Pendekatan: <b>${result.encounter.label}</b>${result.rad?.encounter?` • Encounter Rad +${result.rad.encounter}`:''}</p>`:''}${result.injury?`<p class="danger-text">Total cedera: Health -${result.injury}</p>`:''}${result.extras.map(x=>`<p>${x}</p>`).join('')}</div><button class="btn primary" data-act="exp-result-close">KEMBALI KE PETA</button></section>`:'';
  const locations=Object.entries(LOCS).map(([id,l])=>{
   const unlocked=isLocationUnlocked(id),r=expeditionRadiation(id),p=expeditionTravelPreview(id),can=unlocked&&ready.ok;
   const visited=state.world.visited.includes(id),story=id==='relay'||id==='depot';
   return `<section class="exp-location ${unlocked?'':'locked'} ${story?'story':''}"><div class="exp-location-top"><div><span>${story?'STORY LOCATION':'SURFACE LOCATION'}${visited?' · VISITED':''}</span><b>${l.name}</b></div><span class="risk ${l.risk.toLowerCase()}">${l.risk}</span></div><p>${l.focus}</p><div class="exp-metrics"><div><small>WAKTU</small><b>${l.time} jam</b></div><div><small>BASE RAD</small><b>${l.rad}</b></div><div><small>EST. RAD</small><b>+${Math.round(r.total)}</b></div><div><small>FATIGUE</small><b>${Math.round(state.fatigue)}→${Math.round(p.after.fatigue)}</b></div></div><div class="costs"><span class="cost">World ${fmt(r.world)} Rad</span>${r.scout?'<span class="cost scout">Scout -2 Rad</span>':''}<span class="cost">Loot: ${l.focus}</span></div>${unlocked?`<button class="btn ${story?'primary':''}" data-exp="${id}" ${can?'':'disabled'}>${can?'RENCANAKAN EKSPEDISI':'KONDISI TIDAK LAYAK'}</button>`:`<button class="btn" disabled>TERKUNCI</button><div class="reason">${locationUnlockReason(id)}</div>`}</section>`;
  }).join('');
  body=`${resultHtml}<section class="exp-command"><div><span>EXPEDITION CONTROL // DAY ${state.day}</span><strong>${ready.ok?'FIELD READY':'DEPARTURE LOCKED'}</strong><p>Ekspedisi memakai waktu bunker nyata. Lapar, Haus, Fatigue, Daya, dan survival damage terus berjalan selama perjalanan.</p></div><div class="exp-world"><small>WORLD</small><b>${wc.name}</b><span>Rad ${fmt(wc.rad)}${scouted?' · Scout -2':''}</span></div></section><section class="exp-readiness">${readiness}</section>${!ready.ok?'<div class="exp-warning"><b>Lanjut Jelajah nonaktif.</b><p>Semua syarat readiness harus lolos sebelum berangkat.</p></div>':''}<section class="exp-scout ${scouted?'active':''}"><div><span>SURFACE INTEL</span><b>${scouted?'SCOUT ACTIVE':'NO SCOUT DATA'}</b></div><p>${scouted?'Security scan aktif untuk Hari '+state.day+'. Estimasi Radiasi semua lokasi dikurangi 2.':'Scan di Keamanan sebelum berangkat untuk menurunkan estimasi Radiasi sebesar 2 hari ini.'}</p></section><div class="section-head exp-section-head"><h3>Lokasi Permukaan</h3><span>11 lokasi · locked tetap terlihat</span></div><div class="exp-location-list">${locations}</div>`;
 }

 if(p==='survivor'){
  title='Survivor';
  const s=survivor(view.survivorId)||state.survivors[0];
  if(s){const q=survivorSideQuest(s),talked=s.lastTalkDay===state.day,helped=s.lastHelpDay===state.day,canHelp=s.trust>=50&&!helped;
   body=`<section class="survivor-command"><div class="survivor-ident"><div class="avatar large">${s.name[0]}</div><div><span>SURVIVOR // JOINED DAY ${s.joinedDay}</span><h2>${s.name}</h2><p>${s.role} · ${s.personality} · ${s.skill}</p></div></div><div class="trust-module"><div><span>TRUST</span><b>${Math.round(s.trust)}</b><em>${trustLabelFor(s.trust)}</em></div><div class="trust-bar"><i style="width:${s.trust}%"></i></div></div></section>
   <section class="relation-snapshot"><div><small>RELATION TENSION</small><b>${Math.round(state.relations.tension)} / 100</b><span>${tensionLabel()}</span></div><p>${state.survivors.length>1?'Trust, Moral, dan stok harian dapat menaikkan atau menurunkan ketegangan antar survivor.':'Ketegangan antar survivor mulai relevan setelah penghuni kedua bergabung.'}</p></section>
   ${q?`<section class="survivor-sidequest ${q.done?'done':''}"><div class="story-tag">SIDE QUEST // ${q.done?'COMPLETED':'ACTIVE'}</div><h3>${q.name}</h3><p>${q.done?'Objective selesai: '+q.location+'.':q.objective}</p><div class="costs"><span class="cost">${q.location}</span><span class="cost">${q.reward}</span></div></section>`:''}
   <div class="action-list survivor-actions"><button class="action ${talked?'disabled':''}" data-talk="${s.id}" ${talked?'disabled':''}><b>Bicara</b><p>${talked?'Sudah dilakukan hari ini.':'Trust +4 · Moral +2'+(state.survivors.length>1?' · Tension -3':'')+' · sekali/hari.'}</p></button><button class="action ${totalFood()>0?'':'disabled'}" data-feed="${s.id}" ${totalFood()>0?'':'disabled'}><b>Bagikan Makanan</b><p>${totalFood()>0?'Consume 1 makanan · Trust +7 · Moral +3 · Tension -4.':'Makanan tidak tersedia.'}</p></button><button class="action ${canHelp?'':'disabled'}" data-help="${s.id}" ${canHelp?'':'disabled'}><b>${s.id==='maya'?'Bantuan Medis':'Tuning Generator'}</b><p>${helped?'Sudah digunakan hari ini.':s.trust<50?'Trust 50 diperlukan.':(s.id==='maya'?'Health +8 · Moral +2':'Daya +8 · Moral +1')+' · sekali/hari.'}</p></button></div>
   <section class="upkeep-card"><div><span>DAILY UPKEEP</span><b>1 Food + 1 Drink / survivor</b></div><p>Terpenuhi: Trust +1, Moral +1. Kekurangan: Trust -8, Moral -5, Tension +6.</p></section>`;
  } else body='<div class="card">Belum ada survivor.</div>';
 }

 if(p==='questlog'){
  title='Quest Log';const qd=questLogData();
  body=`<section class="questlog-command"><div><span>CHAPTER 01 // QUEST CONTROL</span><strong>${state.story.chapterComplete?'CHAPTER COMPLETE':'OBJECTIVES ACTIVE'}</strong><p>Main Quest menggerakkan Chapter. Side Quest mendorong cerita survivor. Daily Objective tetap terpisah.</p></div><div class="questlog-count"><small>MAIN STAGE</small><b>${Math.min(qd.main.stage,10)} / 10</b></div></section>
  <div class="quest-tabs-label">MAIN</div><section class="questlog-card main"><div class="questlog-meta"><span>ACTIVE</span><b>STAGE ${Math.min(qd.main.stage,10)}</b></div><h3>${qd.main.title}</h3><p>${qd.main.text}</p><div class="quest-progress"><i style="width:${Math.min(100,(Math.min(qd.main.stage,10)/10)*100)}%"></i></div></section>
  <div class="quest-tabs-label">SIDE</div>${qd.sides.length?`<section class="questlog-stack">${qd.sides.map(({survivor:s,quest:q})=>`<button class="questlog-card side" data-survivor="${s.id}"><div class="questlog-meta"><span>${s.name.toUpperCase()}</span><b>ACTIVE</b></div><h3>${q.name}</h3><p>${q.objective}</p><div class="questlog-reward"><span>REWARD</span><b>${q.reward}</b></div></button>`).join('')}</section>`:'<section class="questlog-empty">Belum ada Side Quest aktif.</section>'}
  <div class="quest-tabs-label">COMPLETED</div>${qd.completed.length?`<section class="questlog-stack completed">${qd.completed.map(([type,name,text])=>`<div class="questlog-card completed"><div class="questlog-meta"><span>${type}</span><b>✓ SELESAI</b></div><h3>${name}</h3><p>${text}</p></div>`).join('')}</section>`:'<section class="questlog-empty">Belum ada quest yang selesai.</section>'}`;
 }

 if(p==='archive'){
  title='Story Archive';
  const visited=state.world.visited.map(x=>LOCS[x]?.name||x);
  const journal=storyArchiveEntries();
  const radio=Array.isArray(state.story.radioArchive)?state.story.radioArchive:[];
  const finale=choiceLabel(state.story.finaleChoice,{east:'KORIDOR TIMUR',prepare:'PERKUAT BUNKER',isolate:'PUTUS KONTAK'});
  const echo=choiceLabel(state.story.echoResponse,{reply:'BALAS SINGKAT',silent:'TETAP DIAM'});
  const haven=choiceLabel(state.story.havenChoice,{send:'HANDSHAKE SENT',keep:'INDEPENDENT'});
  body=`<section class="archive-command"><div><span>CHAPTER 01 // STORY RECORD</span><strong>${state.story.chapterComplete?'CHAPTER COMPLETE':'CHAPTER IN PROGRESS'}</strong><p>Transmission, keputusan, evidence, dan milestone yang sudah benar-benar terjadi di save ini.</p></div><div class="archive-progress"><small>DAY</small><b>${Math.min(state.day,7)} / 7</b></div></section>
  <section class="archive-state"><div><small>ECHO-7</small><b>${echo}</b></div><div><small>RELAY</small><b>${state.story.relayRecovered?'RECOVERED':state.story.relayUnlocked?'LOCATED':'—'}</b></div><div><small>HAVEN-3</small><b>${haven}</b></div><div><small>EVIDENCE</small><b>${state.story.havenEvidence}</b></div><div><small>FINALE</small><b>${finale}</b></div><div><small>TRANSMISSION</small><b>${state.story.transmissions}</b></div></section>
  <div class="archive-label">CHAPTER TIMELINE</div>${journal.length?`<section class="archive-timeline">${journal.map(x=>`<article class="archive-entry"><div class="archive-entry-meta"><span>${x.kind}</span><time>D${x.day} ${fmtHour(x.hour)}</time></div><h3>${x.title}</h3><p>${x.text}</p></article>`).join('')}</section>`:'<section class="questlog-empty">Belum ada story beat yang tercatat.</section>'}
  <div class="archive-label">RADIO ARCHIVE</div>${radio.length?`<section class="archive-radio">${radio.slice(0,12).map(x=>`<article><div><span>${x.kind||'RX'}</span><time>D${x.day} ${fmtHour(x.hour)}</time></div><b>${x.label}</b><p>${x.text}</p></article>`).join('')}</section>`:'<section class="questlog-empty">Belum ada transmission tersimpan.</section>'}
  <div class="archive-label">SURFACE RECORD</div><section class="archive-visited">${visited.length?visited.map(x=>`<span>${x}</span>`).join(''):'<span>Belum ada lokasi dikunjungi.</span>'}</section>
  <button class="btn" style="width:100%" data-act="replay-prologue">REPLAY PROLOGUE</button>`;
 }

 if(p==='settings'){
  title='Settings';
  body=settingsPanel();
 }

 const panelClass=p==='radio'?'radio-panel':p==='medis'?'medical-panel':p==='gudang'?'warehouse-panel':p==='kasur'?'sleep-panel':p==='expedition'?'expedition-panel':p==='survivor'?'survivor-panel':p==='questlog'?'questlog-panel':p==='archive'?'archive-panel':'';
 const headClass=p==='radio'?'radio-head':p==='medis'?'medical-head':p==='gudang'?'warehouse-head':p==='kasur'?'sleep-head':p==='expedition'?'expedition-head':p==='survivor'?'survivor-head':p==='questlog'?'questlog-head':p==='archive'?'archive-head':'';
 const subtitle=p==='radio'?'COMMUNICATION STATION // OFFLINE ARCHIVE':p==='medis'?'MEDICAL STATION // HEALTH & RADIATION':p==='gudang'?'SUPPLY STORAGE // FOOD & DRINK':p==='kasur'?'REST MODULE // SLEEP & RECOVERY':p==='expedition'?'SURFACE OPERATIONS // RISK & LOOT':p==='survivor'?'SURVIVOR RELATION // TRUST & UPKEEP':p==='questlog'?'OBJECTIVE CONTROL // MAIN · SIDE · COMPLETED':p==='archive'?'CHAPTER RECORD // TRANSMISSION · CHOICE · EVIDENCE':'';
 return `<main class="screen panel ${panelClass}"><header class="panel-head ${headClass}"><button class="back" data-act="back">←</button><div class="grow"><h1>${title}</h1>${subtitle?`<span>${subtitle}</span>`:''}</div><small>D${state.day} ${fmtHour()}</small></header>${body}</main>`;
}
function upgradeCard(key,label){
 const lvl=state.upgrades[key],cost=lvl===1?5:lvl===2?9:0,max=lvl>=3,insufficient=!max&&state.scrap<cost;
 const current=upgradeEffectSummary(key,lvl),next=max?'UPGRADE MAKSIMUM':upgradeEffectSummary(key,lvl+1);
 return `<button class="upgrade-card ${max?'max':''} ${insufficient?'disabled':''}" data-upgrade="${key}" ${(max||insufficient)?'disabled':''}><div class="upgrade-card-top"><div><span>${label.toUpperCase()}</span><b>LV ${lvl}${max?' · MAX':' → LV '+(lvl+1)}</b></div><div class="upgrade-level">${max?'MAX':cost+' K'}</div></div><div class="upgrade-flow"><p><small>SEKARANG</small>${current}</p><i>→</i><p><small>${max?'STATUS':'SETELAH UPGRADE'}</small>${next}</p></div><div class="costs"><span class="cost">${max?'Upgrade Maksimum':cost+' Komponen'}</span><span class="cost">0 jam</span></div>${insufficient?'<div class="reason">Komponen tidak cukup.</div>':''}</button>`;
}
function settingsPanel(){const range=(key,label)=>`<label class="setting-range"><span>${label}<b id="${key}Label">${state.settings[key]}</b></span><input type="range" min="0" max="100" value="${state.settings[key]}" data-volume="${key}"></label>`;return `<div class="card setting-card"><div class="objective"><span>SFX</span><span style="margin-left:auto"><input type="checkbox" data-setting="sfx" ${state.settings.sfx?'checked':''}></span></div><div class="objective"><span>Ambience</span><span style="margin-left:auto"><input type="checkbox" data-setting="ambience" ${state.settings.ambience?'checked':''}></span></div><div class="objective"><span>Vibration</span><span style="margin-left:auto"><input type="checkbox" data-setting="vibration" ${state.settings.vibration?'checked':''}></span></div></div><div class="card setting-card">${range('master','Master Volume')}${range('sfxVol','SFX Volume')}${range('ambienceVol','Ambience Volume')}</div><p class="settings-note">Ambience memakai Bunker AMBIENCE.wav dengan crossfade-loop selama gameplay. Radio/Craft/Heal tetap memakai SFX asset lokal; Heal hanya memainkan detik 9–11.</p><button class="btn" style="width:100%;margin-bottom:8px" data-act="to-menu">MAIN MENU</button><button class="btn danger" style="width:100%" data-act="restart">RESTART GAME</button>`}
function modal(){if(!view.modal)return'';const kind=view.modal.kind||'decision';return `<div class="modal-wrap ${kind}-wrap"><div class="modal ${kind}-modal"><div class="story-tag">${view.modal.tag||'DECISION'}</div><h2>${view.modal.title}</h2><p>${view.modal.text}</p>${view.modal.meta?`<div class="modal-meta">${view.modal.meta}</div>`:''}<div class="choice">${view.modal.choices.map((c,i)=>`<button class="btn ${i===0&&!c[3]?'primary':''} ${c[3]||''}" data-choice="${i}" ${c[4]?'disabled':''}>${c[0]}<small>${c[1]||''}</small></button>`).join('')}</div></div></div>`}
function render(){if(state&&view.screen==='game'&&isGameOver()&&(!view.modal||view.modal.kind!=='gameover'))view.modal=buildGameOverModal();let html=view.screen==='menu'?menu():view.screen==='prologue'?prologue():view.screen==='credits'?credits():view.panel?panel():dashboard();$('#app').innerHTML=html+modal();bind();AudioUI.scene();}
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
 const r=$('#sleepRange');if(r)r.oninput=updateSleepPreview;
 const pg=document.querySelector('.prologue');
 if(pg){
  pg.addEventListener('click',e=>{if(!e.target.closest('button'))act('prologue-next')});
  let sx=0,sy=0;
  pg.addEventListener('touchstart',e=>{const t=e.changedTouches[0];sx=t.clientX;sy=t.clientY},{passive:true});
  pg.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.25&&dx<0)act('prologue-next')},{passive:true});
 }
}
function act(a){if(a==='install'){if(installPrompt){installPrompt.prompt();installPrompt.userChoice.finally(()=>{installPrompt=null;render()})}else toast('Gunakan menu browser → Install app');return}if(a==='continue'){state=load();view.screen='game';view.panel=null;if(isGameOver())presentGameOver();else render()}if(a==='new'){if(hasSave()&&!confirm('Active save akan diganti. Mulai game baru?'))return;state=fresh();localStorage.setItem(SAVE,JSON.stringify(state));view.screen='prologue';view.prologueFrame=0;render()}if(a==='archive'){state=load()||fresh();view.screen='game';view.panel='archive';render()}if(a==='settings'){state=load()||fresh();view.screen='game';view.panel='settings';render()}if(a==='credits'){view.screen='credits';view.panel=null;render()}if(a==='prologue-next'){if(view.prologueFrame<6){view.prologueFrame++;render()}else{state.story.prologueDone=true;log('LOCKDOWN engaged. Day 1 07:00.');save();view.screen='game';view.panel=null;render()}}if(a==='skip'){if(!isGameOver())advance(1)}if(a==='menu'){view.panel='settings';render()}if(a==='back')back();if(a==='fuel')fuel();if(a==='med')useMed();if(a==='scan')scan();if(a==='repair')repair();if(a==='sleep'){const h=Number($('#sleepRange')?.value||4);sleep(h)}if(a==='radio-story')radioStory();if(a==='radio-random')radioRandom();if(a==='exp-result-close'){view.expeditionResult=null;if(!postTimeActionEvents())render();}if(a==='replay-prologue'){view.screen='prologue';view.panel=null;view.prologueFrame=0;render()}if(a==='to-menu'){view.screen='menu';view.panel=null;save();render()}if(a==='restart'){if(confirm('Hapus active game save dan mulai ulang dari Day 1 07:00? Settings audio/haptic dipertahankan.'))restartGame()}}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;if(view.screen==='menu')render()});window.addEventListener('appinstalled',()=>{installPrompt=null;toast('LOCKDOWN terpasang')});window.addEventListener('pagehide',()=>{save();AudioUI.background()});document.addEventListener('visibilitychange',()=>{if(document.hidden){save();AudioUI.background()}else AudioUI.foreground()});window.addEventListener('keydown',e=>{if(e.key==='Escape')back()});window.addEventListener('popstate',()=>back());
if('serviceWorker'in navigator)window.addEventListener('load',async()=>{try{const reg=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});await reg.update()}catch(_){}});
preloadPrologue();state=load();view.screen='menu';render();
})();
