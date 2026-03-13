"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
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
import { useState } from "react";
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 p-4 lg:p-0">
      <div className="flex items-center justify-between">
        <Link href="/back-office">
          <Button variant="ghost" size="sm" className="gap-2 rounded-xl h-10 px-4 hover:bg-muted font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
            <ChevronLeft size={14} />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex gap-2">
           <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-xl h-10 px-4 text-destructive hover:bg-destructive/10 font-bold text-[10px] uppercase tracking-widest"
            onClick={() => {
              if (confirm("Are you sure?")) {
                deleteTicket.mutate({ id: ticket.id });
              }
            }}
          >
            <Trash2 size={14} className="mr-2" />
            Purge Signal
          </Button>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Main Content Card */}
        <Card className="rounded-[2.5rem] border-border/40 overflow-hidden shadow-2xl shadow-primary/5">
          <CardHeader className="p-8 lg:p-12 border-b bg-muted/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-xl border shadow-sm">
                <span className="text-[10px] font-black text-muted-foreground/50 tracking-widest">SIGNAL</span>
                <span className="text-xs font-mono font-black text-primary">#{ticket.id}</span>
              </div>
              <Badge variant="outline" className={cn("rounded-xl font-black text-[10px] tracking-widest h-8 px-4 border-none py-0", getPriorityColor(ticket.priorityLevel))}>
                {ticket.priorityLevel.toUpperCase()}
              </Badge>
              <div className="text-[10px] font-black text-muted-foreground/40 ml-auto tracking-widest uppercase">
                {new Date(ticket.createdAt).toLocaleString()}
              </div>
            </div>
            <CardTitle className="text-3xl lg:text-4xl font-bold leading-tight tracking-tighter">
              {ticket.content}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 lg:p-12 space-y-10">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Classification</h3>
              <div className="flex flex-wrap gap-2">
                {ticket.categories.map((cat, idx) => (
                  <span key={idx} className="text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary px-4 py-2 rounded-xl border border-primary/10">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-8 pt-10 border-t">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Transmission History</h3>
              
              <div className="space-y-6">
                <ChatHistory ticketId={ticket.id} />
              </div>
              
              <div className="space-y-6 pt-10 border-t border-dashed">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">AI Translation</h3>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="outline" size="sm" className="h-10 rounded-xl gap-2 px-4 font-bold text-[10px] uppercase tracking-widest border-muted">
                        <Languages size={14} className="text-primary" />
                        {selectedLanguage?.name}
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="rounded-xl w-48 p-2 glass border-primary/10">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="px-2 pb-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Select Language</DropdownMenuLabel>
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
                </div>

                <div className="space-y-4">
                  <Button 
                    className="w-full h-12 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20"
                    onClick={() => {
                      if (selectedLanguage) {
                        translate.mutate({ message: ticket.content, outputLanguage: selectedLanguage.code });
                      }
                    }}
                    disabled={translate.isPending}
                  >
                    {translate.isPending ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      "Execute Translation Analysis"
                    )}
                  </Button>

                  {translationResult && (
                    <div className="p-8 rounded-3xl bg-muted/30 border border-primary/5 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/70">{selectedLanguage?.name} Response</span>
                      </div>
                      <p className="text-xl font-medium leading-relaxed italic text-foreground/90">
                        &quot;{translationResult}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChatHistory({ ticketId }: { ticketId: number }) {
  const [reply, setReply] = useState("");
  const { data: messages, isLoading } = api.ticket.getMessages.useQuery(
    { ticketId },
    { refetchInterval: 5000 }
  );

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

  if (isLoading && !messages) return <Loader2 className="animate-spin text-primary mx-auto" />;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {messages?.map((msg) => (
          <div key={msg.id} className={cn(
            "flex flex-col gap-1",
            msg.senderType === "staff" ? "items-end" : "items-start"
          )}>
            <div className={cn(
              "px-4 py-3 rounded-2xl text-sm max-w-[80%]",
              msg.senderType === "staff" 
                ? "bg-primary text-primary-foreground rounded-tr-none" 
                : "bg-muted text-foreground rounded-tl-none border"
            )}>
              {msg.content}
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 px-1">
              {msg.senderType === "staff" ? "Agency Reply" : "Incoming Signal"} · {new Date(msg.createdAt).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="pt-6 relative">
          <Input 
            value={reply}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReply(e.target.value)}
            placeholder="Broadcast response..."
            className="h-12 bg-muted/20 border-dashed rounded-xl pr-24 text-xs font-bold"
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={addMessage.isPending || !reply.trim()}
            className="absolute right-1.5 top-[calc(1.5rem+6px)] h-9 rounded-lg px-4 text-[9px] font-black uppercase tracking-widest"
          >
            {addMessage.isPending ? "Syncing..." : "Transmit"}
          </Button>
      </form>
    </div>
  );
}
