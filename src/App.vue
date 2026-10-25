<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { Exercise, Manifest, Area } from './domain';
import { areaNames } from './domain';
import { generateRoutine, dateKey } from './routine';
import { speak, stopSpeech, beep } from './speech';

type Screen='home'|'library'|'detail'|'workout'|'complete';
const screen=ref<Screen>('home');
const library=ref<Exercise[]>([]);
const loading=ref(true);
const error=ref('');
const selected=ref<Exercise|null>(null);
const areaFilter=ref<Area|'all'>('all');
const audio=ref(localStorage.getItem('face-ritual-audio')!=='off');
const routine=computed(()=>generateRoutine(library.value,dateKey(new Date())));
const filtered=computed(()=>areaFilter.value==='all'?library.value:library.value.filter(e=>e.areas.includes(areaFilter.value as Area)));
const index=ref(0),remaining=ref(0),paused=ref(true),cue=ref('');
let interval:number|undefined;
let deadline=0;
let activeCue=-1;
const current=computed(()=>routine.value[index.value]);
const total=computed(()=>routine.value.reduce((n,e)=>n+e.durationSeconds,0));
const elapsed=computed(()=>routine.value.slice(0,index.value).reduce((n,e)=>n+e.durationSeconds,0)+(current.value?current.value.durationSeconds-remaining.value:0));
const progress=computed(()=>total.value?Math.min(100,elapsed.value/total.value*100):0);
const areaLabels=(e:Exercise)=>e.areas.map(a=>areaNames[a]).join(', ');
const imageUrl=(path:string)=>import.meta.env.BASE_URL+path.replace(/^\/+/,'');

onMounted(async()=>{
 try {
  const response=await fetch(import.meta.env.BASE_URL+'exercises/manifest.json');
  if(!response.ok)throw new Error('Библиотека пока не загружена');
  const data=await response.json() as Manifest;
  library.value=(data.exercises??[]).filter(e=>e.approved && e.imagePath && e.durationSeconds>0);
 }catch(e){error.value=e instanceof Error?e.message:'Не удалось загрузить библиотеку';}
 finally{loading.value=false;}
 document.addEventListener('visibilitychange',onVisibility);
});
onUnmounted(()=>{clearInterval(interval);stopSpeech();document.removeEventListener('visibilitychange',onVisibility);});
watch(audio,v=>{localStorage.setItem('face-ritual-audio',v?'on':'off');if(!v)stopSpeech();});
function onVisibility(){if(document.hidden&&screen.value==='workout')pause();}
function clearTimer(){if(interval!==undefined)window.clearInterval(interval);interval=undefined;}
function pause(){if(paused.value)return;updateRemaining();paused.value=true;clearTimer();stopSpeech();}
function resume(){if(!current.value)return;paused.value=false;deadline=performance.now()+remaining.value*1000;clearTimer();interval=window.setInterval(tick,150);speak(current.value.title,audio.value);}
function updateRemaining(){if(!paused.value)remaining.value=Math.max(0,Math.ceil((deadline-performance.now())/1000));}
function announceCues(){const e=current.value;if(!e)return;const passed=e.durationSeconds-remaining.value;const i=e.voiceCues.findLastIndex(c=>c.atSecond<=passed);if(i>=0&&i!==activeCue){activeCue=i;cue.value=e.voiceCues[i].visibleText||e.voiceCues[i].text;speak(e.voiceCues[i].text,audio.value);}}
function tick(){if(paused.value)return;updateRemaining();announceCues();if(remaining.value<=0)next();}
function loadExercise(i:number){clearTimer();stopSpeech();index.value=i;activeCue=-1;remaining.value=current.value?.durationSeconds??0;cue.value=current.value?.instructions[0]??'';paused.value=true;resume();}
function start(){if(!routine.value.length)return;screen.value='workout';loadExercise(0);}
function next(){beep(audio.value);if(index.value+1>=routine.value.length){clearTimer();stopSpeech();paused.value=true;screen.value='complete';return;}loadExercise(index.value+1);}
function previous(){if(index.value>0)loadExercise(index.value-1);else loadExercise(0);}
function exit(){clearTimer();stopSpeech();paused.value=true;screen.value='home';}
function openExercise(e:Exercise){selected.value=e;screen.value='detail';}
const format=(n:number)=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
</script>

