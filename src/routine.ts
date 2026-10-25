import type { Exercise } from './domain';
export function dateKey(date:Date):string { return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-'); }
function hash(s:string):number { let h=2166136261; for (const ch of s) { h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
export function generateRoutine(exercises:Exercise[], day:string, min=180,max=300):Exercise[] {
 const available=exercises.filter(e=>e.approved && e.durationSeconds>=10 && e.durationSeconds<=300);
 const order=[...available].sort((a,b)=>hash(day+a.id)-hash(day+b.id));
 let best:Exercise[]=[]; let bestScore=-Infinity;
 const evaluate=(selected:Exercise[],total:number)=>{
  if(total<min||total>max)return;
  const covered=new Set(selected.flatMap(e=>e.areas));
  const score=covered.size*100+selected.length*4-Math.abs(240-total)/10+selected.reduce((s,e)=>s+(hash(day+e.id)%11)/100,0);
  if(score>bestScore){best=[...selected];bestScore=score;}
 };
 function walk(i:number,selected:Exercise[],total:number):void {if(total>max)return;evaluate(selected,total);if(i>=order.length)return;walk(i+1,selected,total);selected.push(order[i]);walk(i+1,selected,total+order[i].durationSeconds);selected.pop();}
 // Bound search complexity for large libraries; stable order maintains deterministic output.
 if(order.length<=18)walk(0,[],0);
 else {for(let start=0;start<Math.min(order.length,30);start++){let selected:Exercise[]=[];let total=0;for(let k=0;k<order.length;k++){const e=order[(start+k)%order.length];if(total+e.durationSeconds<=max){selected.push(e);total+=e.durationSeconds;evaluate(selected,total);}}}}
 return best;
}
