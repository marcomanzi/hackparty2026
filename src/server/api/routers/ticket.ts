import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tickets } from "@/server/db/schema";

export const ticketRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(tickets).values({
        content: input.content,
        category: "General",
      });
    }),
});
