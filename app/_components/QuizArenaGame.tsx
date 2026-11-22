"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Crown, Flame, ShieldCheck, Timer, Trophy, Users, X, Zap } from "lucide-react";

type Difficulty = "beginner" | "intermediate" | "advanced";
type Question = { prompt: string; options: string[]; answer: string; explanation: string };
type Props = { onClose: () => void; onComplete: (score: number, total: number, difficulty: Difficulty, mode: "practice" | "timed", streak: number) => void };
const bank: Record<Difficulty, Question[]> = {
 beginner: [
  { prompt: "What is 36 ÷ 6?", options: ["5", "6", "7", "8"], answer: "6", explanation: "6 × 6 = 36, so 36 ÷ 6 = 6." },
  { prompt: "What is 14 + 29?", options: ["41", "42", "43", "44"], answer: "43", explanation: "14 + 29 = 43." },
  { prompt: "Which fraction is one quarter?", options: ["1/2", "1/3", "1/4", "2/3"], answer: "1/4", explanation: "One quarter means one of four equal parts." },
  { prompt: "How many degrees are in a right angle?", options: ["45°", "90°", "180°", "360°"], answer: "90°", explanation: "A right angle measures exactly 90 degrees." },
  { prompt: "What is 9 × 8?", options: ["63", "72", "81", "89"], answer: "72", explanation: "9 groups of 8 equal 72." },
  { prompt: "What is the place value of 5 in 3,582?", options: ["5", "50", "500", "5,000"], answer: "500", explanation: "The 5 is in the hundreds place." },
  { prompt: "What is 0.5 as a fraction?", options: ["1/5", "1/4", "1/2", "5/10 only"], answer: "1/2", explanation: "0.5 = 5/10 = 1/2." },
  { prompt: "Find the perimeter of a square with side 4 cm.", options: ["8 cm", "12 cm", "16 cm", "20 cm"], answer: "16 cm", explanation: "Perimeter = 4 × side = 4 × 4 = 16 cm." },
  { prompt: "What comes next: 5, 10, 15, 20, …", options: ["22", "24", "25", "30"], answer: "25", explanation: "The sequence increases by 5." },
  { prompt: "What is 100 − 37?", options: ["53", "63", "67", "73"], answer: "63", explanation: "100 − 37 = 63." },
 ],
 intermediate: [
  { prompt: "Solve 3x + 5 = 20.", options: ["3", "4", "5", "6"], answer: "5", explanation: "Subtract 5, then divide 15 by 3: x = 5." },
  { prompt: "Find 15% of 200.", options: ["15", "20", "30", "35"], answer: "30", explanation: "0.15 × 200 = 30." },
  { prompt: "Evaluate 2³ + 4 × 3.", options: ["20", "24", "36", "48"], answer: "20", explanation: "2³ = 8 and 4 × 3 = 12; total 20." },
  { prompt: "What is the mean of 4, 8, 10 and 14?", options: ["8", "9", "10", "11"], answer: "9", explanation: "The sum is 36; 36 ÷ 4 = 9." },
  { prompt: "A car travels 120 km in 2 hours. Find its average speed.", options: ["40 km/h", "50 km/h", "60 km/h", "80 km/h"], answer: "60 km/h", explanation: "Speed = distance ÷ time = 120 ÷ 2 = 60 km/h." },
  { prompt: "Simplify 21/28.", options: ["2/3", "3/4", "4/5", "7/8"], answer: "3/4", explanation: "Divide numerator and denominator by 7." },
  { prompt: "Two angles on a straight line are x° and 125°. Find x.", options: ["45°", "55°", "65°", "75°"], answer: "55°", explanation: "Angles on a straight line total 180°; 180 − 125 = 55°." },
  { prompt: "Expand 3(x + 4).", options: ["3x + 4", "3x + 7", "3x + 12", "x + 12"], answer: "3x + 12", explanation: "Multiply 3 by each term inside the bracket." },
  { prompt: "What is the probability of rolling an even number on a fair six-sided die?", options: ["1/6", "1/3", "1/2", "2/3"], answer: "1/2", explanation: "Three of six outcomes are even: 3/6 = 1/2." },
  { prompt: "Find the next term: 2, 6, 18, 54, …", options: ["108", "126", "162", "216"], answer: "162", explanation: "Each term is multiplied by 3." },
 ],
 advanced: [
  { prompt: "Solve 2(3x − 4) = 22.", options: ["3", "4", "5", "6"], answer: "5", explanation: "6x − 8 = 22, so 6x = 30 and x = 5." },
  { prompt: "A price rises from $80 to $92. Find the percentage increase.", options: ["10%", "12%", "15%", "20%"], answer: "15%", explanation: "Increase = 12; 12/80 × 100 = 15%." },
  { prompt: "Factorise x² + 7x + 12.", options: ["(x + 2)(x + 6)", "(x + 3)(x + 4)", "(x − 3)(x − 4)", "(x + 1)(x + 12)"], answer: "(x + 3)(x + 4)", explanation: "3 and 4 multiply to 12 and add to 7." },
  { prompt: "A right triangle has legs 8 cm and 15 cm. Find its hypotenuse.", options: ["16 cm", "17 cm", "18 cm", "19 cm"], answer: "17 cm", explanation: "√(8² + 15²) = √289 = 17 cm." },
  { prompt: "If f(x) = 2x² − 3, find f(4).", options: ["19", "25", "29", "35"], answer: "29", explanation: "2(4²) − 3 = 32 − 3 = 29." },
  { prompt: "Solve simultaneously: x + y = 9 and x − y = 3.", options: ["x=5, y=4", "x=6, y=3", "x=7, y=2", "x=8, y=1"], answer: "x=6, y=3", explanation: "Add equations: 2x = 12, so x = 6 and y = 3." },
  { prompt: "A circle has radius 7 cm. Using π = 22/7, find its circumference.", options: ["22 cm", "44 cm", "88 cm", "154 cm"], answer: "44 cm", explanation: "Circumference = 2πr = 2 × 22/7 × 7 = 44 cm." },
  { prompt: "What is the gradient between (2, 3) and (6, 11)?", options: ["1", "2", "3", "4"], answer: "2", explanation: "Gradient = (11 − 3)/(6 − 2) = 8/4 = 2." },
  { prompt: "A sequence has nth term 5n − 2. Find the 18th term.", options: ["82", "86", "88", "92"], answer: "88", explanation: "5(18) − 2 = 90 − 2 = 88." },
  { prompt: "A bag has 3 red and 5 blue counters. What is the probability of choosing two red counters without replacement?", options: ["3/8", "3/14", "1/4", "9/64"], answer: "3/28", explanation: "(3/8) × (2/7) = 6/56 = 3/28." },
 ]
};

