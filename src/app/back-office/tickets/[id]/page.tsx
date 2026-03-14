"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft,
  Languages,
  Loader2,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const languages = [
  { name: "German", code: "de" },
  { name: "Italian", code: "it" },
  { name: "Spanish", code: "es" },
  { name: "French", code: "fr" },
  { name: "English", code: "en" },
  { name: "Portuguese", code: "pt" },
  { name: "Dutch", code: "nl" },
  { name: "Chinese", code: "zh" },
  { name: "Japanese", code: "ja" },
  { name: "Hindi", code: "hi" },
  { name: "Arabic", code: "ar" },
  { name: "Russian", code: "ru" },
  { name: "Korean", code: "ko" },
];

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [translationResult, setTranslationResult] = useState<string | null>(null);

  const { data: ticket, isLoading } = api.ticket.getById.useQuery({ id }, { refetchInterval: 5000 });
  const translate = api.ticket.translate.useMutation({
    onSuccess: (data) => {
      setTranslationResult(data.translatedText);
    }
  });

  const deleteTicket = api.ticket.delete.useMutation({
    onSuccess: () => {
      router.push("/back-office");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-20 text-center">
        <p className="text-xl font-bold">Signal not found</p>
        <Link href="/back-office">
          <Button variant="ghost" className="mt-4">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-50/50 -m-8 animate-in fade-in duration-700">
      {/* Sticky Header */}
      <header className="shrink-0 bg-white border-b border-slate-100 px-8 py-6 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/back-office">
            <Button variant="ghost" size="icon" className="size-10 rounded-full hover:bg-slate-50 text-slate-400">
              <ChevronLeft size={20} />
            </Button>
          </Link>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold tracking-tight text-slate-900">Signal #{ticket.id}</span>
              <Badge variant="outline" className={cn("rounded-full font-black text-[9px] tracking-widest h-6 px-3 border-none", getPriorityColor(ticket.priorityLevel))}>
                {ticket.priorityLevel.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {ticket.categories.map((cat, idx) => (
                <span key={idx} className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  {cat}{idx < ticket.categories.length - 1 ? " · " : ""}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="outline" size="sm" className="h-10 rounded-xl gap-2 px-4 text-[10px] font-black uppercase tracking-widest border-slate-100 hover:bg-slate-50">
                <Languages size={14} className="text-primary" />
                {selectedLanguage?.name}
              </Button>
            } />
            <DropdownMenuContent align="end" className="rounded-xl w-48 p-2 glass border-slate-100 shadow-xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-400">AI Translation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {languages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code}
                    className="rounded-lg px-2 py-2 text-[11px] font-bold"
                    onClick={() => setSelectedLanguage(lang)}
                  >
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            className="size-10 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            onClick={() => {
              if (confirm("Purge this signal and all transmissions?")) {
                deleteTicket.mutate({ id: ticket.id });
              }
            }}
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </header>

      {/* Conversation Area */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Initial Subject Message */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mb-12 animate-in slide-in-from-top-4 duration-500">
               <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-4">Initial Transmission</div>
               <h2 className="text-3xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                 {ticket.content}
               </h2>
               
               {translationResult && (
                  <div className="mt-8 pt-8 border-t border-slate-50 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 mb-3">
                       <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-primary">{selectedLanguage?.name} Analysis</span>
                    </div>
                    <p className="text-lg font-medium italic text-slate-600 leading-relaxed">
                      &quot;{translationResult}&quot;
                    </p>
                  </div>
               )}

               <div className="mt-8 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary"
                    onClick={() => {
                      if (selectedLanguage) {
                        translate.mutate({ message: ticket.content, outputLanguage: selectedLanguage.code });
                      }
                    }}
                    disabled={translate.isPending}
                  >
                    {translate.isPending ? <Loader2 className="animate-spin mr-2" size={10} /> : <Languages size={12} className="mr-2" />}
                    Translate Signal
                  </Button>
               </div>
            </div>

            <ChatHistory ticketId={ticket.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatHistory({ ticketId }: { ticketId: number }) {
  const [reply, setReply] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: messages, isLoading } = api.ticket.getMessages.useQuery(
    { ticketId },
    { refetchInterval: 5000 }
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = api.ticket.addMessage.useMutation({
    onSuccess: () => {
      setReply("");
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    addMessage.mutate({
      ticketId,
      content: reply,
      senderType: "staff",
    });
  };

  if (isLoading && !messages) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-slate-200" size={40} />
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        {messages?.map((msg) => (
          <div key={msg.id} className={cn(
            "flex flex-col group animate-in slide-in-from-bottom-2 duration-500",
            msg.senderType === "staff" ? "items-end" : "items-start"
          )}>
            <div className={cn(
              "px-6 py-4 rounded-[1.5rem] text-sm lg:text-base font-medium max-w-[80%] shadow-sm transition-all duration-300",
              msg.senderType === "staff" 
                ? "bg-slate-900 text-white rounded-tr-none shadow-black/10" 
                : "bg-white text-slate-900 rounded-tl-none border border-slate-100 shadow-slate-100/50"
            )}>
              {msg.content}
            </div>
            <div className="flex items-center gap-3 mt-2 px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                {msg.senderType === "staff" 
                  ? (msg.senderId === "system-ai" ? "ACME AI Response" : "Agency Protocol") 
                  : "Authorized Signal"}
              </span>
              <span className="text-[8px] font-bold text-slate-200 uppercase">
                 {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 pt-8 pb-12 bg-gradient-to-t from-slate-50/50 via-slate-50/50 to-transparent">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
          <Input 
            value={reply}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReply(e.target.value)}
            placeholder="Broadcast encrypted response..."
            className="h-16 bg-white border-slate-100 rounded-2xl pr-32 text-sm font-medium shadow-xl shadow-black/[0.02] focus-visible:ring-primary/20 transition-all border-slate-200"
          />
          <Button 
            type="submit" 
            disabled={addMessage.isPending || !reply.trim()}
            className="absolute right-2 top-2 h-12 rounded-xl px-6 text-[10px] font-black uppercase tracking-[0.2em] bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all"
          >
            {addMessage.isPending ? <Loader2 className="animate-spin" size={14} /> : "Transmit"}
          </Button>
        </form>
      </div>
    </div>
  );
}
