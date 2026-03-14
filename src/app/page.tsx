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
      <main className="flex min-h-screen flex-col bg-white text-slate-900">
        <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter italic">ACME<span className="text-primary not-italic">.</span></span>
            <div className="h-4 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact Us</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {session ? (
               <Link 
                 href="/back-office"
                 className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
               >
                 Admin Console
               </Link>
             ) : (
                <Link 
                  href="/api/auth/signin"
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
             )}
          </div>
        </header>

        <div className="container mx-auto px-4 pt-40 pb-24 flex flex-col items-center justify-center">
          <div className="text-center space-y-6 mb-16 max-w-4xl animate-in fade-in slide-in-from-top-8 duration-1000">
            <h1 className="text-6xl lg:text-9xl font-black tracking-tighter sm:text-[9rem] leading-[0.8] mb-4 bg-gradient-to-b from-slate-950 to-slate-600 bg-clip-text text-transparent">
              Global Support<span className="text-primary">.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-slate-500 font-medium tracking-tight max-w-2xl mx-auto">
              Premium enterprise assistance for the <span className="text-slate-900">ACME ecosystem</span>. <span className="opacity-40">Available 24/7/365.</span>
            </p>
          </div>

          <div className="w-full max-w-3xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <ChatInterface />
            <ResumeLink />
          </div>

          <div className="mt-20 flex flex-col items-center gap-4">
             {session && (
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Secure Identity: <span className="text-primary">{session.user?.name}</span>
               </p>
             )}
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
