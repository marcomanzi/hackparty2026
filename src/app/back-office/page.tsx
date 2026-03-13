import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default async function BackOfficePage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  const tickets = await api.ticket.getAll();

  return (
    <main className="min-h-screen bg-muted/30 pb-16">
      <div className="bg-background border-b shadow-sm mb-12">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Back Office</h1>
            <p className="text-sm text-muted-foreground">Manage help requests and messages.</p>
          </div>
          <Link 
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "transition-all duration-300"
            )}
          >
            ← Terminal Home
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid gap-6">
          {tickets.length === 0 ? (
            <Card className="p-12 text-center bg-background border-dashed">
              <p className="text-muted-foreground italic">No messages received yet.</p>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card key={ticket.id} className="bg-background shadow-sm hover:shadow-md transition-shadow group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    #{ticket.id}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg leading-relaxed">
                    {ticket.content}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-4">
                  {ticket.categories.map((cat, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