const players = [{ name: "Mia", color: "bg-pink-100 text-pink-700" }, { name: "Leo", color: "bg-sky-100 text-sky-700" }, { name: "Ari", color: "bg-amber-100 text-amber-800" }];
export default function QuizArenaGame({ onClose, onComplete }: Props) {
 const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
 const [mode, setMode] = useState<"classic" | "survival" | "sprint">("classic");
 const [started, setStarted] = useState(false);
 const [index, setIndex] = useState(0);
 const [answer, setAnswer] = useState<string | null>(null);
 const [score, setScore] = useState(0);
 const [streak, setStreak] = useState(0);
 const [bestStreak, setBestStreak] = useState(0);
 const [finished, setFinished] = useState(false);
 const [fiftyUsed, setFiftyUsed] = useState(false);
 const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
 const [botScores, setBotScores] = useState([0, 0, 0]);
 const questions = useMemo(() => bank[difficulty], [difficulty]);
 const total = mode === "survival" ? questions.length : mode === "sprint" ? 10 : 10;
 const current = questions[index];
 const isLast = index >= total - 1;
 const modeLabel = mode === "classic" ? "Classic Clash" : mode === "survival" ? "Survival Streak" : "Lightning Sprint";
 function start() { setStarted(true); setIndex(0); setAnswer(null); setScore(0); setStreak(0); setBestStreak(0); setFinished(false); setFiftyUsed(false); setHiddenOptions([]); setBotScores([0,0,0]); }
 function useFifty() { if (fiftyUsed || !current || answer) return; const wrong = current.options.filter((o) => o !== current.answer); setHiddenOptions(wrong.slice(0, 2)); setFiftyUsed(true); }
 function choose(value: string) { if (answer || !current) return; setAnswer(value); const correct = value === current.answer; if (correct) { setScore((v) => v + 1); setStreak((v) => { const next = v + 1; setBestStreak((b) => Math.max(b, next)); return next; }); } else { setStreak(0); }
   setBotScores((scores) => scores.map((v, i) => v + ((index + i * 2 + difficulty.length) % 4 === 0 ? 0 : (index + i) % 3 === 0 ? 1 : 0)));
 }
 function next() { if (!current) return; if (mode === "survival" && answer !== current.answer) { finish(); return; } if (isLast) { finish(); return; } setIndex((v) => v + 1); setAnswer(null); setHiddenOptions([]); }
 function finish() { if (finished) return; const final = score + (answer === current?.answer ? 1 : 0); setFinished(true); onComplete(final, Math.max(1, mode === "survival" ? index + 1 : total), difficulty, "practice", Math.max(bestStreak, streak)); }
 const finalScore = score + (answer === current?.answer && !finished ? 1 : 0);
 return <div className="fixed inset-0 z-[1300] overflow-y-auto bg-[#11152F]/80 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="quiz-arena-title"><div className="mx-auto my-3 w-full max-w-5xl overflow-hidden rounded-[28px] bg-[#F7F7FC] shadow-2xl sm:my-8">
  <header className="relative overflow-hidden bg-gradient-to-br from-[#29245E] via-[#493E9B] to-[#8B4DA6] p-5 text-white sm:p-8"><div className="absolute -right-12 -top-16 h-60 w-60 rounded-full border-[28px] border-white/10"/><div className="relative flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-violet-200">Justdy Originals · Competitive quiz arena</p><h2 id="quiz-arena-title" className="mt-2 text-3xl font-black sm:text-4xl">Quiz Arena</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/80">Choose a game mode, answer fast and smart, use a power-up and climb the leaderboard against our arena rivals.</p></div><button onClick={onClose} aria-label="Close Quiz Arena" className="rounded-full bg-white/15 p-2 hover:bg-white/25"><X className="h-5 w-5"/></button></div><div className="relative mt-5 flex flex-wrap gap-3 text-xs font-bold"><span className="rounded-full bg-white/15 px-3 py-2">🏆 Score {score}</span><span className="rounded-full bg-white/15 px-3 py-2">🔥 Streak {streak}</span><span className="rounded-full bg-white/15 px-3 py-2">⚡ {modeLabel}</span></div></header>
  {!started ? <div className="p-5 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-violet-600">Set up your match</p><h3 className="mt-1 text-2xl font-black text-[#29245E]">Pick your arena rules</h3><p className="mt-1 text-sm text-slate-600">Solo mode includes three computer-controlled rivals. No live multiplayer is required.</p></div><label className="text-xs font-bold text-slate-600">Difficulty<select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="beginner">Rookie</option><option value="intermediate">Challenger</option><option value="advanced">Champion</option></select></label></div><div className="mt-6 grid gap-4 md:grid-cols-3">{[{id:"classic",name:"Classic Clash",desc:"Ten questions. Highest score wins.",icon:Trophy},{id:"survival",name:"Survival Streak",desc:"One mistake ends your run. How long can you last?",icon:Flame},{id:"sprint",name:"Lightning Sprint",desc:"Race through ten rapid-fire questions for bonus XP.",icon:Timer}].map((m) => {const Icon=m.icon;return <button key={m.id} onClick={() => setMode(m.id as typeof mode)} className={`rounded-2xl border-2 p-5 text-left transition ${mode===m.id?"border-violet-500 bg-violet-50":"border-slate-200 bg-white hover:border-violet-300"}`}><Icon className="h-8 w-8 text-violet-600"/><h4 className="mt-4 text-lg font-black text-[#29245E]">{m.name}</h4><p className="mt-2 text-sm leading-5 text-slate-600">{m.desc}</p></button>})}</div><div className="mt-6 rounded-2xl bg-white p-5"><div className="flex items-center gap-2 font-black text-slate-700"><Users className="h-5 w-5 text-violet-600"/> Arena rivals</div><div className="mt-3 grid grid-cols-3 gap-3">{players.map((p) => <div key={p.name} className={`rounded-xl p-3 text-center ${p.color}`}><div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/80 font-black">{p.name[0]}</div><p className="mt-2 text-sm font-black">{p.name}</p><p className="text-[11px]">Computer rival</p></div>)}</div></div><button onClick={start} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#393078] px-5 py-4 text-sm font-black text-white hover:bg-[#5145A2]">Enter the arena <ArrowRight className="h-4 w-4"/></button></div>
  : finished ? <div className="p-7 text-center sm:p-12"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Crown className="h-10 w-10"/></div><p className="mt-5 text-xs font-black uppercase tracking-widest text-violet-600">Arena results</p><h3 className="mt-2 text-3xl font-black text-[#29245E]">{botScores.every((v) => finalScore >= v) ? "Arena champion!" : "Match complete!"}</h3><p className="mt-2 text-slate-600">You scored {finalScore} correct answers. Best streak: {bestStreak}.</p><div className="mx-auto mt-6 max-w-lg space-y-2">{[{name:"You",value:finalScore},{name:"Mia",value:botScores[0]},{name:"Leo",value:botScores[1]},{name:"Ari",value:botScores[2]}].sort((a,b)=>b.value-a.value).map((p,i)=><div key={p.name} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm"><span className="font-bold text-slate-700">{i+1}. {p.name}</span><span className="font-black text-violet-700">{p.value} pts</span></div>)}</div><div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={start} className="rounded-xl bg-[#393078] px-5 py-3 text-sm font-bold text-white">Play again</button><button onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700">Exit arena</button></div></div>
  : <div className="p-5 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-black uppercase tracking-widest text-violet-600">{modeLabel} · Round {index+1}/{total}</span><button onClick={onClose} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500"><ArrowLeft className="h-4 w-4"/> Exit match</button></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-violet-600" style={{width:`${((index+1)/total)*100}%`}}/></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{players.map((p,i)=><div key={p.name} className="rounded-xl bg-white p-3 text-center"><p className="text-xs font-bold text-slate-500">{p.name}</p><p className="text-xl font-black text-violet-700">{botScores[i]}</p></div>)}</div><div className="mt-6 flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-2 text-xs font-black text-violet-800"><Zap className="h-4 w-4"/> {score} correct · {streak} streak</span><button disabled={fiftyUsed || !!answer} onClick={useFifty} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 disabled:opacity-40"><ShieldCheck className="h-4 w-4"/>{fiftyUsed?"Power-up used":"50:50 power-up"}</button></div><h3 className="mt-8 text-center text-2xl font-black leading-snug text-[#29245E] sm:text-3xl">{current?.prompt}</h3><div className="mt-6 grid gap-3 sm:grid-cols-2">{current?.options.map((o,i)=>!hiddenOptions.includes(o)&&<button key={o} disabled={!!answer} onClick={()=>choose(o)} className={`min-h-14 rounded-xl border-2 px-4 py-3 text-left text-sm font-bold ${answer?o===current.answer?"border-emerald-400 bg-emerald-50 text-emerald-800":answer===o?"border-rose-300 bg-rose-50 text-rose-800":"border-slate-100 bg-white text-slate-400":"border-slate-200 bg-white text-slate-700 hover:border-violet-400 hover:bg-violet-50"}`}><span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs">{String.fromCharCode(65+i)}</span>{o}</button>)}</div>{answer&&<div className="mt-5 rounded-xl bg-violet-50 p-4 text-sm text-violet-900"><p className="font-black">{answer===current?.answer?"Correct answer!":"Keep going — every round teaches you something."}</p><p className="mt-1 leading-6">{current?.explanation}</p></div>}<div className="mt-6 flex justify-end"><button disabled={!answer} onClick={next} className="inline-flex items-center gap-2 rounded-xl bg-[#393078] px-5 py-3 text-sm font-black text-white disabled:opacity-40">{isLast|| (mode==="survival"&&answer!==current?.answer)?"Finish match":"Next round"}<ArrowRight className="h-4 w-4"/></button></div></div>}
 </div></div>;
}
