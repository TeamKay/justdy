"use client";

import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles, Text } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { ArrowLeft, ArrowRight, Award, BookOpen, CheckCircle2, Coins, Crown, Flame, GraduationCap, Heart, Lightbulb, LockKeyhole, Shield, Sparkles as SparkleIcon, Star, Swords, Trophy, UserRound, X } from "lucide-react";

type Difficulty = "beginner" | "intermediate" | "advanced";
type Props = { onClose: () => void; onComplete: (score: number, total: number, difficulty: Difficulty, mode: "practice" | "timed", streak: number) => void };
type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type HeroStyle = "knight" | "ranger" | "mage";
import { makeAdaptiveQuestion, makeCurriculumQuestion, type MathQuestQuestion } from "./mathQuestCurriculum";
type Question = MathQuestQuestion;
type Save = { grade: Grade; avatar: number; name: string; heroStyle?: HeroStyle; xp: number; coins: number; wins: number; bestStreak: number; answered: number; correct: number; topicStats: Record<string, { right: number; total: number }>; unlocked: string[] };

const KEY = "justdy-math-quest-adventure-v2";
const defaults: Save = { grade: 3, avatar: 0, name: "Math Hero", heroStyle: "knight", xp: 0, coins: 0, wins: 0, bestStreak: 0, answered: 0, correct: 0, topicStats: {}, unlocked: ["number-village"] };
const worlds = [
  { id: "number-village", name: "Number Village", subtitle: "The Valley of Numbers", topic: "Number sense & operations", grade: "1–3", color: "#64c98a", enemy: "Mossling", reward: 30 },
  { id: "fraction-forest", name: "Fraction Forest", subtitle: "The Whispering Woods", topic: "Fractions & decimals", grade: "3–5", color: "#62b7df", enemy: "Thornback", reward: 45 },
  { id: "geometry-isles", name: "Geometry Isles", subtitle: "The Floating Archipelago", topic: "Shapes, space & measurement", grade: "4–6", color: "#b18be8", enemy: "Prismwing", reward: 55 },
  { id: "algebra-citadel", name: "Algebra Citadel", subtitle: "The Crystal Mountains", topic: "Patterns & algebra", grade: "6–8", color: "#e9ae57", enemy: "Equation Golem", reward: 75 },
];
const avatarColors = ["#38bdf8", "#fb923c", "#a78bfa", "#f472b6", "#4ade80", "#facc15"];

function secondStepHint(topic: string) {
  const t = topic.toLowerCase();
  if (t.includes("fraction")) return "Draw or imagine equal parts. Check what the denominator counts before working with the numerator.";
  if (t.includes("decimal") || t.includes("percentage")) return "Write the values in matching place-value columns. For a percent, remember that percent means out of 100.";
  if (t.includes("geometry") || t.includes("area") || t.includes("measurement") || t.includes("volume")) return "Identify what the question asks for, choose the matching formula, then substitute the measurements with their units.";
  if (t.includes("ratio")) return "Compare the two parts and look for the same scale factor in both quantities.";
  if (t.includes("integer")) return "Think about direction on a number line: positive moves right and negative moves left.";
  if (t.includes("algebra") || t.includes("expression")) return "Keep both sides balanced. Undo operations in reverse order when isolating a variable.";
  if (t.includes("division") || t.includes("sharing")) return "Use the related multiplication fact to check how many equal groups are needed.";
  if (t.includes("multiplication") || t.includes("groups")) return "Break the calculation into smaller equal groups, then combine the partial totals.";
  return "Underline the important numbers, decide which operation or rule connects them, and solve one step at a time.";
}

