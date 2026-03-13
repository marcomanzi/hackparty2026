import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { ChatInterface } from "@/app/_components/chat-interface";
import { ResumeLink } from "@/app/_components/resume-link";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col bg-background text-foreground">
        <div className="container mx-auto px-4 py-12 lg:py-24 flex flex-col items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-6 mb-16 max-w-3xl animate-in fade-in slide-in-from-top-8 duration-1000">
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter sm:text-[8rem] leading-[0.8] mb-4">
              Hack<span className="text-primary">Party</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground font-medium tracking-tight">
              High performance software scaling. <span className="text-foreground/40">Secure transmissions.</span>
            </p>
          </div>

          <div className="w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <ChatInterface />
            <ResumeLink />
          </div>

          <div className="flex flex-col items-center gap-6 pt-16">
            {session && (
              <div className="flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-500">
                <p className="text-center text-sm text-muted-foreground font-black uppercase tracking-widest bg-muted/30 px-4 py-2 rounded-full border border-border/40">
                  Authenticated: <span className="text-primary">{session.user?.name}</span>
                </p>
                <Link 
                  href="/back-office"
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all duration-300 underline underline-offset-8 decoration-primary/20 hover:decoration-primary"
                >
                  Enter Command Center
                </Link>
              </div>
            )}
            <Link 
              href={session ? "/api/auth/signout" : "/api/auth/signin"}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "rounded-2xl px-12 h-14 font-black uppercase tracking-[0.2em] border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-500 text-[10px]"
              )}
            >
              {session ? "Deauthenticate" : "Authenticate Access"}
            </Link>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
