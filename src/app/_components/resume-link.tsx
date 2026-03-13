"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function ResumeLink() {
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    setSavedId(localStorage.getItem("hackparty_ticket_id"));
  }, []);

  if (!savedId) return null;

  return (
    <div className="mt-8 text-center animate-in fade-in duration-1000 delay-500">
      <Link 
        href={`/tickets/${savedId}`}
        className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-all flex items-center justify-center gap-2"
      >
        <span className="size-1 rounded-full bg-primary/40" />
        Resume Existing Transmission
        <span className="size-1 rounded-full bg-primary/40" />
      </Link>
    </div>
  );
}
