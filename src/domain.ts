export const areas = ['forehead','eyes','cheeks','nasolabial','jawline','neck','general'] as const;
export type Area = typeof areas[number];
export type Cue = { atSecond: number; text: string; visibleText?: string };
export type Exercise = { id:string; title:string; englishTitle?:string; imagePath:string; durationSeconds:number; areas:Area[]; instructions:string[]; voiceCues:Cue[]; commonMistakes:string[]; safetyNotes:string[]; sources:{title:string;url?:string}[]; approved:boolean };
export type Manifest = {version:1; exercises:Exercise[]};
export const areaNames:Record<Area,string> = {forehead:'Лоб',eyes:'Вокруг глаз',cheeks:'Щёки и скулы',nasolabial:'Носогубная область',jawline:'Овал и подбородок',neck:'Шея',general:'Расслабление'};