function readSave(): Save {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Save>;
    return { ...defaults, ...parsed, topicStats: parsed.topicStats ?? {}, unlocked: parsed.unlocked ?? defaults.unlocked };
  } catch { return defaults; }
}
function saveProgress(value: Save) { try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* local progress remains playable when storage is unavailable */ } }
function HeroModel({ color, enemy = false, attacking = false, style = "knight" }: { color: string; enemy?: boolean; attacking?: boolean; style?: HeroStyle }) {
  const root = useRef<Group>(null);
  const leftArm = useRef<Mesh>(null);
  const rightArm = useRef<Mesh>(null);
  const weapon = useRef<Group>(null);
  const shield = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (root.current) {
      root.current.position.y = -0.35 + Math.sin(t * 2.1 + (enemy ? 1.2 : 0)) * 0.055;
      root.current.rotation.y = Math.sin(t * 0.7 + (enemy ? 1 : 0)) * 0.09;
      root.current.position.x = attacking ? Math.sin(t * 13) * 0.2 : 0;
    }
    if (leftArm.current) leftArm.current.rotation.z = Math.sin(t * 2.4) * 0.12;
    if (rightArm.current) rightArm.current.rotation.z = attacking ? -0.95 + Math.sin(t * 15) * 0.35 : Math.sin(t * 2.4 + 1) * 0.12;
    if (weapon.current) {
      weapon.current.rotation.z = attacking ? -0.75 + Math.sin(t * 15) * 0.72 : style === "mage" ? -0.08 : -0.22;
      weapon.current.position.y = attacking ? 0.82 + Math.sin(t * 15) * 0.12 : 0.72;
    }
    if (shield.current) shield.current.rotation.z = attacking ? 0.28 : Math.sin(t * 2) * 0.035;
  });
  const skin = enemy ? "#a78bfa" : "#9a5e3d";
  const trim = enemy ? "#d8b4fe" : "#facc15";
  const armor = enemy ? "#4c1d95" : style === "ranger" ? "#166534" : style === "mage" ? "#4c1d95" : "#1e40af";
  return <group ref={root} position={[0, -0.35, 0]} scale={enemy ? 1.08 : 1}>
    {/* boots and articulated legs */}
    <mesh position={[-0.17, -0.12, 0.02]}><capsuleGeometry args={[0.115, 0.34, 5, 10]} /><meshStandardMaterial color="#26334d" roughness={0.72} /></mesh>
    <mesh position={[0.17, -0.12, 0.02]}><capsuleGeometry args={[0.115, 0.34, 5, 10]} /><meshStandardMaterial color="#26334d" roughness={0.72} /></mesh>
    <mesh position={[-0.17, -0.31, 0.13]}><boxGeometry args={[0.28, 0.13, 0.38]} /><meshStandardMaterial color={enemy ? "#312e81" : "#6b442c"} roughness={0.6} /></mesh>
    <mesh position={[0.17, -0.31, 0.13]}><boxGeometry args={[0.28, 0.13, 0.38]} /><meshStandardMaterial color={enemy ? "#312e81" : "#6b442c"} roughness={0.6} /></mesh>
    {/* torso, layered tunic and shoulder plates */}
    <mesh position={[0, 0.48, 0]} castShadow><capsuleGeometry args={[0.32, 0.48, 6, 16]} /><meshStandardMaterial color={color} roughness={0.42} metalness={0.12} /></mesh>
    <mesh position={[0, 0.53, 0.255]}><sphereGeometry args={[0.29, 16, 12]} /><meshStandardMaterial color={armor} metalness={0.38} roughness={0.3} /></mesh>
    <mesh position={[0, 0.35, 0.29]}><boxGeometry args={[0.36, 0.09, 0.055]} /><meshStandardMaterial color={trim} metalness={0.72} roughness={0.22} /></mesh>
    <mesh position={[-0.29, 0.75, 0.02]} rotation={[0, 0, 0.35]}><sphereGeometry args={[0.19, 12, 10]} /><meshStandardMaterial color={armor} metalness={0.45} /></mesh>
    <mesh position={[0.29, 0.75, 0.02]} rotation={[0, 0, -0.35]}><sphereGeometry args={[0.19, 12, 10]} /><meshStandardMaterial color={armor} metalness={0.45} /></mesh>
    {/* face, eyes, brows and smile */}
    <mesh position={[0, 1.08, 0.015]} castShadow><sphereGeometry args={[0.34, 28, 24]} /><meshStandardMaterial color={skin} roughness={0.58} /></mesh>
    <mesh position={[-0.125, 1.13, 0.315]}><sphereGeometry args={[0.052, 14, 12]} /><meshBasicMaterial color="#172033" /></mesh>
    <mesh position={[0.125, 1.13, 0.315]}><sphereGeometry args={[0.052, 14, 12]} /><meshBasicMaterial color="#172033" /></mesh>
    <mesh position={[-0.125, 1.2, 0.32]} rotation={[0, 0, 0.15]}><boxGeometry args={[0.105, 0.025, 0.025]} /><meshBasicMaterial color="#422b28" /></mesh>
    <mesh position={[0.125, 1.2, 0.32]} rotation={[0, 0, -0.15]}><boxGeometry args={[0.105, 0.025, 0.025]} /><meshBasicMaterial color="#422b28" /></mesh>
    <mesh position={[0, 0.96, 0.335]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.07, 0.012, 6, 16, Math.PI]} /><meshBasicMaterial color="#713f35" /></mesh>
    {/* hair / helmet silhouette */}
    <mesh position={[0, 1.34, -0.035]}><sphereGeometry args={[0.32, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]} /><meshStandardMaterial color={enemy ? "#312e81" : style === "mage" ? "#21154b" : "#30251f"} roughness={0.9} /></mesh>
    {[-0.2, -0.06, 0.1, 0.23].map((x, i) => <mesh key={i} position={[x, 1.39 + (i % 2) * 0.045, 0.12]} rotation={[0, 0, (i - 1.5) * 0.16]}><coneGeometry args={[0.11, 0.22, 6]} /><meshStandardMaterial color={enemy ? "#6d28d9" : "#30251f"} /></mesh>)}
    {/* arms and gauntlets */}
    <mesh ref={leftArm} position={[-0.39, 0.62, 0]}><capsuleGeometry args={[0.105, 0.38, 4, 10]} /><meshStandardMaterial color={skin} /></mesh>
    <mesh ref={rightArm} position={[0.39, 0.62, 0]}><capsuleGeometry args={[0.105, 0.38, 4, 10]} /><meshStandardMaterial color={skin} /></mesh>
    <mesh position={[-0.4, 0.39, 0.08]}><sphereGeometry args={[0.13, 12, 10]} /><meshStandardMaterial color={trim} metalness={0.65} /></mesh>
    <mesh position={[0.4, 0.39, 0.08]}><sphereGeometry args={[0.13, 12, 10]} /><meshStandardMaterial color={trim} metalness={0.65} /></mesh>
    {/* class identity: ranger hood and bow, mage robe and staff, knight crest and shield */}
    {!enemy && style === "ranger" && <group><mesh position={[0, 1.28, -0.08]}><coneGeometry args={[0.46, 0.48, 5]} /><meshStandardMaterial color="#14532d" roughness={0.82} /></mesh><mesh position={[0.47, 0.72, -0.08]} rotation={[0, 0, -0.1]}><torusGeometry args={[0.3, 0.035, 8, 24, Math.PI]} /><meshStandardMaterial color="#d6a85f" metalness={0.35} /></mesh><mesh position={[0.47, 0.72, -0.08]}><cylinderGeometry args={[0.018, 0.018, 0.62, 8]} /><meshStandardMaterial color="#fef3c7" /></mesh></group>}
    {!enemy && style === "mage" && <group><mesh position={[0, 1.47, 0]}><coneGeometry args={[0.32, 0.58, 6]} /><meshStandardMaterial color="#5b21b6" metalness={0.2} /></mesh><mesh position={[0, 0.42, -0.22]}><coneGeometry args={[0.5, 0.92, 6, 1, true]} /><meshStandardMaterial color="#6d28d9" side={2} transparent opacity={0.88} /></mesh><mesh position={[0.51, 1.08, 0]}><sphereGeometry args={[0.13, 14, 12]} /><meshStandardMaterial color="#67e8f9" emissive="#67e8f9" emissiveIntensity={1.8} /></mesh></group>}
    {!enemy && style === "knight" && <mesh position={[0, 1.48, 0]}><coneGeometry args={[0.18, 0.32, 5]} /><meshStandardMaterial color="#facc15" metalness={0.45} /></mesh>}
    {!enemy && <group ref={shield} position={[-0.55, 0.57, 0.12]} rotation={[0, 0, 0.08]}><mesh><cylinderGeometry args={[0.26, 0.34, 0.09, 6]} /><meshStandardMaterial color={armor} metalness={0.5} roughness={0.28} /></mesh><mesh position={[0, 0, 0.055]}><torusGeometry args={[0.19, 0.025, 8, 6]} /><meshStandardMaterial color={trim} metalness={0.8} /></mesh><mesh position={[0, 0, 0.11]}><octahedronGeometry args={[0.1, 0]} /><meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={0.45} /></mesh></group>}
    {!enemy && <group ref={weapon} position={[0.52, 0.72, 0.08]} rotation={[0, 0, -0.25]}>
      {style === "mage" ? <><mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.035, 0.045, 0.8, 8]} /><meshStandardMaterial color="#8b5e3c" /></mesh><mesh position={[0, 0.7, 0]}><octahedronGeometry args={[0.17, 1]} /><meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={1.8} metalness={0.4} /></mesh></> : <><mesh position={[0, 0.27, 0]} rotation={[0, 0, -0.12]}><boxGeometry args={[0.075, 0.62, 0.055]} /><meshStandardMaterial color="#d9f4ff" metalness={0.85} roughness={0.18} emissive="#38bdf8" emissiveIntensity={0.35} /></mesh><mesh position={[0, -0.07, 0]}><boxGeometry args={[0.28, 0.07, 0.09]} /><meshStandardMaterial color="#facc15" metalness={0.65} /></mesh><mesh position={[0, -0.19, 0]}><cylinderGeometry args={[0.045, 0.055, 0.22, 8]} /><meshStandardMaterial color="#8b5e3c" /></mesh></>}
    </group>}
    {enemy && <group><mesh position={[0, 1.52, 0]}><coneGeometry args={[0.22, 0.48, 5]} /><meshStandardMaterial color="#c084fc" emissive="#7c3aed" emissiveIntensity={0.35} /></mesh><mesh position={[0, 0.55, -0.27]}><torusGeometry args={[0.42, 0.07, 8, 20]} /><meshStandardMaterial color="#a78bfa" metalness={0.35} /></mesh></group>}
  </group>;
}
function Crystal({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => { if (ref.current) { ref.current.rotation.y = clock.elapsedTime * 0.55; ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.8 + position[0]) * 0.08; } });
  return <mesh ref={ref} position={position} scale={scale} castShadow><octahedronGeometry args={[0.34, 0]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} metalness={0.35} roughness={0.2} /></mesh>;
}
function BattleScene({ heroStyle, enemyName, hit, bossPhase, enemyAttack, worldId }: { heroStyle: HeroStyle; enemyName: string; hit: number; bossPhase: number; enemyAttack: boolean; worldId: string }) {
  const guardianArt = worldId === "number-village" ? "number" : worldId === "fraction-forest" ? "fraction" : worldId === "geometry-isles" ? "geometry" : "algebra";
  return <div className={`relative h-80 overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-b from-[#142b50] via-[#1c4162] to-[#173a3c] sm:h-[26rem] ${enemyAttack ? "ring-2 ring-rose-400/60" : hit > 0 ? "ring-2 ring-amber-300/50" : ""}`}>
    <Canvas camera={{ position: [0, 2.6, 6.8], fov: 42 }} shadows dpr={[1, 1.5]}>
      <fog attach="fog" args={["#173a55", 7, 17]} />
      <ambientLight intensity={1.05} /><directionalLight position={[4, 7, 5]} intensity={2.2} castShadow /><pointLight position={[0, 3, 0]} intensity={1.2} color="#67e8f9" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]} receiveShadow><circleGeometry args={[5, 64]} /><meshStandardMaterial color="#315d58" roughness={0.95} /></mesh>
      <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[2.15, 2.25, 64]} /><meshBasicMaterial color="#9be7d0" transparent opacity={0.6} /></mesh>
      <mesh position={[0, -0.37, -2.3]}><cylinderGeometry args={[0.9, 1.3, 0.35, 8]} /><meshStandardMaterial color="#547b7a" roughness={0.9} /></mesh>
      <mesh position={[-3.25, 0.25, -2.1]}><cylinderGeometry args={[0.18, 0.24, 1.65, 8]} /><meshStandardMaterial color="#6b8298" roughness={0.72} /></mesh>
      <mesh position={[3.25, 0.25, -2.1]}><cylinderGeometry args={[0.18, 0.24, 1.65, 8]} /><meshStandardMaterial color="#6b8298" roughness={0.72} /></mesh>
      <mesh position={[-3.25, 1.1, -2.1]}><coneGeometry args={[0.28, 0.42, 6]} /><meshStandardMaterial color="#8dd8dc" emissive="#2dd4bf" emissiveIntensity={0.25} /></mesh>
      <mesh position={[3.25, 1.1, -2.1]}><coneGeometry args={[0.28, 0.42, 6]} /><meshStandardMaterial color="#c4b5fd" emissive="#8b5cf6" emissiveIntensity={0.25} /></mesh>
      <Crystal position={[-2.65, 0.25, -0.8]} color="#67e8f9" scale={0.85} /><Crystal position={[2.7, 0.45, -1.2]} color="#c4b5fd" scale={1.1} /><Crystal position={[0, 0.15, -3]} color="#facc15" scale={0.65} />
      <Sparkles count={28} scale={[7, 3, 4]} size={2.2} color="#b9edff" />
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={1.15} maxPolarAngle={1.55} />
    </Canvas>
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/25"/>
    <div className="absolute inset-x-0 top-3 flex justify-around px-8 text-[10px] font-black tracking-[.18em] text-white/80 sm:text-xs">
      <span className="rounded-full border border-white/15 bg-slate-950/35 px-3 py-1.5 backdrop-blur">YOUR HERO</span>
      <span className={`rounded-full border px-3 py-1.5 backdrop-blur ${bossPhase === 3 ? "border-rose-300/40 bg-rose-950/50 text-rose-100" : "border-white/15 bg-slate-950/35"}`}>{enemyName.toUpperCase()} · PHASE {bossPhase}</span>
    </div>
    <div className={`absolute bottom-2 left-[12%] z-10 h-[78%] w-[34%] transition-transform duration-300 ${hit > 0 ? "scale-105 -translate-y-2" : "hover:-translate-y-1"}`}>
      <img src={`/mathquest/characters/${heroStyle}.png`} alt={`${heroStyle} hero`} className="h-full w-full object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,.5)]"/>
    </div>
    <div className={`absolute bottom-2 right-[10%] z-10 h-[82%] w-[38%] transition-transform duration-300 ${enemyAttack ? "scale-105 -translate-x-2" : "hover:-translate-y-1"}`}>
      <img src={`/mathquest/guardians/${guardianArt}-guardian.png`} alt={`${enemyName} guardian`} className="h-full w-full object-contain drop-shadow-[0_18px_20px_rgba(0,0,0,.6)]"/>
    </div>
    {hit > 0 && <div className="pointer-events-none absolute right-[22%] top-[26%] z-20 animate-bounce text-3xl font-black text-amber-200 drop-shadow-[0_0_16px_rgba(251,191,36,.95)]">−{hit} HP</div>}
    {enemyAttack && <div className="pointer-events-none absolute left-[20%] top-[35%] z-20 animate-ping text-5xl font-black text-rose-200 drop-shadow-lg">!</div>}
    <div className="pointer-events-none absolute bottom-3 left-3 z-30 rounded-xl border border-white/15 bg-slate-950/55 px-3 py-2 text-xs font-bold text-white backdrop-blur">⚔ Math Battle Arena</div>
  </div>;
}

