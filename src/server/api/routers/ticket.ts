import { z } from "zod";
import { sql } from "drizzle-orm";
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
      let priority = "medium";
      
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
          const data = await response.json() as { 
            ticketCategories?: string[], 
            priorityLevel?: string 
          };
          
          if (Array.isArray(data.ticketCategories)) {
            classifiedCategories = data.ticketCategories;
          }

          if (data.priorityLevel) {
            priority = data.priorityLevel.toLowerCase();
          } else if (classifiedCategories.length > 0) {
            // Fallback to enhanced priority logic if API doesn't provide it
            const criticalKeywords = ["error", "500", "critical", "payment", "suspension", "api-issue", "failed", "crash"];
            const urgentKeywords = ["urgent", "broken", "bug", "security", "exploit"];
            
            const contentLower = input.content.toLowerCase();
            const categoriesLower = classifiedCategories.map(c => c.toLowerCase());
            
            if (
              categoriesLower.some(cat => criticalKeywords.includes(cat)) ||
              criticalKeywords.some(kw => contentLower.includes(kw))
            ) {
              priority = "high";
            } else if (urgentKeywords.some(kw => contentLower.includes(kw))) {
              priority = "medium";
            } else {
              priority = "low";
            }
          }
        }
      } catch (error) {
        console.error("Classification API error:", error);
      }

      await ctx.db.insert(tickets).values({
        content: input.content,
        categories: classifiedCategories.length > 0 ? classifiedCategories : ["General"],
        priorityLevel: priority,
        status: "pending",
      });
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.tickets.findMany({
      orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
    });
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const allTickets = await ctx.db.query.tickets.findMany();
    
    return {
      total: allTickets.length,
      pending: allTickets.filter(t => t.status === "pending").length,
      highPriority: allTickets.filter(t => t.priorityLevel === "high").length,
      resolved: allTickets.filter(t => t.status === "resolved").length,
    };
  }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(tickets).set({ status: input.status }).where(sql`${tickets.id} = ${input.id}`);
    }),

  updatePriority: protectedProcedure
    .input(z.object({ id: z.number(), priority: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(tickets).set({ priorityLevel: input.priority }).where(sql`${tickets.id} = ${input.id}`);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(tickets).where(sql`${tickets.id} = ${input.id}`);
    }),
});
