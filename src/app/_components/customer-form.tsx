"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
    <Card className="w-full max-w-xl shadow-lg border-border">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Send us a message</CardTitle>
        <CardDescription>We&apos;ll get back to you as soon as possible.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isSuccess && (
          <div className="p-4 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-center font-medium animate-in fade-in slide-in-from-top-4 duration-500">
            Message sent successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={5}
            placeholder="How can we help you today?"
            className="bg-muted/50 border-input focus:ring-primary transition-all duration-300 resize-none text-lg p-4"
          />

          <Button
            type="submit"
            disabled={createTicket.isPending}
            className="w-full font-bold py-6 text-lg transition-all duration-300"
          >
            {createTicket.isPending ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
