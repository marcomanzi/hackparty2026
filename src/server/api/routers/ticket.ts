import { z } from "zod";
import { sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { tickets, messages } from "@/server/db/schema";

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

      const [ticket] = await ctx.db.insert(tickets).values({
        content: input.content,
        categories: classifiedCategories.length > 0 ? classifiedCategories : ["General"],
        priorityLevel: priority,
        status: "pending",
        senderId: ctx.session?.user.id,
      }).returning();

      if (ticket) {
        await ctx.db.insert(messages).values({
          ticketId: ticket.id,
          content: input.content,
          senderType: "customer",
          senderId: ctx.session?.user.id,
        });
      }

      return ticket;
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.tickets.findMany({
      orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const ticket = await ctx.db.query.tickets.findFirst({
        where: (tickets, { eq }) => eq(tickets.id, input.id),
      });
      if (!ticket) throw new Error("Ticket not found");
      return ticket;
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

  translate: protectedProcedure
    .input(z.object({
      message: z.string(),
      outputLanguage: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch('https://d7dc-93-43-95-133.ngrok-free.app/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          throw new Error(`Translation API failed: ${response.statusText}`);
        }

        const data = await response.json() as { message: string };
        return { translatedText: data.message };
      } catch (error) {
        console.error("Translation error:", error);
        throw new Error("Failed to translate message");
      }
    }),

  getMessages: publicProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ ctx, input }) => {
      const dbMessages = await ctx.db.query.messages.findMany({
        where: (messages, { eq }) => eq(messages.ticketId, input.ticketId),
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      });

      if (dbMessages.length === 0) {
        // Fallback for legacy tickets
        const ticket = await ctx.db.query.tickets.findFirst({
          where: (tickets, { eq }) => eq(tickets.id, input.ticketId),
        });
        if (ticket) {
          return [{
            id: 0,
            ticketId: ticket.id,
            content: ticket.content,
            senderType: "customer",
            senderId: ticket.senderId,
            createdAt: ticket.createdAt,
          }];
        }
      }

      return dbMessages;
    }),

  addMessage: publicProcedure
    .input(z.object({
      ticketId: z.number(),
      content: z.string().min(1),
      senderType: z.enum(["customer", "staff"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const [message] = await ctx.db.insert(messages).values({
        ticketId: input.ticketId,
        content: input.content,
        senderType: input.senderType,
        senderId: ctx.session?.user.id,
      }).returning();

      // Update ticket updatedAt
      await ctx.db.update(tickets).set({ updatedAt: new Date() }).where(sql`${tickets.id} = ${input.ticketId}`);

      return message;
    }),
});
