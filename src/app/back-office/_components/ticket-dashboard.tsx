"use client";

import { useState, useMemo } from "react";
import { api } from "@/trpc/react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
} from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Layers,
  Search,
  ArrowUpDown,
  MoreVertical,
  Trash2,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface Ticket {
  id: number;
  content: string;
  categories: string[];
  status: string;
  priorityLevel: string;
  senderId: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

interface Stats {
  total: number;
  pending: number;
  highPriority: number;
  resolved: number;
}

export function TicketDashboard({ 
  initialTickets, 
  initialStats 
}: { 
  initialTickets: Ticket[];
  initialStats: Stats;
}) {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  
  const utils = api.useUtils();
  const { data: tickets = initialTickets } = api.ticket.getAll.useQuery(undefined, {
    initialData: initialTickets,
    refetchInterval: 5000,
  });
  const { data: stats = initialStats } = api.ticket.getStats.useQuery(undefined, {
    initialData: initialStats,
    refetchInterval: 5000,
  });

  const updateStatus = api.ticket.updateStatus.useMutation({
    onSuccess: () => utils.ticket.invalidate(),
  });

  const updatePriority = api.ticket.updatePriority.useMutation({
    onSuccess: () => utils.ticket.invalidate(),
  });

  const deleteTicket = api.ticket.delete.useMutation({
    onSuccess: () => utils.ticket.invalidate(),
  });

  const filteredAndSortedTickets = useMemo(() => {
    const result = tickets.filter(t => {
      const matchesFilter = filter === "all" || t.status === filter;
      const matchesSearch = t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });

    result.sort((a, b) => {
      if (sortBy === "newest") return b.createdAt.getTime() - a.createdAt.getTime();
      if (sortBy === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
      if (sortBy === "priority") {
        const priorityScore: Record<string, number> = { high: 3, medium: 2, low: 1 };
        return (priorityScore[b.priorityLevel] ?? 0) - (priorityScore[a.priorityLevel] ?? 0);
      }
      return 0;
    });

    return result;
  }, [tickets, filter, searchQuery, sortBy]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved": return <CheckCircle size={14} className="text-emerald-500" />;
      case "pending": return <Clock size={14} className="text-orange-500" />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Signals" 
          value={stats.total} 
          icon={<Layers className="text-primary" size={16} />}
          description="Total transmissions"
          className="bg-primary/5 border-primary/10"
        />
        <StatCard 
          title="Awaiting" 
          value={stats.pending} 
          icon={<Clock className="text-orange-500" size={16} />}
          description="Pending review"
          className="bg-orange-500/5 border-orange-500/10"
        />
        <StatCard 
          title="Critical" 
          value={stats.highPriority} 
          icon={<AlertTriangle className="text-red-500" size={16} />}
          description="Urgent action"
          className="bg-red-500/5 border-red-500/10"
        />
        <StatCard 
          title="Completed" 
          value={stats.resolved} 
          icon={<CheckCircle className="text-emerald-500" size={16} />}
          description="Resolved signals"
          className="bg-emerald-500/5 border-emerald-500/10"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center glass p-4 border rounded-2xl shadow-lg">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
            <TabsList className="bg-muted/30 h-10 gap-1 p-1 rounded-xl border">
              <TabsTrigger value="all" className="rounded-lg px-6 h-8 text-[10px] font-bold uppercase tracking-wider">All</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg px-6 h-8 text-[10px] font-bold uppercase tracking-wider">Pending</TabsTrigger>
              <TabsTrigger value="resolved" className="rounded-lg px-6 h-8 text-[10px] font-bold uppercase tracking-wider">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 size-3.5" />
            <Input 
              placeholder="Search transmissions..." 
              className="pl-9 bg-muted/20 border-none rounded-xl h-10 text-xs focus-visible:ring-primary/20 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="outline" size="sm" className="h-10 rounded-xl gap-2 px-4 border-muted hover:bg-muted/50">
              <ArrowUpDown size={12} className="text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wider font-bold">Sort: {sortBy}</span>
            </Button>
          } />
          <DropdownMenuContent align="end" className="rounded-xl w-48 p-2 glass border-primary/10">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 pb-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Sorting</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                <DropdownMenuRadioItem value="newest" className="rounded-lg px-2 py-2 text-[11px] font-bold">Newest</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest" className="rounded-lg px-2 py-2 text-[11px] font-bold">Oldest</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="priority" className="rounded-lg px-2 py-2 text-[11px] font-bold">Highest Priority</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Ticket List */}
      <div className="grid gap-4">
        {filteredAndSortedTickets.length === 0 ? (
          <Card className="p-20 text-center bg-muted/5 border-dashed rounded-3xl border-muted-foreground/10">
            <div className="flex flex-col items-center gap-4">
              <MessageSquare className="text-muted-foreground/10" size={32} />
              <div className="space-y-1">
                <p className="text-foreground font-bold text-lg">No active transmissions</p>
                <p className="text-muted-foreground text-xs">Try adjusting your filters.</p>
              </div>
            </div>
          </Card>
        ) : (
          filteredAndSortedTickets.map((ticket, index) => (
            <Card key={ticket.id} className="group overflow-hidden border-border/40 hover:border-primary/20 hover:shadow-xl transition-all duration-500 rounded-2xl bg-gradient-to-br from-background to-muted/5" style={{ animationDelay: `${index * 30}ms` }}>
              <div className="flex">
                <div className={cn(
                  "w-1.5 transition-all duration-500 opacity-40 group-hover:opacity-100",
                  ticket.status === "resolved" ? "bg-emerald-500" : 
                  ticket.priorityLevel === "high" ? "bg-red-500" : "bg-orange-500"
                )} />
                
                <CardContent className="p-0 flex-1">
                  <div className="p-6 flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-muted/30 px-2 py-1 rounded-lg">
                          <span className="text-[9px] font-black text-muted-foreground/50 tracking-widest">SIG</span>
                          <span className="text-[10px] font-mono font-black text-primary">#{ticket.id}</span>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <div className={cn(
                              "inline-flex items-center justify-center rounded-lg font-black px-3 py-1 text-[9px] tracking-widest backdrop-blur-sm group/priority-trigger cursor-pointer border border-transparent hover:border-current transition-all", 
                              getPriorityColor(ticket.priorityLevel)
                            )}>
                              {ticket.priorityLevel.toUpperCase()}
                            </div>
                          } />
                          <DropdownMenuContent align="start" className="rounded-xl p-1.5 glass border-primary/10 w-40">
                            <DropdownMenuItem className="rounded-lg px-2 py-2 text-[10px] font-bold gap-2" onClick={() => updatePriority.mutate({ id: ticket.id, priority: "high" })}>
                              <div className="size-1.5 rounded-full bg-red-500" /> High 
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg px-2 py-2 text-[10px] font-bold gap-2" onClick={() => updatePriority.mutate({ id: ticket.id, priority: "medium" })}>
                              <div className="size-1.5 rounded-full bg-orange-500" /> Medium
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg px-2 py-2 text-[10px] font-bold gap-2" onClick={() => updatePriority.mutate({ id: ticket.id, priority: "low" })}>
                              <div className="size-1.5 rounded-full bg-blue-500" /> Low
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Badge variant="outline" className="rounded-lg font-black text-[9px] tracking-widest bg-muted/20 border-none px-3 flex gap-2 items-center text-muted-foreground/60">
                          {getStatusIcon(ticket.status)}
                          {ticket.status.toUpperCase()}
                        </Badge>
                        
                        <div className="text-[9px] text-muted-foreground/30 ml-auto font-bold tracking-tight uppercase flex items-center gap-2">
                          {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span>·</span>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <p className="text-base font-medium leading-normal tracking-tight text-foreground/80 group-hover:text-foreground transition-colors duration-300">
                        {ticket.content}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {ticket.categories.map((cat, idx) => (
                          <span key={idx} className="text-[9px] font-bold uppercase tracking-wider bg-muted/20 text-primary/50 px-2.5 py-1 rounded-lg border border-transparent group-hover:border-primary/5 group-hover:text-primary/70 transition-all duration-300">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="lg:w-48 flex flex-col gap-3 justify-center lg:border-l lg:pl-6 border-dashed border-border/40 transition-colors">
                      {ticket.status === "pending" ? (
                        <Button 
                          size="sm" 
                          className="w-full gap-2 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/5 h-10 transition-all hover:scale-[1.01]"
                          onClick={() => updateStatus.mutate({ id: ticket.id, status: "resolved" })}
                          disabled={updateStatus.isPending}
                        >
                          <CheckCircle size={14} />
                          Resolve
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full gap-2 font-black text-[10px] uppercase tracking-widest rounded-xl h-10 text-muted-foreground border-muted transition-all"
                          onClick={() => updateStatus.mutate({ id: ticket.id, status: "pending" })}
                          disabled={updateStatus.isPending}
                        >
                          <Clock size={14} />
                          Reopen
                        </Button>
                      )}
                      
                      <div className="flex gap-2">
                        <Link href={`/back-office/tickets/${ticket.id}`} className="flex-1">
                          <Button variant="secondary" size="sm" className="w-full h-9 rounded-lg text-[9px] font-black uppercase tracking-widest gap-1.5 bg-muted/40 hover:bg-muted transition-all">
                            <ExternalLink size={12} className="opacity-40" />
                            Details
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon" className="size-9 rounded-lg bg-muted/20 border border-transparent hover:border-border">
                              <MoreVertical size={14} className="text-muted-foreground" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="rounded-xl p-1.5 glass border-primary/10 w-44">
                            <DropdownMenuItem 
                              className="rounded-lg px-2 py-2 text-[10px] font-bold gap-2 text-destructive focus:bg-destructive/10 transition-all"
                              onClick={() => {
                                if(confirm("Are you sure?")) {
                                  deleteTicket.mutate({ id: ticket.id });
                                }
                              }}
                            >
                              <Trash2 size={14} />
                              Purge Signal
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  description,
  className
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode;
  description: string;
  className?: string;
}) {
  return (
    <Card className={cn("relative shadow-sm border hover:shadow-lg transition-all duration-300 rounded-3xl overflow-hidden group", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative p-5">
        <CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
          {title}
        </CardTitle>
        <div className="size-8 rounded-xl bg-background border shadow-md flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pb-6 px-5 relative">
        <div className="text-3xl font-black tabular-nums tracking-tight">{value}</div>
        <p className="text-[9px] text-muted-foreground/30 mt-2 font-bold uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300">{description}</p>
      </CardContent>
    </Card>
  );
}
