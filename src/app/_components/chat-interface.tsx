"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";


export function ChatInterface({ ticketIdProp }: { ticketIdProp?: number }) {
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"]
        .find(t => MediaRecorder.isTypeSupported(t)) ?? "";
        
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await handleTranscribe(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage("Microphone access denied or error occurred.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribe = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    const API_URL = "https://d7dc-93-43-95-133.ngrok-free.app/transcribe";
    
    const ext = audioBlob.type.includes("webm") ? ".webm" : 
                audioBlob.type.includes("ogg") ? ".ogg" : 
                audioBlob.type.includes("mp4") ? ".m4a" : ".audio";

    const form = new FormData();
    form.append("audio", audioBlob, `recording${ext}`);

    try {
      const res = await fetch(API_URL, { method: "POST", body: form });
      if (!res.ok) throw new Error("Transcription failed");
      
      const data = await res.json() as { text: string };
      if (data.text) {
        setContent(data.text);
      } else {
        setErrorMessage("No speech detected in recording.");
      }
    } catch (err) {
      setErrorMessage("Failed to transcribe audio.");
      console.error(err);
    } finally {
      setIsTranscribing(false);
    }
  };

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
                  placeholder={isTranscribing ? "Transcribing voice signal..." : "Initiate communication protocol..."}
                  className={cn(
                    "min-h-[120px] bg-muted/20 border-border/40 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all duration-500 resize-none text-xl lg:text-3xl font-bold p-8 rounded-[2rem] placeholder:text-muted-foreground/20 leading-tight tracking-tighter",
                    isTranscribing && "animate-pulse italic opacity-50"
                  )}
                  disabled={isTranscribing}
                  required
                />
                
                <div className="absolute top-6 right-8 flex flex-col gap-4">
                  <Button 
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "size-14 rounded-2xl transition-all duration-500",
                      isRecording ? "bg-red-500 text-white animate-pulse shadow-xl shadow-red-500/20" : "hover:bg-primary/10 text-primary"
                    )}
                  >
                    {isRecording ? <Square size={20} /> : <Mic size={24} />}
                  </Button>
                </div>

                <div className="absolute bottom-6 left-8 flex items-center gap-3">
                  {isRecording ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                       <div className="size-2 rounded-full bg-red-500 animate-ping" />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Live Feedback Active</span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/20 group-focus-within:text-primary/40 transition-colors">
                      SECURE CHANNEL ENABLED
                    </div>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className="text-destructive text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in duration-300">
                   {errorMessage}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={createTicket.isPending || isTranscribing}
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
        <form onSubmit={handleSubmit} className="relative flex flex-col gap-4">
          <div className="relative flex-1 group">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isTranscribing ? "Transcribing voice signal..." : "Type your response..."}
              className={cn(
                "min-h-[64px] h-[64px] w-full bg-muted/40 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-2xl py-5 px-6 text-base resize-none pr-28 transition-all duration-300",
                isTranscribing && "animate-pulse italic opacity-50"
              )}
              disabled={isTranscribing}
              onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                  }
              }}
            />
            <div className="absolute right-3 top-3 flex items-center gap-2">
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "size-10 rounded-xl transition-all duration-300",
                  isRecording ? "bg-red-500 text-white animate-pulse" : "hover:bg-primary/10 text-muted-foreground"
                )}
              >
                {isRecording ? <Square size={16} /> : <Mic size={18} />}
              </Button>
              <Button 
                type="submit" 
                disabled={isPending || !content.trim() || isTranscribing}
                size="icon"
                className="size-10 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
          
          {isRecording && (
            <div className="flex items-center gap-2 px-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="size-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Recording Active</span>
            </div>
          )}

          {errorMessage && (
            <div className="text-destructive text-[10px] font-black uppercase tracking-widest px-4">
               {errorMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
