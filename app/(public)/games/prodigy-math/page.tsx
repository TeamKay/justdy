"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Zap,
  Swords,
  RotateCcw,
  HelpCircle,
  X,
  Volume2,
  VolumeX,
  Music,
  Heart,
  Sparkles,
  BookOpen,
  Wand2,
  Award,
} from "lucide-react";

// Math Topics & Grades
type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type Topic = "arithmetic" | "fractions" | "geometry" | "algebra";

interface Monster {
  name: string;
  element: "fire" | "water" | "earth" | "light";
  emoji: string;
  hp: number;
  maxHp: number;
  level: number;
  rewardXp: number;
  rewardGold: number;
}

interface Problem {
  question: string;
  answer: number;
  hint?: string;
}

// Helper: Math Problem Generator
function generateProblem(
  currentGrade: GradeLevel,
  currentTopic: Topic,
): Problem {
  let q = "";
  let a = 0;

  if (currentTopic === "arithmetic") {
    if (currentGrade <= 2) {
      const isAdd = Math.random() > 0.5;
      const n1 = Math.floor(Math.random() * 10) + 1;
      const n2 = Math.floor(Math.random() * 10) + 1;
      if (isAdd) {
        q = `${n1} + ${n2}`;
        a = n1 + n2;
      } else {
        const max = Math.max(n1, n2);
        const min = Math.min(n1, n2);
        q = `${max} - ${min}`;
        a = max - min;
      }
    } else if (currentGrade <= 4) {
      const isMult = Math.random() > 0.4;
      const n1 = Math.floor(Math.random() * 9) + 2;
      const n2 = Math.floor(Math.random() * 9) + 2;
      if (isMult) {
        q = `${n1} × ${n2}`;
        a = n1 * n2;
      } else {
        const prod = n1 * n2;
        q = `${prod} ÷ ${n1}`;
        a = n2;
      }
    } else {
      const n1 = Math.floor(Math.random() * 15) + 5;
      const n2 = Math.floor(Math.random() * 10) + 2;
      const n3 = Math.floor(Math.random() * 20) + 1;
      q = `${n1} × ${n2} - ${n3}`;
      a = n1 * n2 - n3;
    }
  } else if (currentTopic === "fractions") {
    if (currentGrade <= 4) {
      const denom = Math.floor(Math.random() * 6) + 2;
      const num1 = Math.floor(Math.random() * 4) + 1;
      const num2 = Math.floor(Math.random() * 4) + 1;
      q = `${num1}/${denom} + ${num2}/${denom} = ?/${denom}`;
      a = num1 + num2;
    } else {
      const whole = (Math.floor(Math.random() * 10) + 1) * 10;
      const percent = (Math.floor(Math.random() * 5) + 1) * 10;
      q = `What is ${percent}% of ${whole}?`;
      a = (percent / 100) * whole;
    }
  } else if (currentTopic === "geometry") {
    if (currentGrade <= 4) {
      const length = Math.floor(Math.random() * 8) + 2;
      const width = Math.floor(Math.random() * 6) + 2;
      const isArea = Math.random() > 0.5;
      if (isArea) {
        q = `Area of a rectangle with length ${length} & width ${width}`;
        a = length * width;
      } else {
        q = `Perimeter of a rectangle with sides ${length} & ${width}`;
        a = 2 * (length + width);
      }
    } else {
      const isAngle = Math.random() > 0.5;
      if (isAngle) {
        const a1 = Math.floor(Math.random() * 60) + 30;
        const a2 = Math.floor(Math.random() * 60) + 30;
        q = `Triangle missing angle if two angles are ${a1}° and ${a2}°`;
        a = 180 - (a1 + a2);
      } else {
        const base = (Math.floor(Math.random() * 6) + 2) * 2;
        const height = Math.floor(Math.random() * 8) + 2;
        q = `Area of triangle with base ${base} & height ${height}`;
        a = 0.5 * base * height;
      }
    }
  } else {
    const x = Math.floor(Math.random() * 10) + 1;
    const coeff = Math.floor(Math.random() * 5) + 2;
    const constant = Math.floor(Math.random() * 15) + 1;
    const total = coeff * x + constant;
    q = `Solve for x: ${coeff}x + ${constant} = ${total}`;
    a = x;
  }

  return { question: q, answer: a };
}

