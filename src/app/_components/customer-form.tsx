"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CustomerForm() {
  const [content, setContent] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const createTicket = api.ticket.create.useMutation({
    onSuccess: () => {
      setContent("");
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket.mutate({ content });
  };

  return (
    <div className="w-full max-w-xl space-y-8">
      {isSuccess && (
        <div className="p-4 bg-white text-black text-center font-bold tracking-widest uppercase animate-in fade-in slide-in-from-top-4 duration-500">
          Message delivered
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={6}
          placeholder="What is the objective?"
          className="rounded-none bg-transparent border-white/10 text-white placeholder:text-white/20 focus:border-white focus:ring-0 transition-all duration-300 resize-none text-xl p-6"
        />

        <Button
          type="submit"
          disabled={createTicket.isPending}
          className="w-full rounded-none bg-white text-black hover:bg-white/90 font-black uppercase tracking-[0.2em] py-8 text-lg transition-all duration-300 disabled:opacity-50"
        >
          {createTicket.isPending ? "Transmitting..." : "Send Message"}
        </Button>
      </form>
    </div>
  );
}
