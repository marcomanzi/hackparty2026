"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";


export function ChatInterface({ ticketIdProp }: { ticketIdProp?: number }) {
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: messages, isLoading: isLoadingMessages } = api.ticket.getMessages.useQuery(
    { ticketId: ticketIdProp! },
    { 
      enabled: !!ticketIdProp,
      refetchInterval: 5000,
    }
  );

  const createTicket = api.ticket.create.useMutation({
    onSuccess: (data) => {
      if (data?.id) {
        localStorage.setItem("hackparty_ticket_id", data.id.toString());
        // Force immediate navigation
        window.location.href = `/tickets/${data.id}`;
      }
    },
    onError: (err) => {
      setErrorMessage(err.message || "Failed to initiate connection. Please try again.");
    }
  });

  const addMessage = api.ticket.addMessage.useMutation({
    onSuccess: () => {
      setContent("");
      setErrorMessage(null);
    },
    onError: (err) => {
      setErrorMessage(err.message || "Failed to transmit signal.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!ticketIdProp) {
      createTicket.mutate({ content });
    } else {
      addMessage.mutate({
        ticketId: ticketIdProp,
        content,
        senderType: "customer",
      });
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isPending = createTicket.isPending || addMessage.isPending;

  if (!ticketIdProp) {
    // Initial state: Landing Page View
    return (
        <div className="w-full space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group relative">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Initiate communication protocol..."
                  className="min-h-[120px] bg-muted/20 border-border/40 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all duration-500 resize-none text-xl lg:text-3xl font-bold p-8 rounded-[2rem] placeholder:text-muted-foreground/20 leading-tight tracking-tighter"
                  required
                />
                <div className="absolute bottom-6 right-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground/20 pointer-events-none group-focus-within:text-primary/40 transition-colors">
                  SECURE CHANNEL ENABLED
                </div>
              </div>

              {errorMessage && (
                <div className="text-destructive text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in duration-300">
                   {errorMessage}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={createTicket.isPending}
                className="w-full h-20 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 hover:shadow-primary/40 active:scale-[0.99] transition-all bg-primary"
              >
                {createTicket.isPending ? <Loader2 className="animate-spin" /> : "Establish Connection"}
              </Button>
            </form>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] lg:h-[700px] border border-border/20 bg-muted/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-sm">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 scroll-smooth custom-scrollbar"
      >
        {isLoadingMessages && !messages ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-primary/20" size={32} />
          </div>
        ) : (
          messages?.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex w-full group animate-in fade-in slide-in-from-bottom-2 duration-300",
                msg.senderType === "customer" ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[85%] flex flex-col",
                msg.senderType === "customer" ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-5 py-4 rounded-[1.5rem] text-sm font-medium shadow-sm transition-all duration-300",
                  msg.senderType === "customer" 
                    ? "bg-primary text-primary-foreground rounded-br-none" 
                    : "bg-muted text-foreground rounded-bl-none border border-border/50"
                )}>
                  {msg.content}
                </div>
                <div className="flex items-center gap-2 mt-2 px-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
                        {msg.senderType === "customer" ? "Secure Sender" : "Support Protocol"}
                    </span>
                </div>
              </div>
            </div>
          ))
        )}
        {(createTicket.isPending || addMessage.isPending) && (
             <div className="flex w-full justify-end animate-in fade-in duration-300">
                <div className="bg-primary/10 text-primary px-4 py-3 rounded-2xl rounded-br-none flex items-center gap-2">
                    <Loader2 className="animate-spin" size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Transmitting...</span>
                </div>
             </div>
        )}
      </div>

      <div className="p-6 lg:p-10 border-t bg-background/30 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative flex gap-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your response..."
            className="min-h-[64px] h-[64px] flex-1 bg-muted/40 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-2xl py-5 px-6 text-base resize-none pr-16 transition-all duration-300"
            onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                }
            }}
          />
          <Button 
            type="submit" 
            disabled={isPending || !content.trim()}
            size="icon"
            className="absolute right-3 top-3 size-10 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform"
          >
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  );
}
