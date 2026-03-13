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
      let classifiedCategory = "General";
      
      try {
        const categories = [
          "payment problem", 
          "login issue", 
          "account suspension", 
          "refund request", 
          "technical bug"
        ];

        const response = await fetch('https://d7dc-93-43-95-133.ngrok-free.app/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: `TCK-${Date.now()}`,
            ticketSubject: input.content.slice(0, 50),
            ticketContent: input.content,
            existingCategories: categories
          }),
        });

        if (response.ok) {
          const data = await response.json() as { category?: string };
          if (data.category && categories.includes(data.category)) {
            classifiedCategory = data.category;
          }
        }
      } catch (error) {
        console.error("Classification API error:", error);
      }

      await ctx.db.insert(tickets).values({
        content: input.content,
        category: classifiedCategory,
      });
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.tickets.findMany({
      orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
    });
  }),
});
