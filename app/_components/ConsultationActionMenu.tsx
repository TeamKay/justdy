"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  MoreVertical,
  Eye,
  ArrowUpRight,
  X,
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  MessageSquare,
  Sparkles,
} from "lucide-react";

interface Educator {
  id: string;
  name: string;
  email: string;
}

interface ConsultationItem {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  gradeLevel: string;
  subject: string;
  topic?: string | null;
  status: string;
  sessionDate: Date | string;
  startTime: Date | string;
  educator?: Educator | null;
}

export function ConsultationActionMenu({ item }: { item: ConsultationItem }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formattedDate = new Date(item.sessionDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = new Date(item.startTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        aria-label="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Action Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 z-30 mt-1 w-44 origin-top-right rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg ring-1 ring-black/5 focus:outline-none py-1 divide-y divide-slate-100 dark:divide-slate-700/60">
          <div className="py-1">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsModalOpen(true);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              View Details
            </button>
          </div>

          <div className="py-1">
            <Link
              href={`/manage/clients/convert?email=${encodeURIComponent(item.email)}`}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors font-medium"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Convert Client
            </Link>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transition-all transform animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Consultation Details
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300 max-h-[75vh] overflow-y-auto">
              {/* Lead Info */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Client Information
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <a
                      href={`mailto:${item.email}`}
                      className="hover:underline text-indigo-600 dark:text-indigo-400 truncate"
                    >
                      {item.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {item.phoneNumber ? (
                      <a
                        href={`tel:${item.phoneNumber}`}
                        className="hover:underline"
                      >
                        {item.phoneNumber}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">No phone</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>Grade: {item.gradeLevel}</span>
                  </div>
                </div>
              </div>

              {/* Consultation Info */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Session & Subject
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {item.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formattedTime} (15m)</span>
                  </div>
                </div>
              </div>

              {/* Educator Info (if assigned) */}
              {item.educator && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Assigned Educator
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {item.educator.name}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {item.educator.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Goal / Topic Notes */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Client Goals & Topic Notes
                </p>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {item.topic || "No specific goal or topic notes provided."}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Close
              </button>
              <Link
                href={`/manage/clients/convert?email=${encodeURIComponent(item.email)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition-colors"
              >
                Convert to Subscriber <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
