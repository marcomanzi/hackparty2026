"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function ResumeLink() {
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    setSavedId(localStorage.getItem("acme_secure_session_id") ?? localStorage.getItem("hackparty_ticket_id"));
  }, []);

  if (!savedId) return null;

  return (
    <div className="mt-12 text-center animate-in fade-in duration-1000 delay-700">
      <Link 
        href={`/tickets/${savedId}`}
        className="group inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500"
      >
        <span className="size-1.5 rounded-full bg-slate-200 group-hover:bg-primary group-hover:scale-125 transition-all duration-500" />
        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 group-hover:text-slate-900 transition-colors">
          Resume Secure Session
        </span>
        <span className="size-1.5 rounded-full bg-slate-200 group-hover:bg-primary group-hover:scale-125 transition-all duration-500" />
      </Link>
    </div>
  );
}
