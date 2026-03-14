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
        localStorage.setItem("acme_secure_session_id", data.id.toString());
        // Force immediate navigation
        window.location.href = `/tickets/${data.id}`;
      }
    },
    onError: (err) => {
      setErrorMessage(err.message || "Protocol activation failure. System retry recommended.");
    }
  });

  const addMessage = api.ticket.addMessage.useMutation({
    onSuccess: () => {
      setContent("");
      setErrorMessage(null);
    },
    onError: (err) => {
      setErrorMessage(err.message || "Uplink synchronization failed.");
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
        <div className="w-full space-y-8">
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="group relative">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={isTranscribing ? "Processing neural input..." : "How can ACME assist you today?"}
                  className={cn(
                    "min-h-[160px] bg-slate-50 border-slate-100 focus-visible:ring-0 focus-visible:border-primary/20 transition-all duration-700 resize-none text-2xl lg:text-4xl font-light p-10 rounded-[3rem] placeholder:text-slate-300 leading-[1.1] tracking-tight shadow-xl",
                    isTranscribing && "animate-pulse italic opacity-40"
                  )}
                  disabled={isTranscribing}
                  required
                />
                
                <div className="absolute top-10 right-10 flex flex-col gap-4">
                  <Button 
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "size-16 rounded-[1.5rem] transition-all duration-700 border border-slate-100 shadow-xl",
                      isRecording ? "bg-red-500 text-white animate-pulse shadow-red-500/20 border-red-400/50" : "bg-white hover:bg-slate-50 text-slate-400 hover:text-primary hover:border-slate-200"
                    )}
                  >
                    {isRecording ? <Square size={24} /> : <Mic size={28} />}
                  </Button>
                </div>

                <div className="absolute bottom-10 left-10 flex items-center gap-4">
                  {isRecording ? (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                       <div className="size-2 rounded-full bg-red-500 animate-ping" />
                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-red-500">Live Neural Uplink</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-slate-200 group-focus-within:text-slate-400 transition-all duration-500">
                      <div className="h-px w-8 bg-current" />
                      <span className="text-[11px] font-black uppercase tracking-[0.4em]">Secure Session ACME_0X</span>
                    </div>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className="text-red-400 text-[11px] font-bold uppercase tracking-[0.2em] text-center animate-in fade-in zoom-in-95 duration-500 bg-red-500/5 py-3 rounded-2xl border border-red-500/10 max-w-md mx-auto">
                   {errorMessage}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={createTicket.isPending || isTranscribing}
                className="w-full h-24 rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_20px_50px_rgba(var(--primary-rgb),0.5)] active:scale-[0.98] transition-all duration-500 bg-primary group overflow-hidden relative"
              >
                <span className="relative z-10">
                  {createTicket.isPending ? <Loader2 className="animate-spin size-6" /> : "Initiate Secure Transmission"}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              </Button>
            </form>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[700px] lg:h-[800px] border border-slate-100 bg-white rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.08)] animate-in zoom-in-95 duration-1000 ease-out">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-10 lg:p-14 space-y-10 scroll-smooth custom-scrollbar"
      >
        {isLoadingMessages && !messages ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-slate-200" size={40} />
          </div>
        ) : (
          messages?.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex w-full group animate-in fade-in slide-in-from-bottom-4 duration-500",
                msg.senderType === "customer" ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[80%] flex flex-col",
                msg.senderType === "customer" ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-7 py-5 rounded-[2rem] text-sm lg:text-base font-medium transition-all duration-500",
                  msg.senderType === "customer" 
                    ? "bg-primary text-primary-foreground rounded-br-none shadow-lg shadow-primary/20" 
                    : "bg-slate-50 text-slate-900 rounded-bl-none border border-slate-100 shadow-sm"
                )}>
                  {msg.content}
                </div>
                <div className="flex items-center gap-3 mt-3 px-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                        {msg.senderType === "customer" ? "Authorized Session" : "ACME Senior Console"}
                    </span>
                    <span className="text-[8px] text-slate-200 font-mono italic">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
              </div>
            </div>
          ))
        )}
        {(createTicket.isPending || addMessage.isPending) && (
             <div className="flex w-full justify-end animate-in fade-in duration-500 translate-y-2">
                <div className="bg-slate-50 text-slate-400 px-6 py-4 rounded-[1.5rem] rounded-br-none border border-slate-100 flex items-center gap-3 shadow-sm">
                    <Loader2 className="animate-spin size-4" />
                    <span className="text-[11px] font-black uppercase tracking-[0.4em]">Synchronizing...</span>
                </div>
             </div>
        )}
      </div>

      <div className="p-10 lg:p-14 border-t border-slate-100 bg-slate-50/50">
        <form onSubmit={handleSubmit} className="relative flex flex-col gap-6">
          <div className="relative flex-1 group">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isTranscribing ? "Decrypting audio signal..." : "Message ACME Support..."}
              className={cn(
                "min-h-[80px] h-[80px] w-full bg-white border-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/30 rounded-3xl py-6 px-8 text-base font-light resize-none pr-32 transition-all duration-500 shadow-sm",
                isTranscribing && "animate-pulse italic opacity-30"
              )}
              disabled={isTranscribing}
              onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                  }
              }}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "size-12 rounded-2xl transition-all duration-500 border border-transparent",
                  isRecording ? "bg-red-500 text-white animate-pulse shadow-xl shadow-red-500/20 border-red-400/50" : "hover:bg-slate-100 text-slate-400 hover:text-primary hover:border-slate-200"
                )}
              >
                {isRecording ? <Square size={18} /> : <Mic size={20} />}
              </Button>
              <Button 
                type="submit" 
                disabled={isPending || !content.trim() || isTranscribing}
                size="icon"
                className="size-12 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all duration-300 bg-primary"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
          
          {isRecording && (
            <div className="flex items-center gap-3 px-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="size-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-red-500/80">Recording In Progress</span>
            </div>
          )}

          {errorMessage && (
            <div className="text-red-400 text-[11px] font-bold uppercase tracking-[0.2em] px-6 animate-in fade-in duration-500">
               {errorMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
