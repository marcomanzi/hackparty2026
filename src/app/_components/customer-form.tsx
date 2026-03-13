"use client";

import { useState } from "react";
import { api } from "@/trpc/react";

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
    <div className="w-full max-w-xl rounded-2xl bg-white/5 p-8 backdrop-blur-lg border border-white/10 shadow-2xl">
      <h2 className="text-3xl font-bold text-white mb-6">Send us a message</h2>
      
      {isSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-4 duration-300">
          Message sent successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={5}
            placeholder="How can we help you?"
            className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)] transition-all hover:bg-white/15 resize-none text-lg"
          />
        </div>

        <button
          type="submit"
          disabled={createTicket.isPending}
          className="w-full rounded-xl bg-gradient-to-r from-[hsl(280,100%,70%)] to-[hsl(250,100%,70%)] px-6 py-4 font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] hover:shadow-purple-500/40 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {createTicket.isPending ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}
