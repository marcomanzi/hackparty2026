"use client";

import { useParams } from "next/navigation";
import { ChatInterface } from "@/app/_components/chat-interface";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicTicketPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data: ticket, isLoading } = api.ticket.getById.useQuery({ id }, { refetchInterval: 5000 });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-20 bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-20 bg-background text-center">
        <h1 className="text-2xl font-black mb-4 tracking-tight">Signal not found</h1>
        <Link href="/">
          <Button variant="ghost" className="font-bold uppercase tracking-widest text-[10px]">Return to Base</Button>
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="p-6 border-b border-border/40 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-black tracking-tighter">
            Hack<span className="text-primary">Party</span>
          </Link>
          <div className="h-4 w-px bg-border mx-2" />
          <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border shadow-sm">
            <span className="text-[10px] font-black text-muted-foreground/50 tracking-widest">SIGNAL</span>
            <span className="text-xs font-mono font-black text-primary">#{ticket.id}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 container max-w-4xl mx-auto py-8 lg:py-12 px-4 space-y-8">
        <div className="space-y-4">
           <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter leading-tight">
             {ticket.content}
           </h1>
           <div className="flex items-center gap-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                INITIATED · {new Date(ticket.createdAt).toLocaleString()}
              </div>
              <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">
                Status: {ticket.status.toUpperCase()}
              </div>
           </div>
        </div>

        <ChatInterface ticketIdProp={ticket.id} />
      </div>
    </main>
  );
}