// Helper: Create Random Monster Data
function createMonster(hLevel: number): Monster {
  const monstersList: Omit<
    Monster,
    "level" | "hp" | "maxHp" | "rewardXp" | "rewardGold"
  >[] = [
    { name: "Ember Pup", element: "fire", emoji: "🔥" },
    { name: "Frost Drake", element: "water", emoji: "🐲" },
    { name: "Terrasaur", element: "earth", emoji: "🦖" },
    { name: "Lumen Sprite", element: "light", emoji: "✨" },
    { name: "Shadow Golem", element: "earth", emoji: "🗿" },
    { name: "Inferno Falcon", element: "fire", emoji: "🦅" },
  ];

  const template =
    monstersList[Math.floor(Math.random() * monstersList.length)];
  const monsterLvl = Math.max(1, hLevel + Math.floor(Math.random() * 2) - 1);
  const baseHp = 25 + monsterLvl * 15;

  return {
    name: template.name,
    element: template.element,
    emoji: template.emoji,
    level: monsterLvl,
    hp: baseHp,
    maxHp: baseHp,
    rewardXp: 30 + monsterLvl * 15,
    rewardGold: 15 + monsterLvl * 10,
  };
}

export default function ProdigyMathGame() {
  // Player Stats
  const [grade, setGrade] = useState<GradeLevel>(3);
  const [topic, setTopic] = useState<Topic>("arithmetic");
  const [heroLevel, setHeroLevel] = useState(1);
  const [heroHp, setHeroHp] = useState(100);
  const [maxHeroHp, setMaxHeroHp] = useState(100);
  const [heroXp, setHeroXp] = useState(0);
  const [xpToNextLevel, setXpToNextLevel] = useState(100);
  const [gold, setGold] = useState(0);

  // Audio Toggles
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

  // High Score / Wins
  const [monstersDefeated, setMonstersDefeated] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Initialized with lazy state to avoid useEffect sync triggers
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(() =>
    createMonster(1),
  );
  const [currentProblem, setCurrentProblem] = useState<Problem>(() =>
    generateProblem(3, "arithmetic"),
  );
  const [userAnswer, setUserAnswer] = useState("");
  const [battleLog, setBattleLog] = useState<string>(
    `Encountered Lv.${currentMonster?.level || 1} ${currentMonster?.name || "Creature"}! Prepare your spell!`,
  );
  const [selectedSpell, setSelectedSpell] = useState<
    "fire" | "water" | "earth" | "light"
  >("fire");
  const [battleFx, setBattleFx] = useState<string | null>(null);

  // Audio Context & Timer Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicTimerRef = useRef<NodeJS.Timeout | null>(null);
  const musicStepRef = useRef(0);

  // Refocus Cursor Helper
  const focusInput = useCallback(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  }, []);

  // Web Audio Context Synthesizer
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Sound Effects Generator
  const playSound = useCallback(
    (type: "spell" | "hit" | "wrong" | "victory" | "levelup" | "defeat") => {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === "spell") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(350, now);
          osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
        } else if (type === "hit") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
        } else if (type === "wrong") {
          osc.type = "square";
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.linearRampToValueAtTime(80, now + 0.2);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === "victory") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(554.37, now + 0.1);
          osc.frequency.setValueAtTime(659.25, now + 0.2);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else if (type === "levelup") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.4);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
        } else if (type === "defeat") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.5);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
        }
      } catch {
        // Fallback swallow
      }
    },
    [soundEnabled, getAudioContext],
  );

  // Background Music Loop Synthesizer
  useEffect(() => {
    if (!musicEnabled || gameOver || showHelp || showSettings) {
      if (musicTimerRef.current) clearInterval(musicTimerRef.current);
      return;
    }

    const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63];

    musicTimerRef.current = setInterval(() => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        const freq = notes[musicStepRef.current % notes.length];
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.28);

        musicStepRef.current += 1;
      } catch {
        // Audio fallback swallow
      }
    }, 320);

    return () => {
      if (musicTimerRef.current) clearInterval(musicTimerRef.current);
    };
  }, [musicEnabled, gameOver, showHelp, showSettings, getAudioContext]);

  // Handler to trigger spawning a monster
  const spawnMonster = useCallback((hLevel: number) => {
    const monster = createMonster(hLevel);
    setCurrentMonster(monster);
    setBattleLog(
      `Encountered Lv.${monster.level} ${monster.name}! Prepare your spell!`,
    );
  }, []);

  // Update questions when user changes grade or topic settings
  const handleApplySettings = (newGrade: GradeLevel, newTopic: Topic) => {
    setGrade(newGrade);
    setTopic(newTopic);
    setCurrentProblem(generateProblem(newGrade, newTopic));
    setShowSettings(false);
    focusInput();
  };

  // Handle Answer Submission & Battle Turn
  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameOver || !currentMonster || !userAnswer.trim()) return;

    const parsed = parseFloat(userAnswer.trim());

    if (parsed === currentProblem.answer) {
      // Correct Answer -> Hero Casts Spell
      playSound("spell");
      const damage = 20 + heroLevel * 8;
      const newMonsterHp = Math.max(0, currentMonster.hp - damage);

      setBattleFx(`✨ ${selectedSpell.toUpperCase()} SPELL HIT! -${damage} HP`);

      if (newMonsterHp === 0) {
        // Monster Defeated
        playSound("victory");
        setMonstersDefeated((prev) => prev + 1);
        const gainedXp = currentMonster.rewardXp;
        const gainedGold = currentMonster.rewardGold;

        setGold((g) => g + gainedGold);
        setBattleLog(
          `Victory! Defeated ${currentMonster.name}! +${gainedXp} XP & +${gainedGold} Gold!`,
        );

        let nextLvl = heroLevel;
        // Level Up Check
        if (heroXp + gainedXp >= xpToNextLevel) {
          playSound("levelup");
          nextLvl = heroLevel + 1;
          setHeroLevel(nextLvl);
          setHeroXp(heroXp + gainedXp - xpToNextLevel);
          setXpToNextLevel((prev) => Math.floor(prev * 1.5));
          setMaxHeroHp((mHp) => mHp + 20);
          setHeroHp((mHp) => mHp + 20);
          setBattleLog(`🎉 LEVEL UP! You reached Hero Level ${nextLvl}!`);
        } else {
          setHeroXp((x) => x + gainedXp);
        }

        // Spawn next monster
        setTimeout(() => {
          spawnMonster(nextLvl);
          setCurrentProblem(generateProblem(grade, topic));
          setBattleFx(null);
          focusInput();
        }, 1200);
      } else {
        // Monster Survives
        setCurrentMonster({ ...currentMonster, hp: newMonsterHp });
        setBattleLog(
          `Direct hit! ${currentMonster.name} took ${damage} damage.`,
        );
        setCurrentProblem(generateProblem(grade, topic));
        setTimeout(() => setBattleFx(null), 800);
      }
    } else {
      // Wrong Answer -> Monster Attacks Hero
      playSound("wrong");
      playSound("hit");
      const monsterDamage = 10 + currentMonster.level * 4;
      const nextHeroHp = Math.max(0, heroHp - monsterDamage);

      setHeroHp(nextHeroHp);
      setBattleFx(
        `💥 INCORRECT! ${currentMonster.name} attacked you for ${monsterDamage} damage!`,
      );

      if (nextHeroHp === 0) {
        playSound("defeat");
        setGameOver(true);
      } else {
        setBattleLog(
          `Spell fizzled! Answer was ${currentProblem.answer}. Try the next question!`,
        );
        setCurrentProblem(generateProblem(grade, topic));
      }

      setTimeout(() => setBattleFx(null), 1000);
    }

    setUserAnswer("");
    focusInput();
  };

  // Reset Game Function
  const resetGame = () => {
    setHeroHp(100);
    setMaxHeroHp(100);
    setHeroLevel(1);
    setHeroXp(0);
    setXpToNextLevel(100);
    setGold(0);
    setMonstersDefeated(0);
    setGameOver(false);
    spawnMonster(1);
    setCurrentProblem(generateProblem(grade, topic));
    focusInput();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 select-none relative overflow-hidden font-sans">
      {/* Dynamic RPG Radial Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e1b4b_0%,#020617_100%)] opacity-80 pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-3xl flex items-center justify-between mb-3 bg-slate-900/90 border-2 border-indigo-500/40 p-3.5 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)] z-10 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 border border-indigo-400/50 rounded-xl">
            <Wand2 className="text-indigo-400" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-indigo-300 tracking-wider">
              PRODIGY MATH RPG
            </h1>
            <div className="text-[10px] text-indigo-400/80 font-bold uppercase tracking-widest flex items-center gap-1">
              Grade {grade} • {topic.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Audio & Settings Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMusicEnabled((prev) => !prev)}
            className={`p-2 rounded-xl border transition ${
              musicEnabled
                ? "bg-purple-950/70 border-purple-500 text-purple-300"
                : "bg-slate-800 border-slate-700 text-slate-500"
            }`}
            title="Toggle Music"
          >
            <Music size={16} />
          </button>

          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-2 rounded-xl border transition ${
              soundEnabled
                ? "bg-emerald-950/70 border-emerald-500 text-emerald-300"
                : "bg-slate-800 border-slate-700 text-slate-500"
            }`}
            title="Toggle SFX"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition"
            title="Settings / Grade"
          >
            <BookOpen size={16} />
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition"
            title="How to Play"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </header>

      {/* Hero Stats Dashboard */}
      <div className="w-full max-w-3xl grid grid-cols-4 gap-2 mb-3 text-center z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 shadow-inner">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Hero Level
          </div>
          <div className="text-base sm:text-xl font-black text-amber-400 flex items-center justify-center gap-1">
            <Award size={16} /> Lv.{heroLevel}
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 shadow-inner">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Hero HP
          </div>
          <div className="text-base sm:text-xl font-black text-red-400 flex items-center justify-center gap-1">
            <Heart size={14} fill="currentColor" /> {heroHp}/{maxHeroHp}
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 shadow-inner">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Gold
          </div>
          <div className="text-base sm:text-xl font-black text-yellow-400">
            🪙 {gold}
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 shadow-inner">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Defeated
          </div>
          <div className="text-base sm:text-xl font-black text-emerald-400">
            ⚔️ {monstersDefeated}
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl p-2 mb-3 z-10">
        <div className="flex justify-between text-[11px] font-bold mb-1 px-1">
          <span className="text-indigo-300 flex items-center gap-1">
            <Sparkles size={12} className="text-amber-400" /> XP Progress
          </span>
          <span className="text-indigo-300">
            {heroXp} / {xpToNextLevel} XP
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-linear-to-r from-indigo-500 to-purple-400 transition-all duration-300"
            style={{
              width: `${Math.min(100, (heroXp / xpToNextLevel) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Main RPG Battle Arena */}
      <div className="w-full max-w-3xl h-64 bg-slate-950 border-2 border-indigo-500/30 rounded-2xl relative overflow-hidden mb-3 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col justify-between p-4 z-10">
        {/* Battle FX Pop-up overlay */}
        {battleFx && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs animate-in zoom-in-90 duration-100">
            <span className="text-base sm:text-xl font-black tracking-wider text-amber-300 bg-slate-900 border-2 border-amber-500/80 px-6 py-2.5 rounded-2xl shadow-2xl">
              {battleFx}
            </span>
          </div>
        )}

        {/* Monster & Hero Arena View */}
        <div className="flex items-center justify-between h-full px-4">
          {/* Player Hero Sprite */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-2 bg-slate-900 rounded-full border border-slate-700 overflow-hidden mb-1">
              <div
                className="h-full bg-emerald-500 transition-all duration-150"
                style={{ width: `${(heroHp / maxHeroHp) * 100}%` }}
              />
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-950 border-2 border-indigo-400 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-lg">
              🧙‍♂️
            </div>
            <span className="text-xs font-bold text-indigo-300 mt-1">
              Hero (Lv.{heroLevel})
            </span>
          </div>

          {/* Versing Divider */}
          <div className="text-center font-black text-slate-600 text-xl tracking-widest">
            VS
          </div>

          {/* Enemy Monster Sprite */}
          {currentMonster && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-2 bg-slate-900 rounded-full border border-slate-700 overflow-hidden mb-1">
                <div
                  className="h-full bg-red-500 transition-all duration-150"
                  style={{
                    width: `${(currentMonster.hp / currentMonster.maxHp) * 100}%`,
                  }}
                />
              </div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-950 border-2 border-red-500 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-lg animate-bounce">
                {currentMonster.emoji}
              </div>
              <span className="text-xs font-bold text-red-300 mt-1">
                {currentMonster.name} (Lv.{currentMonster.level})
              </span>
            </div>
          )}
        </div>

        {/* Battle Action Log */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 text-center text-xs text-indigo-200 font-medium shadow-inner">
          {battleLog}
        </div>
      </div>

      {/* Spellcasting & Math Control Panel */}
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 shadow-xl z-10">
        {/* Spell Element Selector */}
        <div className="flex justify-center gap-2 mb-3">
          {(["fire", "water", "earth", "light"] as const).map((elem) => (
            <button
              key={elem}
              type="button"
              onClick={() => setSelectedSpell(elem)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition flex items-center gap-1 ${
                selectedSpell === elem
                  ? "bg-indigo-600 border-indigo-400 text-white shadow-lg scale-105"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {elem === "fire" && "🔥 Fire"}
              {elem === "water" && "🌊 Water"}
              {elem === "earth" && "🌿 Earth"}
              {elem === "light" && "✨ Light"}
            </button>
          ))}
        </div>

        {/* Math Problem Form */}
        <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-3">
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 px-5 py-3.5 rounded-xl shadow-inner">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Zap size={14} className="text-amber-400" /> Spell Power Question:
            </span>
            <div className="text-xl sm:text-2xl font-black tracking-wider text-indigo-300">
              {currentProblem.question}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="number"
              step="any"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Enter answer..."
              disabled={gameOver}
              autoFocus
              className="flex-1 bg-slate-950 border-2 border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xl font-black text-slate-100 outline-none transition text-center shadow-inner"
            />
            <button
              type="submit"
              disabled={gameOver || !userAnswer.trim()}
              className="px-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black tracking-wider rounded-xl transition active:scale-95 shadow-md flex items-center gap-2 border border-indigo-400/50"
            >
              <Swords size={18} /> CAST SPELL
            </button>
          </div>
        </form>
      </div>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-red-500/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-2xl font-black text-red-500 mb-1 uppercase tracking-widest">
              HERO DEFEATED!
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Your health reached zero during the battle!
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Final Hero Level:</span>
                <strong className="text-amber-400 font-bold">
                  Lv.{heroLevel}
                </strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Monsters Defeated:</span>
                <strong className="text-emerald-400 font-bold">
                  {monstersDefeated}
                </strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Gold Earned:</span>
                <strong className="text-yellow-400 font-bold">🪙 {gold}</strong>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              <RotateCcw size={18} /> RESURRECT & RETRY
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => {
                setShowHelp(false);
                focusInput();
              }}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-black text-indigo-300 mb-2 flex items-center gap-2">
              <HelpCircle size={18} /> HOW TO PLAY
            </h2>
            <ul className="text-xs text-slate-300 space-y-2 mb-4 list-disc pl-4">
              <li>
                Answer math problems correctly to attack monsters and earn XP
                and Gold.
              </li>
              <li>
                Incorrect answers will cause monsters to attack your hero!
              </li>
              <li>
                Level up your hero to gain more health and deal extra damage.
              </li>
              <li>Adjust grades (1-8) and math topics anytime in Settings.</li>
            </ul>
            <button
              onClick={() => {
                setShowHelp(false);
                focusInput();
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Grade & Topic Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => {
                setShowSettings(false);
                focusInput();
              }}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-black text-indigo-300 mb-3 flex items-center gap-2">
              <BookOpen size={18} /> SELECT GRADE & TOPIC
            </h2>

            {/* Grade Selector (1-8) */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Grade Level (1–8):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleApplySettings(g as GradeLevel, topic)}
                    className={`py-2 rounded-xl text-xs font-black transition ${
                      grade === g
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    Grade {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Selector */}
            <div className="mb-5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Math Topic:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  ["arithmetic", "fractions", "geometry", "algebra"] as const
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleApplySettings(grade, t)}
                    className={`py-2 px-3 rounded-xl text-xs font-black capitalize transition ${
                      topic === t
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
