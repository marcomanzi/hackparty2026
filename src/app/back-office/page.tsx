import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { TicketDashboard } from "./_components/ticket-dashboard";

export default async function BackOfficePage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  // Fetch initial data on the server for fast first paint
  const initialTickets = await api.ticket.getAll();
  const initialStats = await api.ticket.getStats();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Active Transmissions</h2>
        <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium mt-1">Real-time support monitoring</p>
      </div>
      
      <TicketDashboard 
        initialTickets={initialTickets} 
        initialStats={initialStats} 
      />
    </div>
  );
}