<template>
 <div class="shell">
  <header class="topbar"><button class="brand" @click="exit" aria-label="На главную"><span class="mark">✳</span> Face Ritual</button><button v-if="screen!=='workout'" class="sound" @click="audio=!audio" :aria-label="audio?'Выключить звук':'Включить звук'">{{audio?'♫ Звук вкл.':'♪ Без звука'}}</button></header>
  <main v-if="screen==='home'" class="home">
   <div class="eyebrow">ТВОЁ ВРЕМЯ ДЛЯ СЕБЯ</div><h1>Несколько минут<br><em>нежности к себе.</em></h1><p class="lead">Мягкая утренняя практика для лица и шеи. Без спешки, только ты и этот момент.</p>
   <section class="hero"><div class="hero-decoration">✺</div><span class="pill">УТРЕННИЙ РИТУАЛ</span><h2>Сегодняшняя<br>практика</h2><div v-if="routine.length" class="hero-info">{{routine.length}} упражнений <span>·</span> {{format(total)}} минут</div><div v-else class="hero-info">Библиотека упражнений ожидает наполнения</div><button class="primary" :disabled="!routine.length" @click="start">Начать тренировку <span>→</span></button></section>
   <div v-if="loading" class="notice">Загружаем библиотеку…</div><div v-else-if="!routine.length" class="notice"><strong>Скоро здесь появится твой ритуал.</strong><p>После импорта проверенных карточек упражнений мы сможем составлять ежедневные комплексы на 3–5 минут.</p><small v-if="error">{{error}}</small></div>
   <button class="text-link" @click="screen='library'">Посмотреть библиотеку <span>↗</span></button>
  </main>
  <main v-else-if="screen==='library'" class="content"><div class="eyebrow">ТВОЯ КОЛЛЕКЦИЯ</div><h1>Библиотека<br><em>упражнений.</em></h1><p class="lead">Каждое движение — в своём ритме.</p><div class="chips"><button :class="{active:areaFilter==='all'}" @click="areaFilter='all'">Все</button><button v-for="(label,key) in areaNames" :key="key" :class="{active:areaFilter===key}" @click="areaFilter=key as Area">{{label}}</button></div><div v-if="!filtered.length" class="notice">Пока нет одобренных упражнений для этой категории.</div><div class="exercise-grid"><button v-for="e in filtered" :key="e.id" class="exercise-card" @click="openExercise(e)"><img :src="imageUrl(e.imagePath)" :alt="e.title" loading="lazy"/><strong>{{e.title}}</strong><small>{{e.durationSeconds}} сек · {{areaLabels(e)}}</small></button></div><button class="text-link" @click="screen='home'">← На главную</button></main>
  <main v-else-if="screen==='detail' && selected" class="content"><button class="back" @click="screen='library'">← Библиотека</button><h1>{{selected.title}}</h1><div class="infographic"><img :src="imageUrl(selected.imagePath)" :alt="'Инструкция: '+selected.title"/></div><h3>Как выполнять</h3><ol><li v-for="(step,i) in selected.instructions" :key="i">{{step}}</li></ol><h3 v-if="selected.commonMistakes.length">Частые ошибки</h3><p v-for="(mistake,i) in selected.commonMistakes" :key="i">{{mistake}}</p><h3>Безопасность</h3><p v-for="(note,i) in selected.safetyNotes" :key="i">{{note}}</p></main>
  <main v-else-if="screen==='workout' && current" class="player"><div class="player-head"><button @click="exit">✕ Завершить</button><span>{{index+1}} / {{routine.length}}</span><button @click="audio=!audio">{{audio?'♫':'♪̸'}}</button></div><div class="progress"><div :style="{width:progress+'%'}"></div></div><div class="eyebrow">ТВОЯ ПРАКТИКА</div><h2>{{current.title}}</h2><div class="player-image"><img :src="imageUrl(current.imagePath)" :alt="current.title"/></div><div class="cue">{{cue}}</div><div class="timer">{{format(remaining)}}</div><div class="controls"><button @click="previous" aria-label="Предыдущее">↶</button><button class="play" @click="paused?resume():pause()">{{paused?'▶':'Ⅱ'}}</button><button @click="next" aria-label="Следующее">↷</button></div><p class="safety">Остановись, если появляется боль или дискомфорт.</p></main>
  <main v-else-if="screen==='complete'" class="complete"><div class="complete-icon">✺</div><div class="eyebrow">ТВОЙ РИТУАЛ ЗАВЕРШЁН</div><h1>Готово.<br><em>Побудь в этом моменте.</em></h1><p class="lead">Спасибо, что уделила время себе.</p><button class="primary" @click="exit">На главную →</button></main>
  <footer v-if="screen!=='workout'" class="footer">Мягкая практика для хорошего самочувствия · При дискомфорте прекрати упражнение.</footer>
 </div>
</template>