function WorldMapScene({ selectedId, unlockedIds, onSelect }: { selectedId: string; unlockedIds: string[]; onSelect: (id: string) => void }) {
  const positions: [number, number, number][] = [[-2.25, 0, 0.75], [2.15, 0, 0.65], [-2.2, 0, -1.8], [2.2, 0, -1.9]];
  return <div className="relative mb-5 h-72 overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_18%_18%,rgba(74,222,128,.18),transparent_30%),radial-gradient(ellipse_at_82%_24%,rgba(167,139,250,.2),transparent_32%),linear-gradient(145deg,#10294a,#173e59_55%,#102a3b)] sm:h-80">
    <Canvas camera={{ position: [0, 5.8, 8.5], fov: 42 }} dpr={[1, 1.5]}>
      <fog attach="fog" args={["#173e59", 9, 22]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 8, 5]} intensity={2.1} castShadow />
      <pointLight position={[0, 3, 0]} intensity={1.3} color="#67e8f9" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]}><circleGeometry args={[6.2, 64]} /><meshStandardMaterial color="#17394a" roughness={0.95} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.68, 0]}><ringGeometry args={[4.6, 4.68, 64]} /><meshBasicMaterial color="#55c9d4" transparent opacity={0.35} /></mesh>
      {worlds.map((w, i) => {
        const pos = positions[i];
        const unlocked = unlockedIds.includes(w.id) || i === 0;
        const active = selectedId === w.id;
        return <group key={w.id} position={pos} onClick={(event) => { event.stopPropagation(); if (unlocked) onSelect(w.id); }}>
          <mesh position={[0, -0.2, 0]} castShadow receiveShadow><cylinderGeometry args={[1.05, 0.78, 0.48, 7]} /><meshStandardMaterial color={unlocked ? w.color : "#536174"} roughness={0.8} /></mesh>
          <mesh position={[0, 0.18, 0]} castShadow><sphereGeometry args={[0.86, 7, 6]} /><meshStandardMaterial color={unlocked ? w.color : "#536174"} roughness={0.88} /></mesh>
          <mesh position={[0, 0.82, 0]} castShadow><coneGeometry args={[0.38, 1.05, 6]} /><meshStandardMaterial color={unlocked ? "#2f765e" : "#4b5563"} roughness={0.9} /></mesh>
          <mesh position={[-0.52, 0.55, 0.2]}><octahedronGeometry args={[0.19, 0]} /><meshStandardMaterial color={unlocked ? "#d9fbff" : "#64748b"} emissive={unlocked ? w.color : "#334155"} emissiveIntensity={0.8} /></mesh>
          {/* Realm-specific landmarks keep each destination visually distinct. */}
          {i === 0 && <group>
            <mesh position={[0.52, 0.48, 0.12]} castShadow><boxGeometry args={[0.42, 0.42, 0.38]} /><meshStandardMaterial color={unlocked ? "#f4c77a" : "#64748b"} /></mesh>
            <mesh position={[0.52, 0.78, 0.12]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[0.34, 0.38, 4]} /><meshStandardMaterial color={unlocked ? "#b94f48" : "#475569"} /></mesh>
            <mesh position={[-0.65, 0.5, -0.12]}><sphereGeometry args={[0.22, 10, 8]} /><meshStandardMaterial color={unlocked ? "#55a86d" : "#64748b"} /></mesh>
          </group>}
          {i === 1 && <group>
            {[-0.58, 0.55].map((x, n) => <group key={n} position={[x, 0.42, n ? -0.12 : 0.14]}>
              <mesh castShadow><cylinderGeometry args={[0.07, 0.1, 0.48, 7]} /><meshStandardMaterial color={unlocked ? "#76513b" : "#64748b"} /></mesh>
              <mesh position={[0, 0.36, 0]} castShadow><coneGeometry args={[0.29, 0.62, 7]} /><meshStandardMaterial color={unlocked ? (n ? "#3f9b69" : "#64b77a") : "#475569"} /></mesh>
            </group>)}
            <mesh position={[0, 0.38, 0.42]}><sphereGeometry args={[0.13, 10, 8]} /><meshStandardMaterial color={unlocked ? "#d8a6ff" : "#64748b"} emissive={unlocked ? "#a855f7" : "#334155"} emissiveIntensity={0.8} /></mesh>
          </group>}
          {i === 2 && <group>
            {[-0.55, 0.52].map((x, n) => <mesh key={n} position={[x, 0.58, n ? -0.16 : 0.18]} rotation={[0, 0, Math.PI / 8]} castShadow><octahedronGeometry args={[0.32, 0]} /><meshStandardMaterial color={unlocked ? (n ? "#b8a0ff" : "#8ee9f5") : "#64748b"} metalness={0.35} roughness={0.25} emissive={unlocked ? w.color : "#334155"} emissiveIntensity={0.35} /></mesh>)}
            <mesh position={[0, 0.35, -0.38]}><torusGeometry args={[0.24, 0.055, 8, 24]} /><meshStandardMaterial color={unlocked ? "#e9dcff" : "#64748b"} emissive={unlocked ? "#a78bfa" : "#334155"} emissiveIntensity={0.4} /></mesh>
          </group>}
          {i === 3 && <group>
            <mesh position={[0, 0.65, -0.12]} castShadow><boxGeometry args={[0.48, 0.82, 0.42]} /><meshStandardMaterial color={unlocked ? "#64748b" : "#475569"} /></mesh>
            <mesh position={[0, 1.12, -0.12]} castShadow><coneGeometry args={[0.38, 0.48, 5]} /><meshStandardMaterial color={unlocked ? "#d7b46a" : "#64748b"} metalness={0.25} /></mesh>
            <mesh position={[-0.38, 0.52, 0.12]} castShadow><coneGeometry args={[0.34, 0.7, 5]} /><meshStandardMaterial color={unlocked ? "#8b9dbb" : "#475569"} /></mesh>
            <mesh position={[0.4, 0.5, 0.12]} castShadow><coneGeometry args={[0.3, 0.62, 5]} /><meshStandardMaterial color={unlocked ? "#8b9dbb" : "#475569"} /></mesh>
          </group>}
          {active && <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.12, 1.2, 48]} /><meshBasicMaterial color="#ffffff" /></mesh>}
          <Text position={[0, 1.55, 0]} fontSize={0.2} color={active ? "#ffffff" : unlocked ? "#dbeafe" : "#94a3b8"} anchorX="center" outlineWidth={0.012} outlineColor="#102033">{w.name}</Text>
          {!unlocked && <Text position={[0, 1.28, 0]} fontSize={0.13} color="#cbd5e1" anchorX="center">LOCKED</Text>}
        </group>;
      })}
      <Sparkles count={55} scale={[10, 3, 10]} size={1.8} color="#a5f3fc" speed={0.25} />
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.72} maxPolarAngle={1.18} />
    </Canvas>
    <div className="pointer-events-none absolute bottom-3 left-3 rounded-xl border border-white/15 bg-slate-950/50 px-3 py-2 text-[11px] font-bold text-white backdrop-blur">✦ THE FOUR REALMS · Each island has its own landmark</div>
  </div>;
}

