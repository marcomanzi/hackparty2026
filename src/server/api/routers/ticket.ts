import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { tickets } from "@/server/db/schema";

export const ticketRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let classifiedCategories: string[] = [];
      
      try {
        const response = await fetch('https://d7dc-93-43-95-133.ngrok-free.app/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: `TCK-${Date.now()}`,
            ticketSubject: "",
            ticketContent: input.content,
            existingCategories: []
          }),
        });

        if (response.ok) {
          const data = await response.json() as { ticketCategories?: string[] };
          console.log("RESPONSE", data);
          if (Array.isArray(data.ticketCategories)) {
            classifiedCategories = data.ticketCategories;
          }
        } else {
          console.error(`Classification API returned error: ${response.status}`);
        }
      } catch (error) {
        console.error("Classification API connection error:", error);
      }

      await ctx.db.insert(tickets).values({
        content: input.content,
        categories: classifiedCategories.length > 0 ? classifiedCategories : ["General"],
      });
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.tickets.findMany({
      orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
    });
  }),
});
