"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield,
  Zap,
  Flame,
  Swords,
  Trophy,
  RotateCcw,
  HelpCircle,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Music,
  Heart,
  Skull,
  Crosshair,
} from "lucide-react";

interface Enemy {
  id: number;
  type: "goblin" | "orc" | "boss";
  hp: number;
  maxHp: number;
  progress: number; // 0 (start) to 100 (castle gate)
  speed: number;
  lane: number;
}

interface Problem {
  num1: number;
  num2: number;
  op: "+" | "-" | "×";
  answer: number;
}

export default function MathDungeonPage() {
  // Stats
  const [castleHp, setCastleHp] = useState(100);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [combo, setCombo] = useState(0);
  const [mana, setMana] = useState(0); // Charges ultimate spell at 100
  const [gameOver, setGameOver] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

  // Local storage high score
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem("math_dungeon_highscore") || "0", 10);
  });

  // Game Engine State
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem>({
    num1: 5,
    num2: 3,
    op: "+",
    answer: 8,
  });
  const [userAnswer, setUserAnswer] = useState("");
  const [spellEffect, setSpellEffect] = useState<string | null>(null);
  const [isHit, setIsHit] = useState(false);

  const nextEnemyId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicTimerRef = useRef<NodeJS.Timeout | null>(null);
  const musicStepRef = useRef(0);

  // Focus utility
  const focusInput = useCallback(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  }, []);

  // Web Audio Context Getter
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== "undefined") {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Sound Effects Generator
  const playSound = useCallback(
    (type: "cast" | "wrong" | "ultimate" | "damage" | "gameover") => {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === "cast") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
        } else if (type === "wrong") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.linearRampToValueAtTime(90, now + 0.2);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === "ultimate") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.exponentialRampToValueAtTime(520, now + 0.4);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
        } else if (type === "damage") {
          osc.type = "square";
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
        } else if (type === "gameover") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(50, now + 0.6);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
          osc.start(now);
          osc.stop(now + 0.6);
        }
      } catch {
        // Fallback swallow
      }
    },
    [soundEnabled, getAudioContext],
  );

  // Background 8-Bit Gamish Music Synthesizer Loop
  useEffect(() => {
    if (!musicEnabled || gameOver || showHelp) {
      if (musicTimerRef.current) clearInterval(musicTimerRef.current);
      return;
    }

    const melody = [
      261.63, 293.66, 329.63, 349.23, 392.0, 329.63, 293.66, 261.63,
    ]; // C4, D4, E4, F4, G4, E4, D4, C4

    musicTimerRef.current = setInterval(() => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "square";
        const freq = melody[musicStepRef.current % melody.length];
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);

        musicStepRef.current += 1;
      } catch {
        // Audio fallback swallow
      }
    }, 250);

    return () => {
      if (musicTimerRef.current) clearInterval(musicTimerRef.current);
    };
  }, [musicEnabled, gameOver, showHelp, getAudioContext]);

  // Problem Generator based on Wave
  const generateProblem = useCallback((currentWave: number): Problem => {
    const ops: ("+" | "-" | "×")[] =
      currentWave > 3 ? ["+", "-", "×"] : ["+", "-"];
    const op = ops[Math.floor(Math.random() * ops.length)];

    let num1 = 1;
    let num2 = 1;

    if (op === "+") {
      num1 = Math.floor(Math.random() * (12 * Math.min(currentWave, 3))) + 1;
      num2 = Math.floor(Math.random() * (12 * Math.min(currentWave, 3))) + 1;
    } else if (op === "-") {
      num1 = Math.floor(Math.random() * (15 * Math.min(currentWave, 3))) + 5;
      num2 = Math.floor(Math.random() * num1) + 1;
    } else {
      num1 = Math.floor(Math.random() * 9) + 2;
      num2 = Math.floor(Math.random() * 9) + 2;
    }

    let answer = num1 + num2;
    if (op === "-") answer = num1 - num2;
    if (op === "×") answer = num1 * num2;

    return { num1, num2, op, answer };
  }, []);

  // Spawn Enemies across multi-lane grid
  const spawnEnemy = useCallback(() => {
    const types: ("goblin" | "orc" | "boss")[] = ["goblin", "goblin", "orc"];
    if (wave >= 3 && Math.random() < 0.25) types.push("boss");

    const selectedType = types[Math.floor(Math.random() * types.length)];
    let hp = 1;
    let speed = 0.12 + wave * 0.02;

    if (selectedType === "orc") {
      hp = 2;
      speed *= 0.75;
    } else if (selectedType === "boss") {
      hp = 4;
      speed *= 0.5;
    }

    setEnemies((prev) => [
      ...prev,
      {
        id: nextEnemyId.current++,
        type: selectedType,
        hp,
        maxHp: hp,
        progress: 0,
        speed,
        lane: Math.floor(Math.random() * 3), // 3 track lanes
      },
    ]);
  }, [wave]);

  // Main Game Loop (Enemies movement & spawn timer)
  useEffect(() => {
    if (gameOver || showHelp) return;

    const moveInterval = setInterval(() => {
      setEnemies((prevEnemies) => {
        let reachedCastleCount = 0;

        const updated = prevEnemies
          .map((enemy) => ({
            ...enemy,
            progress: enemy.progress + enemy.speed,
          }))
          .filter((enemy) => {
            if (enemy.progress >= 100) {
              reachedCastleCount +=
                enemy.type === "boss" ? 25 : enemy.type === "orc" ? 15 : 10;
              return false;
            }
            return true;
          });

        if (reachedCastleCount > 0) {
          playSound("damage");
          setIsHit(true);
          setTimeout(() => setIsHit(false), 250);

          setCastleHp((hp) => {
            const nextHp = Math.max(0, hp - reachedCastleCount);
            if (nextHp === 0) {
              setGameOver(true);
              playSound("gameover");
            }
            return nextHp;
          });
          setCombo(0);
        }

        return updated;
      });
    }, 100);

    const spawnRate = Math.max(1400, 3800 - wave * 300);
    const spawnInterval = setInterval(() => {
      if (enemies.length < 6) {
        spawnEnemy();
      }
    }, spawnRate);

    return () => {
      clearInterval(moveInterval);
      clearInterval(spawnInterval);
    };
  }, [gameOver, showHelp, wave, enemies.length, spawnEnemy, playSound]);

  // Cast Spell Handler
  const handleCastSpell = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (gameOver || !userAnswer.trim()) return;

    const parsed = parseInt(userAnswer.trim(), 10);

    if (parsed === currentProblem.answer) {
      playSound("cast");

      setEnemies((prev) => {
        if (prev.length === 0) return prev;

        const sorted = [...prev].sort((a, b) => b.progress - a.progress);
        const target = sorted[0];

        return prev
          .map((enemy) => {
            if (enemy.id === target.id) {
              return { ...enemy, hp: enemy.hp - 1 };
            }
            return enemy;
          })
          .filter((enemy) => enemy.hp > 0);
      });

      const newCombo = combo + 1;
      setCombo(newCombo);
      const points = 100 * Math.min(newCombo, 5);
      setScore((s) => {
        const newScore = s + points;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem("math_dungeon_highscore", newScore.toString());
        }
        return newScore;
      });

      setMana((m) => Math.min(100, m + 15));

      const spellTypes = [
        "💥 FIREBALL HIT!",
        "⚡ LIGHTNING STRIKE!",
        "❄️ FROST BLAST!",
      ];
      setSpellEffect(spellTypes[Math.floor(Math.random() * spellTypes.length)]);
      setTimeout(() => setSpellEffect(null), 600);

      if (score + points >= wave * 600) {
        setWave((w) => w + 1);
      }

      setCurrentProblem(generateProblem(wave));
      setUserAnswer("");
    } else {
      playSound("wrong");
      setCombo(0);
      setUserAnswer("");
      setSpellEffect("❌ SPELL FIZZLED!");
      setTimeout(() => setSpellEffect(null), 600);
    }

    focusInput();
  };

  // Ultimate Screen Clear
  const triggerUltimate = () => {
    if (mana < 100 || enemies.length === 0) return;
    playSound("ultimate");
    setEnemies([]);
    setMana(0);
    setScore((s) => s + 500);
    setSpellEffect("🌋 EARTHQUAKE CLEAR!");
    setTimeout(() => setSpellEffect(null), 1000);
    focusInput();
  };

  // Reset Game
  const resetGame = () => {
    setCastleHp(100);
    setScore(0);
    setWave(1);
    setCombo(0);
    setMana(0);
    setEnemies([]);
    setGameOver(false);
    setCurrentProblem(generateProblem(1));
    setUserAnswer("");
    focusInput();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 select-none relative overflow-hidden font-mono">
      {/* Dynamic Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-size-[16px_16px] opacity-40 pointer-events-none" />

      {/* Retro Arcade Header */}
      <header className="w-full max-w-3xl flex items-center justify-between mb-3 bg-slate-900 border-2 border-amber-500/40 p-3 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.15)] z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 border border-amber-500/40 rounded-lg">
            <Swords className="text-amber-400" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-amber-400 tracking-wider">
              MATH DUNGEON
            </h1>
            <div className="text-[10px] text-amber-500/80 uppercase font-bold tracking-widest">
              TOWER DEFENSE
            </div>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMusicEnabled((prev) => !prev)}
            className={`p-2 rounded-lg border transition ${
              musicEnabled
                ? "bg-purple-950/60 border-purple-500 text-purple-300"
                : "bg-slate-800 border-slate-700 text-slate-500"
            }`}
            title="Toggle Music"
          >
            <Music size={16} />
          </button>

          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-2 rounded-lg border transition ${
              soundEnabled
                ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                : "bg-slate-800 border-slate-700 text-slate-500"
            }`}
            title="Toggle SFX"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition"
            title="Help"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </header>

      {/* Gamified Scoreboard */}
      <div className="w-full max-w-3xl grid grid-cols-4 gap-2 mb-3 text-center z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 shadow-inner">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Score
          </div>
          <div className="text-base sm:text-xl font-black text-sky-400">
            {score}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 shadow-inner">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Wave
          </div>
          <div className="text-base sm:text-xl font-black text-amber-400">
            {wave}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 shadow-inner">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Combo
          </div>
          <div className="text-base sm:text-xl font-black text-emerald-400">
            {combo}x 🔥
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 shadow-inner">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Gate HP
          </div>
          <div
            className={`text-base sm:text-xl font-black flex items-center justify-center gap-1 ${
              castleHp < 30 ? "text-red-500 animate-pulse" : "text-emerald-400"
            }`}
          >
            <Heart size={14} fill="currentColor" /> {castleHp}%
          </div>
        </div>
      </div>

      {/* Dungeon Arena Track View */}
      <div
        className={`w-full max-w-3xl h-64 bg-slate-950 border-2 ${
          isHit ? "border-red-500 bg-red-950/20" : "border-amber-500/30"
        } rounded-xl relative overflow-hidden mb-3 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex flex-col justify-between p-2 z-10 transition-colors`}
      >
        {/* Spell Visual Alert Overlay */}
        {spellEffect && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs animate-in zoom-in-90 duration-100">
            <span className="text-lg sm:text-2xl font-black tracking-widest text-amber-400 bg-slate-900 border-2 border-amber-500 px-6 py-2 rounded-xl shadow-2xl">
              {spellEffect}
            </span>
          </div>
        )}

        {/* Multi-Lane Dungeon Grid Track */}
        <div className="relative w-full h-full flex flex-col justify-around py-2">
          {/* Dungeon Track Lanes */}
          {[0, 1, 2].map((laneIndex) => (
            <div
              key={laneIndex}
              className="relative w-full h-12 bg-slate-900/60 border-y border-slate-800/80 flex items-center"
            >
              <div className="w-full h-0.5 bg-slate-800/50 border-t border-dashed border-slate-700/50" />
            </div>
          ))}

          {/* Castle Gate Barrier Wall */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-slate-900 border-l-4 border-amber-500 flex flex-col items-center justify-center z-10 shadow-[-10px_0_15px_rgba(0,0,0,0.5)]">
            <Shield className="text-amber-400 mb-1 animate-pulse" size={20} />
            <span className="text-[9px] font-black text-amber-400 tracking-tighter uppercase">
              GATE
            </span>
          </div>

          {/* Enemies Render */}
          {enemies.map((enemy) => {
            const laneOffset = enemy.lane * 52 + 10;
            return (
              <div
                key={enemy.id}
                className="absolute transition-all duration-100 z-20 flex flex-col items-center -translate-x-1/2"
                style={{
                  left: `${Math.min(enemy.progress, 88)}%`,
                  top: `${laneOffset}px`,
                }}
              >
                {/* Floating HP & Target Pointer */}
                <div className="flex items-center gap-1 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-700 mb-0.5">
                  <div className="w-6 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-150"
                      style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-red-400">
                    {enemy.hp}HP
                  </span>
                </div>

                {/* Monster Icon Box */}
                <div
                  className={`flex items-center justify-center rounded-lg border-2 shadow-lg ${
                    enemy.type === "boss"
                      ? "bg-purple-950 border-purple-500 text-2xl w-10 h-10 animate-pulse"
                      : enemy.type === "orc"
                        ? "bg-emerald-950 border-emerald-500 text-xl w-8 h-8"
                        : "bg-red-950 border-red-500 text-lg w-7 h-7"
                  }`}
                >
                  {enemy.type === "boss"
                    ? "👹"
                    : enemy.type === "orc"
                      ? "🧌"
                      : "👺"}
                </div>
              </div>
            );
          })}

          {enemies.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-600 font-bold tracking-widest uppercase">
              <Crosshair size={14} className="mr-2 text-slate-500" /> Wave
              Active - Monsters Incoming
            </div>
          )}
        </div>
      </div>

      {/* Interactive Control Deck */}
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-slate-800 rounded-xl p-3 shadow-xl z-10">
        <form onSubmit={handleCastSpell} className="flex flex-col gap-3">
          {/* Question Banner */}
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 px-4 py-3 rounded-lg shadow-inner">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Zap size={14} className="text-amber-400" /> Cast Spell:
            </span>
            <div className="text-2xl sm:text-3xl font-black tracking-widest text-sky-400">
              {currentProblem.num1} {currentProblem.op} {currentProblem.num2} =
              ?
            </div>
          </div>

          {/* Textbox Input & Cast Button */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Result..."
              disabled={gameOver}
              autoFocus
              className="flex-1 bg-slate-950 border-2 border-slate-800 focus:border-sky-500 rounded-lg px-4 py-2.5 text-xl font-black text-slate-100 outline-none transition text-center shadow-inner"
            />
            <button
              type="submit"
              disabled={gameOver || !userAnswer.trim()}
              className="px-6 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-slate-950 font-black tracking-wider rounded-lg transition active:scale-95 shadow-md flex items-center gap-2 border border-sky-400/50"
            >
              <Zap size={18} /> ATTACK
            </button>
          </div>
        </form>

        {/* Ultimate Ability Deck */}
        <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
          <div className="flex-1 mr-3">
            <div className="flex justify-between text-[11px] font-bold mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-400" /> Ultimate
                Charge
              </span>
              <span className="text-amber-400">{mana}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-linear-to-r from-amber-500 to-yellow-300 transition-all duration-300"
                style={{ width: `${mana}%` }}
              />
            </div>
          </div>

          <button
            onClick={triggerUltimate}
            disabled={mana < 100 || gameOver}
            className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition flex items-center gap-1 ${
              mana >= 100
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg animate-bounce"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            <Flame size={14} /> ULTIMATE (100%)
          </button>
        </div>
      </div>

      {/* Game Over Screen */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-red-500/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <Skull
              size={48}
              className="text-red-500 mx-auto mb-2 animate-bounce"
            />
            <h2 className="text-2xl font-black text-red-500 mb-1 uppercase tracking-widest">
              DUNGEON BREACHED!
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Monsters overran your castle gate defense.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Final Score:</span>
                <strong className="text-sky-400 font-bold">{score}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Highest Wave:</span>
                <strong className="text-amber-400 font-bold">{wave}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>High Score:</span>
                <strong className="text-emerald-400 font-bold">
                  {highScore}
                </strong>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg transition flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              <RotateCcw size={16} /> REPLAY DEFENSE
            </button>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => {
                setShowHelp(false);
                focusInput();
              }}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-black text-amber-400 mb-2 tracking-wider flex items-center gap-2">
              <Trophy size={20} /> HOW TO PLAY
            </h2>

            <div className="space-y-2 text-xs text-slate-300 mb-4">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-sky-400 block mb-0.5">
                  ⚔️ Solve to Attack
                </strong>
                Input math answers to strike the enemy nearest to your castle
                gate.
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-emerald-400 block mb-0.5">
                  🔥 Combos & Points
                </strong>
                Speedy correct answers multiply your total score earnings.
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-amber-400 block mb-0.5">
                  🌋 Earthquake Ultimate
                </strong>
                Reach 100% mana charge to instantly destroy all monsters on
                screen.
              </div>
            </div>

            <button
              onClick={() => {
                setShowHelp(false);
                focusInput();
              }}
              className="w-full py-2 bg-amber-500 text-slate-950 font-black rounded-lg hover:bg-amber-400 transition"
            >
              RETURN TO BATTLE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