export default function MathQuestGame({ onClose, onComplete }: Props) {
  const [save, setSave] = useState<Save>(() => readSave());
  const [screen, setScreen] = useState<"profile" | "map" | "battle" | "summary">("profile");
  const [profileSync, setProfileSync] = useState<"loading" | "synced" | "local">("loading");
  const initialSave = useRef(save);

  const [grade, setGrade] = useState<Grade>(save.grade);
  const [avatar, setAvatar] = useState(save.avatar);
  const [heroStyle, setHeroStyle] = useState<HeroStyle>(save.heroStyle ?? "knight");
  const [name, setName] = useState(save.name);
  const [worldId, setWorldId] = useState(worlds[0].id);
  const [selectedMapWorld, setSelectedMapWorld] = useState(worlds[0].id);
  const [level, setLevel] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<Question>(() => makeCurriculumQuestion(save.grade, 1, 0));
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [battleHp, setBattleHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [hint, setHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [coachMessage, setCoachMessage] = useState("Read the question carefully. You can ask for a hint whenever you need one.");
  const [battleTopicStats, setBattleTopicStats] = useState<Record<string, { right: number; total: number }>>({});
  const [lastHit, setLastHit] = useState(0);
  const [enemyAttack, setEnemyAttack] = useState(false);
  const [abilityCharge, setAbilityCharge] = useState(0);
  const [abilityArmed, setAbilityArmed] = useState(false);
  const [abilityMessage, setAbilityMessage] = useState("Answer correctly to charge your hero ability.");
  const [recent, setRecent] = useState<string[]>([]);
  const [adaptiveMessage, setAdaptiveMessage] = useState("Let's find your adventure level!");
  useEffect(() => {
    let active = true;
    fetch("/api/games/progress", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Profile sync unavailable");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const remote = data?.profile as Partial<Save> | null;
        if (remote && typeof remote === "object") {
          const restored = { ...defaults, ...remote, topicStats: remote.topicStats ?? {}, unlocked: remote.unlocked ?? defaults.unlocked } as Save;
          setSave(restored);
          setGrade(restored.grade);
          setAvatar(restored.avatar);
          setHeroStyle(restored.heroStyle ?? "knight");
          setName(restored.name);
          setProfileSync("synced");
          saveProgress(restored);
        } else {
          // One-time migration: preserve an existing device save in the signed-in account.
          fetch("/api/games/progress", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "profile", profile: initialSave.current }),
          }).then((response) => {
            if (active) setProfileSync(response.ok ? "synced" : "local");
          }).catch(() => { if (active) setProfileSync("local"); });
        }
      })
      .catch(() => { if (active) setProfileSync("local"); });
    return () => { active = false; };
  }, []);
  const world = worlds.find((item) => item.id === worldId) ?? worlds[0];
  const bossPhase = enemyHp > 66 ? 1 : enemyHp > 33 ? 2 : 3;
  const bossPhaseName = bossPhase === 1 ? "Awakening" : bossPhase === 2 ? "Power Surge" : "Last Stand";
  const bossPhaseHint = bossPhase === 1 ? "The guardian is studying your moves." : bossPhase === 2 ? "The guardian is faster and hits harder!" : "The guardian is desperate. Stay focused!";
  const accuracy = save.answered ? Math.round((save.correct / save.answered) * 100) : 0;
  const mastery = useMemo(() => Object.entries(save.topicStats).map(([topic, stat]) => ({ topic, percent: Math.round((stat.right / Math.max(1, stat.total)) * 100), total: stat.total })).sort((a, b) => (a.total < 3 ? -1 : b.total < 3 ? 1 : a.percent - b.percent)), [save.topicStats]);

  function persist(next: Save) {
    setSave(next);
    saveProgress(next);
    fetch("/api/games/progress", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "profile", profile: next }),
    }).then((response) => {
      if (response.ok) setProfileSync("synced");
      else if (response.status === 401) setProfileSync("local");
    }).catch(() => setProfileSync("local"));
  }
  function beginBattle(id: string) {
    setWorldId(id); setLevel(1); setQuestionIndex(0); setScore(0); setStreak(0); setBattleHp(100); setEnemyHp(100); setSelected(null); setHint(false); setHintLevel(0); setCoachMessage("Read the question carefully. You can ask for a hint whenever you need one."); setBattleTopicStats({}); setLastHit(0); setEnemyAttack(false); setAbilityCharge(0); setAbilityArmed(false); setAbilityMessage("Answer correctly to charge your hero ability."); setRecent([]); const first = makeAdaptiveQuestion(grade, 1, worlds.findIndex(w => w.id === id), save.topicStats); setQuestion(first.question); setAdaptiveMessage(first.message); setScreen("battle");
  }
  function choose(value: string) {
    if (selected) return;
    setSelected(value);
    const right = value === question.answer;
    setCoachMessage(right ? `Well done. You used the right approach for ${question.topic.toLowerCase()}. Explain the step to yourself so you can use it again.` : `Let's learn from this attempt. Review the worked steps, then look for the key idea in ${question.topic.toLowerCase()}.`);
    setBattleTopicStats(prev => { const old = prev[question.topic] ?? { right: 0, total: 0 }; return { ...prev, [question.topic]: { right: old.right + (right ? 1 : 0), total: old.total + 1 } }; });
    const nextStreak = right ? streak + 1 : 0;
    setStreak(nextStreak);
    const abilityBonus = right && abilityArmed && heroStyle === "ranger" ? 24 : right && abilityArmed && heroStyle === "mage" ? 34 : 0;
    const hitDamage = right ? 18 + Math.min(24, nextStreak * 3) + abilityBonus : 0;
    setEnemyAttack(!right);
    setLastHit(hitDamage);
    if (right) {
      setAbilityCharge(v => Math.min(100, v + 35));
      if (abilityArmed && heroStyle !== "knight") setAbilityMessage(heroStyle === "ranger" ? "Bullseye! Precision shot dealt bonus damage." : "Arcane burst! Your spell dealt bonus damage.");
      else setAbilityMessage("Your correct answer charged your hero ability.");
    } else if (heroStyle === "knight" && abilityArmed) {
      setAbilityMessage("Shield block! Your ability reduced the damage.");
    } else {
      setAbilityMessage("Keep going—correct answers charge your special ability.");
    }
    setRecent(prev => [...prev.slice(-3), right ? "Correct" : "Try again"]);
    const currentStat = save.topicStats[question.topic] ?? { right: 0, total: 0 };
    const nextStats = { ...save.topicStats, [question.topic]: { right: currentStat.right + (right ? 1 : 0), total: currentStat.total + 1 } };
    const nextSave = { ...save, answered: save.answered + 1, correct: save.correct + (right ? 1 : 0), bestStreak: Math.max(save.bestStreak, nextStreak), topicStats: nextStats };
    persist(nextSave);
    if (right) { setScore(v => v + 1); setEnemyHp(v => Math.max(0, v - hitDamage)); if (abilityArmed && heroStyle !== "knight") { setAbilityArmed(false); setAbilityCharge(0); } setAdaptiveMessage(nextStreak >= 3 ? "Amazing streak! Your next challenge will stretch your skills." : "Direct hit! Your maths powered that move."); }
    else { setBattleHp(v => Math.max(0, v - (heroStyle === "knight" && abilityArmed ? 4 : 12))); if (heroStyle === "knight" && abilityArmed) { setAbilityArmed(false); setAbilityCharge(0); } setAdaptiveMessage("No worries. Here's a learning clue—take your time and try the next one."); }
  }
  function activateAbility() {
    if (abilityCharge < 100 || abilityArmed || selected) return;
    setAbilityArmed(true);
    setAbilityMessage(heroStyle === "knight" ? "Guardian Shield active: your next mistake deals reduced damage." : heroStyle === "ranger" ? "Precision Shot ready: your next correct answer deals extra damage." : "Arcane Blast ready: your next correct answer deals heavy bonus damage.");
  }
  function advance() {
    if (!selected) return;
    if (enemyHp <= 0 || battleHp <= 0 || questionIndex >= 7) { finishBattle(); return; }
    // Include the just-submitted answer explicitly: React state updates from choose()
    // may not yet be reflected in this event handler's captured `save` value.
    const previous = save.topicStats[question.topic] ?? { right: 0, total: 0 };
    const currentStats = { ...save.topicStats, [question.topic]: { right: previous.right + (selected === question.answer ? 1 : 0), total: previous.total + 1 } };
    const stat = currentStats[question.topic];
    const rate = stat.total ? stat.right / stat.total : 0.5;
    const nextLevel = rate < 0.45 && stat.total >= 3 ? Math.max(0, level - 1) : rate > 0.82 && stat.total >= 4 ? Math.min(3, level + 1) : level;
    setLevel(nextLevel);
    const nextAdaptive = makeAdaptiveQuestion(grade, nextLevel, questionIndex + worlds.findIndex(w => w.id === worldId), currentStats, question.topic);
    setAdaptiveMessage(nextLevel < level ? `A gentler challenge is next. ${nextAdaptive.message}` : nextLevel > level ? `You're ready for a tougher challenge! ${nextAdaptive.message}` : nextAdaptive.message);
    setQuestionIndex(v => v + 1); setSelected(null); setHint(false); setHintLevel(0); setCoachMessage("Take your time with the next challenge. Try explaining your thinking as you go."); setLastHit(0); setEnemyAttack(false);
    setQuestion(nextAdaptive.question);
  }
  function finishBattle() {
    const won = enemyHp <= 0 || (score >= 5 && battleHp > 0);
    const earnedXp = Math.max(10, score * 18 + (won ? 60 : 15) + Math.max(0, streak * 4));
    const earnedCoins = Math.max(5, score * 5 + (won ? world.reward : 8));
    const next = { ...save, grade, avatar, name: name.trim() || "Math Hero", heroStyle, xp: save.xp + earnedXp, coins: save.coins + earnedCoins, wins: save.wins + (won ? 1 : 0), unlocked: won ? Array.from(new Set([...save.unlocked, worlds[Math.min(3, worlds.findIndex(w => w.id === worldId) + 1)]?.id ?? worldId])) : save.unlocked };
    persist(next); onComplete(score, Math.max(1, questionIndex + 1), score >= 6 ? "advanced" : score >= 3 ? "intermediate" : "beginner", "practice", streak); setScreen("summary");
  }
  function saveProfile() { persist({ ...save, grade, avatar, heroStyle, name: name.trim() || "Math Hero" }); setScreen("map"); }
  const won = enemyHp <= 0 || (score >= 5 && battleHp > 0);

  return <div className="fixed inset-0 z-[1300] overflow-y-auto bg-[#081426]/90 p-2 backdrop-blur-md sm:p-5" role="dialog" aria-modal="true" aria-labelledby="math-quest-title">
    <div className="mx-auto my-2 w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#101f37] text-white shadow-2xl sm:my-5">
      <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-[#172e50] via-[#1c4961] to-[#234d4a] px-5 py-5 sm:px-8">
        <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full border-[34px] border-white/5" />
        <div className="relative flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-200">JUSTDY ORIGINAL · ADAPTIVE MATH ADVENTURE</p><h2 id="math-quest-title" className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Math Quest <span className="text-cyan-300">3D</span></h2><p className="mt-1 text-sm text-slate-300">Your maths is your greatest power.</p></div><div className="flex items-center gap-2"><span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-200"><Coins className="mr-1 inline h-4 w-4" />{save.coins}</span><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-100"><Star className="mr-1 inline h-4 w-4" />{save.xp} XP</span><span className="hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-2 text-[10px] font-bold text-slate-300 sm:inline" title={profileSync === "synced" ? "Adventure profile synced to your account" : "Adventure profile is saved on this device"}>{profileSync === "synced" ? "CLOUD SAVE" : profileSync === "loading" ? "SYNCING…" : "DEVICE SAVE"}</span><button onClick={onClose} aria-label="Close Math Quest" className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"><X className="h-5 w-5" /></button></div></div>
      </header>
      <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
        <main className="min-w-0 p-4 sm:p-7">
          {screen === "profile" && <section>
            <div className="mb-6 flex items-center gap-3"><div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200"><UserRound className="h-6 w-6" /></div><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Create your hero</p><h3 className="text-2xl font-black">Who will explore the realms?</h3></div></div>
            <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
              <div className="rounded-3xl border border-white/10 bg-linear-to-b from-[#1d3b5c] to-[#172b47] p-5 text-center"><div className="relative mx-auto flex h-56 w-full items-end justify-center overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_50%_25%,rgba(103,232,249,.28),transparent_48%),linear-gradient(160deg,#244d70,#132b49_65%,#17213e)]"><div className="absolute left-1/2 top-5 h-36 w-36 -translate-x-1/2 rounded-full border border-white/10 bg-white/[.04] shadow-[0_0_60px_rgba(103,232,249,.12)]"/><div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/50 to-transparent"/><img src={`/mathquest/characters/${heroStyle}.png`} alt={`${heroStyle} hero preview`} className="relative z-10 h-[92%] max-w-[80%] object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,.45)] transition-transform duration-500 hover:scale-105"/></div><p className="mt-4 text-lg font-black">{name || "Math Hero"}</p><p className="text-xs text-slate-400">Your adventure avatar · {heroStyle}</p><div className="mt-4 flex justify-center gap-2">{avatarColors.map((color, i) => <button key={color} onClick={() => setAvatar(i)} aria-label={`Choose avatar colour ${i + 1}`} className={`h-8 w-8 rounded-full border-2 transition ${avatar === i ? "scale-110 border-white" : "border-white/20"}`} style={{ backgroundColor: color }}/>)}</div><div className="mt-5"><p className="mb-2 text-xs font-black uppercase tracking-widest text-cyan-200">Choose your hero class</p><div className="grid grid-cols-3 gap-2">{([{id:"knight",label:"Knight",detail:"Brave defender"},{id:"ranger",label:"Ranger",detail:"Forest scout"},{id:"mage",label:"Mage",detail:"Crystal magic"}] as {id:HeroStyle;label:string;detail:string}[]).map(item=><button key={item.id} onClick={()=>setHeroStyle(item.id)} className={`rounded-xl border p-2 text-center transition ${heroStyle===item.id?"border-cyan-300 bg-cyan-300/15 ring-1 ring-cyan-300/30":"border-white/10 bg-white/5 hover:bg-white/10"}`}><img src={`/mathquest/characters/${item.id}.png`} alt={`${item.label} hero`} className="mx-auto mb-1 h-20 w-full object-contain drop-shadow-lg"/><span className="block text-sm font-black">{item.label}</span><span className="mt-1 block text-[10px] text-slate-400">{item.detail}</span></button>)}</div></div></div>
              <div className="space-y-5"><label className="block text-sm font-bold text-slate-200">Hero name<input value={name} maxLength={18} onChange={e => setName(e.target.value)} placeholder="Enter your hero name" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b192d] px-4 py-3 text-white outline-none focus:border-cyan-300"/></label><div><p className="mb-2 text-sm font-bold text-slate-200">Choose your school grade</p><div className="grid grid-cols-4 gap-2">{([1,2,3,4,5,6,7,8] as Grade[]).map(g => <button key={g} onClick={() => setGrade(g)} className={`rounded-xl border py-3 text-sm font-black transition ${grade === g ? "border-cyan-300 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}>Grade {g}</button>)}</div><p className="mt-2 text-xs leading-5 text-slate-400">We&apos;ll begin around Grade {grade} and adjust the challenge as you play. You can change your grade later.</p></div><button onClick={saveProfile} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-4 font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:brightness-110">Enter the adventure <ArrowRight className="h-5 w-5"/></button></div>
            </div>
          </section>}
          {screen === "map" && <section>
            <div className="relative mb-6 overflow-hidden rounded-[30px] border border-cyan-200/20 bg-[radial-gradient(ellipse_at_15%_0%,rgba(45,212,191,.22),transparent_38%),radial-gradient(ellipse_at_90%_20%,rgba(139,92,246,.2),transparent_38%),linear-gradient(130deg,#102b49,#142a46_55%,#211c45)] p-5 sm:p-7">
              <div className="pointer-events-none absolute -right-8 -top-14 h-52 w-52 rounded-full border-[22px] border-white/[.035]" />
              <div className="relative flex flex-wrap items-end justify-between gap-4">
                <div><p className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-200">The Kingdom of Numbers · Grade {grade}</p><h3 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Choose your adventure</h3><p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/70">Four magical realms. Four guardians. Every correct answer brings the kingdom closer to peace.</p></div>
                <button onClick={() => setScreen("profile")} className="rounded-xl border border-white/15 bg-white/[.06] px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-white/10"><UserRound className="mr-2 inline h-4 w-4"/>Edit hero</button>
              </div>
              <div className="relative mt-5 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 shadow-inner"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Hero level</p><p className="mt-1 text-xl font-black text-white">{Math.floor(save.xp/100)+1}</p></div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 shadow-inner"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Realms open</p><p className="mt-1 text-xl font-black text-white">{Math.max(1, new Set(save.unlocked).size)}<span className="text-sm text-slate-400"> / 4</span></p></div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 shadow-inner"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Guardians won</p><p className="mt-1 text-xl font-black text-white">{save.wins}</p></div>
              </div>
            </div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200">World atlas</p><p className="mt-1 text-xs text-slate-400">Choose an unlocked realm to view its guardian and begin a battle.</p></div><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black text-emerald-200">{worlds.filter((w,i)=>save.unlocked.includes(w.id)||i===0).length} REALM{worlds.filter((w,i)=>save.unlocked.includes(w.id)||i===0).length===1?"":"S"} AVAILABLE</span></div>
            <div className="relative mb-5 h-44 overflow-hidden rounded-[24px] border border-white/10 shadow-xl sm:h-56"><img src={`/mathquest/worlds/${selectedMapWorld}.svg`} alt={`${worlds.find(w=>w.id===selectedMapWorld)?.name ?? "MathQuest"} landscape`} className="absolute inset-0 h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-r from-[#081426]/90 via-[#081426]/35 to-transparent"/><div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center p-5 sm:p-7"><p className="text-[10px] font-black uppercase tracking-[.25em] text-cyan-200">Your current destination</p><h4 className="mt-2 text-2xl font-black text-white sm:text-3xl">{worlds.find(w=>w.id===selectedMapWorld)?.name ?? worlds[0].name}</h4><p className="mt-1 text-xs text-white/75">Explore the realm, master its maths and challenge its guardian.</p><div className="mt-4 flex gap-2">{worlds.map((w,i) => <button key={w.id} disabled={!(save.unlocked.includes(w.id) || i === 0)} onClick={() => setSelectedMapWorld(w.id)} aria-label={`Select ${w.name}`} className={`h-2.5 rounded-full transition-all ${(selectedMapWorld === w.id) ? "w-9 bg-cyan-300" : "w-2.5 bg-white/55"} disabled:opacity-30`} />)}</div></div><div className="absolute bottom-4 right-4 rounded-full border border-white/20 bg-slate-950/55 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur">{worlds.filter((w,i)=>save.unlocked.includes(w.id)||i===0).length} of 4 realms open</div></div>
            <div className="mb-4 overflow-hidden rounded-2xl border border-cyan-200/20 bg-gradient-to-r from-[#163c57] via-[#17344e] to-[#25244d] p-4 shadow-lg shadow-cyan-950/20">
              <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200">Your selected destination</p><p className="mt-1 text-lg font-black">{worlds.find(w => w.id === selectedMapWorld)?.name ?? worlds[0].name}</p><p className="mt-1 text-xs text-slate-300">Guardian: {worlds.find(w => w.id === selectedMapWorld)?.enemy ?? worlds[0].enemy} · Reward: {worlds.find(w => w.id === selectedMapWorld)?.reward ?? worlds[0].reward} coins</p></div><button disabled={!save.unlocked.includes(selectedMapWorld) && selectedMapWorld !== worlds[0].id} onClick={() => beginBattle(selectedMapWorld)} className="rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-3 text-xs font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400">Enter this realm <ArrowRight className="ml-1 inline h-4 w-4"/></button></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {worlds.map((w, i) => {
                const unlocked = save.unlocked.includes(w.id) || i === 0;
                const active = selectedMapWorld === w.id;
                const art = ["🏡","🌲","💎","🏰"][i];
                const skies = ["from-emerald-300/25 via-teal-500/10 to-[#173a4b]","from-sky-300/25 via-blue-500/10 to-[#142b4b]","from-violet-300/25 via-fuchsia-500/10 to-[#282047]","from-amber-300/25 via-orange-500/10 to-[#39263b]"][i];
                return <article key={w.id} onClick={() => unlocked && setSelectedMapWorld(w.id)} className={`group relative isolate cursor-pointer overflow-hidden rounded-[22px] border transition duration-300 ${active ? "border-cyan-300/70 ring-2 ring-cyan-300/20 shadow-xl shadow-cyan-950/30" : unlocked ? "border-white/10 hover:-translate-y-1 hover:border-white/25" : "border-white/5 opacity-65"} bg-[#101f35]`}>
                  <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${skies} sm:h-56`}>
                    <img src={`/mathquest/worlds/${w.id}.svg`} alt={`${w.name} landscape`} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101f35]/90 via-[#101f35]/10 to-slate-950/5"/>
                    <div className="absolute -right-6 -top-12 h-40 w-40 rounded-full border-[18px] border-white/[.05]"/>
                    <div className="absolute right-4 bottom-3 rounded-full border border-white/20 bg-slate-950/55 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur">{unlocked?"Realm open":"Sealed realm"}</div>
                  </div>
                  <div className="relative p-5">
                    <div className="flex items-start justify-between gap-3"><div><span className="text-[9px] font-black uppercase tracking-[.18em]" style={{color:w.color}}>Realm {i+1} · Grades {w.grade}</span><h4 className="mt-1 text-lg font-black text-white">{w.name}</h4><p className="text-[11px] text-slate-400">{w.subtitle}</p></div><div className="rounded-xl p-2.5" style={{backgroundColor:`${w.color}20`,color:w.color}}>{unlocked?<Swords className="h-5 w-5"/>:<LockKeyhole className="h-5 w-5"/>}</div></div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{w.topic}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3"><span className="text-[10px] font-bold text-amber-200"><Coins className="mr-1 inline h-3.5 w-3.5"/>{w.reward} coin reward</span><span className={`text-[10px] font-black ${unlocked?"text-cyan-200":"text-slate-500"}`}>{unlocked?"SELECT REALM →":"COMPLETE PREVIOUS REALMS"}</span></div>
                  </div>
                </article>;
              })}
            </div>
          </section>}
          {screen === "battle" && <section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><button onClick={() => setScreen("map")} className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4"/>World map</button><span className="rounded-full bg-rose-400/10 px-3 py-1.5 text-xs font-black text-rose-200">Boss battle · Round {questionIndex+1}/8 · Phase {bossPhase}/3</span></div><BattleScene heroStyle={heroStyle} enemyName={world.enemy} hit={lastHit} bossPhase={bossPhase} enemyAttack={enemyAttack} worldId={world.id}/><div className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><img src={`/mathquest/guardians/${world.id === "number-village" ? "number" : world.id === "fraction-forest" ? "fraction" : world.id === "geometry-isles" ? "geometry" : "algebra"}-guardian.png`} alt={`${world.enemy} guardian`} className="h-14 w-14 object-contain drop-shadow-lg"/><p className="text-xs font-black uppercase tracking-wider text-rose-200">Guardian phase {bossPhase} · {bossPhaseName}</p></div><span className="text-[10px] font-bold text-rose-100">{bossPhase === 3 ? "ENRAGED" : bossPhase === 2 ? "POWERING UP" : "WATCHFUL"}</span></div><p className="mt-1 text-[11px] text-slate-300">{bossPhaseHint} {bossPhase === 2 ? "Wrong answers cost 16 HP." : bossPhase === 3 ? "Wrong answers cost 20 HP." : "Wrong answers cost 12 HP."}</p></div><div className="mt-3 rounded-xl border border-violet-300/20 bg-violet-300/[.06] p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0 flex-1"><p className="text-xs font-black text-violet-200">{heroStyle === "knight" ? "Guardian Shield" : heroStyle === "ranger" ? "Precision Shot" : "Arcane Blast"} · Special ability</p><p className="mt-1 text-[11px] leading-5 text-slate-300">{abilityMessage}</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-violet-300 transition-all" style={{width:`${abilityCharge}%`}}/></div><p className="mt-1 text-[10px] font-bold text-violet-200">{abilityCharge}% charged</p></div><button onClick={activateAbility} disabled={abilityCharge < 100 || abilityArmed || !!selected} className="rounded-xl bg-violet-300 px-4 py-3 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">{abilityArmed ? "Ability ready" : abilityCharge >= 100 ? "Activate ability" : "Charging…"}</button></div></div><div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="mb-2 flex justify-between text-xs font-bold"><span>{name || "Your hero"}</span><span>{battleHp} HP</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{width:`${battleHp}%`}}/></div></div><div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="mb-2 flex justify-between text-xs font-bold"><span>{world.enemy}</span><span>{enemyHp} HP</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-rose-400 transition-all" style={{width:`${enemyHp}%`}}/></div></div></div><div className="mt-4 rounded-2xl border border-white/10 bg-[#172a43] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-widest text-cyan-200">{question.topic} · adaptive challenge</span><span className="text-xs font-bold text-amber-200"><Flame className="mr-1 inline h-4 w-4"/>{streak} streak</span></div><h4 className="mt-3 text-lg font-black leading-relaxed sm:text-xl">{question.prompt}</h4><div className="mt-4 grid gap-2 sm:grid-cols-2">{question.options.map((option,i)=><button key={option} disabled={!!selected} onClick={()=>choose(option)} className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${selected ? option===question.answer ? "border-emerald-400 bg-emerald-400/10 text-emerald-100" : option===selected ? "border-rose-400 bg-rose-400/10 text-rose-100" : "border-white/5 bg-white/[.02] text-slate-500" : "border-white/10 bg-white/5 text-slate-100 hover:border-cyan-300 hover:bg-cyan-300/10"}`}><span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs">{String.fromCharCode(65+i)}</span>{option}</button>)}</div>{hintLevel > 0 && <div className="mt-3 rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100"><p className="mb-1 text-[10px] font-black uppercase tracking-wider text-amber-200">Hint {hintLevel} of 2</p><Lightbulb className="mr-2 inline h-4 w-4"/>{hintLevel === 1 ? question.hint : secondStepHint(question.topic)}</div>}{selected && <div className={`mt-3 rounded-xl p-3 text-sm ${selected===question.answer?"bg-emerald-400/10 text-emerald-100":"bg-amber-300/10 text-amber-100"}`}><p className="font-black">{selected===question.answer?"Direct hit! Correct answer.":"Good effort. Every attempt helps you learn."}</p><p className="mt-1 leading-6">{question.explanation}</p><p className="mt-2 border-t border-white/10 pt-2 text-xs leading-5">{coachMessage}</p></div>}<div className="mt-4 flex flex-wrap items-center justify-between gap-2"><button disabled={!!selected||hintLevel>=2} onClick={()=>{setHintLevel(v=>v+1);setHint(true);}} className="rounded-xl border border-amber-200/20 px-3 py-2 text-xs font-bold text-amber-100 disabled:opacity-40"><Lightbulb className="mr-1 inline h-4 w-4"/>{hintLevel===0?"Need a hint?":"Show another hint"}</button><button disabled={!selected} onClick={advance} className="rounded-xl bg-cyan-300 px-5 py-3 text-xs font-black text-slate-950 disabled:opacity-40">{enemyHp<=0||battleHp<=0||questionIndex>=7?"Finish battle":"Next challenge"}<ArrowRight className="ml-2 inline h-4 w-4"/></button></div></div><p className="mt-3 text-center text-xs text-slate-400">{adaptiveMessage}</p></section>}
          {screen === "summary" && <section className="py-8 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-300/10 text-amber-200">{won?<Trophy className="h-10 w-10"/>:<Shield className="h-10 w-10"/>}</div><p className="mt-5 text-xs font-black uppercase tracking-widest text-cyan-200">{won?"Guardian defeated":"Battle complete"}</p><h3 className="mt-2 text-3xl font-black">{won?"The realm is restored!":"Every hero grows stronger."}</h3><p className="mt-2 text-slate-300">You answered {score} challenges correctly.</p><div className="mx-auto mt-5 max-w-xl rounded-2xl border border-cyan-200/15 bg-cyan-300/[.06] p-4 text-left"><p className="text-xs font-black uppercase tracking-widest text-cyan-200">Your learning recap</p><p className="mt-1 text-xs leading-5 text-slate-300">Here is how you did in the topics covered in this battle. A small number of questions is only an early signal, not a final measure of mastery.</p><div className="mt-3 space-y-3">{Object.entries(battleTopicStats).map(([topic,stat])=>{const pct=Math.round(stat.right/Math.max(1,stat.total)*100);return <div key={topic}><div className="flex justify-between gap-3 text-xs"><span className="font-bold text-slate-200">{topic}</span><span className="text-cyan-200">{stat.right}/{stat.total} correct</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-cyan-300" style={{width:`${pct}%`}}/></div><p className="mt-1 text-[10px] text-slate-400">{pct>=80?"Keep extending this skill with a harder challenge.":pct>=50?"Practise a few more examples to build confidence.":"Recommended next step: revisit the worked examples and try a guided practice question."}</p></div>;})}</div><p className="mt-3 rounded-lg bg-white/5 p-3 text-xs leading-5 text-slate-300"><strong className="text-amber-200">Coach&apos;s next step:</strong> {Object.entries(battleTopicStats).length ? `Spend a little extra practice time on ${Object.entries(battleTopicStats).sort((a,b)=>(a[1].right/Math.max(1,a[1].total))-(b[1].right/Math.max(1,b[1].total)))[0][0]}.` : "Play another battle to build your learning profile."}</p></div><p className="mt-4 text-lg font-black text-amber-200">+{Math.max(10,score*18+(won?60:15)+Math.max(0,streak*4))} XP · +{Math.max(5,score*5+(won?world.reward:8))} coins</p><div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={()=>beginBattle(worldId)} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950">Battle again</button><button onClick={()=>setScreen("map")} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold">Adventure map</button></div></section>}
        </main>
        <aside className="border-t border-white/10 bg-[#0c192c] p-4 sm:p-5 lg:border-l lg:border-t-0"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black" style={{backgroundColor:`${avatarColors[avatar]}22`,color:avatarColors[avatar]}}>{(name||"M").slice(0,1).toUpperCase()}</div><div><p className="font-black">{name||"Math Hero"}</p><p className="text-xs text-slate-400">Grade {grade} · Level {Math.floor(save.xp/100)+1}</p></div></div><div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-xl bg-white/5 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Battles won</p><p className="mt-1 text-xl font-black">{save.wins}</p></div><div className="rounded-xl bg-white/5 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Accuracy</p><p className="mt-1 text-xl font-black">{accuracy}%</p></div><div className="rounded-xl bg-white/5 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Questions</p><p className="mt-1 text-xl font-black">{save.answered}</p></div><div className="rounded-xl bg-white/5 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Best streak</p><p className="mt-1 text-xl font-black">{save.bestStreak}</p></div></div><div className="mt-5"><div className="mb-2 flex items-center justify-between"><p className="text-xs font-black uppercase tracking-widest text-cyan-200">Skill tracker</p><BookOpen className="h-4 w-4 text-cyan-200"/></div>{mastery.length===0?<p className="rounded-xl bg-white/5 p-3 text-xs leading-5 text-slate-400">Your topic mastery will appear here as you play battles.</p>:<div className="space-y-3">{mastery.slice(0,5).map(item=><div key={item.topic}><div className="mb-1 flex justify-between gap-2 text-[10px] font-bold"><span className="truncate text-slate-300">{item.topic}</span><span className="text-cyan-200">{item.percent}% · {item.total} tries</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-cyan-300" style={{width:`${item.percent}%`}}/></div></div>)}</div>}</div><div className="mt-5 rounded-xl border border-white/10 bg-white/[.03] p-3"><p className="text-xs font-black text-amber-100"><GraduationCap className="mr-1 inline h-4 w-4"/>Adaptive learning</p><p className="mt-1 text-[11px] leading-5 text-slate-400">The game gives extra practice to topics where your results suggest you need support, while still exploring topics you have not tried. Difficulty changes only after several attempts.</p></div><button onClick={()=>setScreen("profile")} className="mt-4 w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5">Edit avatar & grade</button></aside>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#0b1728] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500"><span>Justdy Lab · Learn by playing</span><span>Grade 1–8 · Maths-powered battles</span></footer>
    </div>
  </div>;
}
