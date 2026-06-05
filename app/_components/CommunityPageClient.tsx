"use client";

import React from "react";
import Image from "next/image";
import {
  Users,
  Tag,
  Calendar,
  MessageCircle,
  BookOpen,
  Star,
  Lock,
} from "lucide-react";

type Community = {
  id: string;
  name: string;
  description: string;
  category: string;
  fileKey: string;
  price: number;
  memberCount: number;
};

export default function CommunityPageClient({
  community,
}: {
  community: Community;
}) {
  const getImageUrl = (fileKey: string) => {
    if (!fileKey) {
      return "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop";
    }
    return fileKey.startsWith("http")
      ? fileKey
      : `https://utfs.io/f/${fileKey}`;
  };

  const formatPrice = (price: number) => {
    if (!price) return "Free";
    return `$${price}/month`;
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      {/* HERO */}
      <div className="relative h-64 w-full overflow-hidden">
        <Image
          src={getImageUrl(community.fileKey)}
          alt={community.name}
          fill
          className="object-cover"
        />

        <div className="absolute inset-0 bg-linear-to-t from-[#0b0f19] via-black/50 to-black/20" />

        <div className="absolute bottom-6 left-6">
          <h1 className="text-3xl font-bold">{community.name}</h1>
          <p className="text-white/70 mt-1 max-w-xl">{community.description}</p>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 py-8">
        {/* LEFT */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-300">
              <Tag className="w-4 h-4" />
              <span className="text-sm">{community.category}</span>
            </div>

            <div className="mt-4 flex items-center gap-2 text-white/70 text-sm">
              <Users className="w-4 h-4" />
              {community.memberCount.toLocaleString()} members
            </div>

            <div className="mt-2 text-emerald-300 font-semibold">
              {formatPrice(community.price)}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
            <SidebarItem icon={<MessageCircle />} label="Feed" />
            <SidebarItem icon={<BookOpen />} label="Classroom" />
            <SidebarItem icon={<Calendar />} label="Events" />
            <SidebarItem icon={<Star />} label="Leaderboard" />
            <SidebarItem icon={<Users />} label="Members" />
          </div>

          <div className="bg-emerald-500/10 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-300" />
              <span className="text-sm">Premium Access</span>
            </div>

            <button className="w-full mt-4 bg-emerald-500 text-black py-2 rounded-lg">
              Join Community
            </button>
          </div>
        </aside>

        {/* CENTER */}
        <main className="lg:col-span-6 space-y-4">
          <PostBox />
          <PostCard title="Welcome" text="Start your journey here." />
        </main>

        {/* RIGHT */}
        <aside className="lg:col-span-3 space-y-4">
          <InfoBox />
          <Leaderboard />
        </aside>
      </div>
    </div>
  );
}

/* ---------------- UI COMPONENTS ---------------- */

function SidebarItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/70 hover:text-white p-2 rounded hover:bg-white/10 cursor-pointer">
      {icon}
      {label}
    </div>
  );
}

function PostBox() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <textarea
        className="w-full bg-transparent outline-none h-20 text-sm"
        placeholder="Share something..."
      />
      <button className="mt-2 bg-white text-black px-4 py-1 rounded">
        Post
      </button>
    </div>
  );
}

function PostCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-white/70 text-sm mt-2">{text}</p>
    </div>
  );
}

function InfoBox() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="font-semibold">About</h3>
      <p className="text-sm text-white/70 mt-2">
        Learn and build inside this community.
      </p>
    </div>
  );
}

function Leaderboard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="font-semibold">Top Members</h3>
      <p className="text-sm text-white/70 mt-2">🔥 Alex</p>
      <p className="text-sm text-white/70">🔥 Sarah</p>
    </div>
  );
}
