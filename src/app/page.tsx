import { CustomerForm } from "@/app/_components/customer-form";
import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white selection:bg-white selection:text-black">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <div className="text-center space-y-4">
            <h1 className="text-7xl font-light tracking-tighter sm:text-[8rem] uppercase">
              Hack<span className="font-black">Party</span>
            </h1>
            <p className="text-xl text-white/40 tracking-widest uppercase">High performance software scaling.</p>
          </div>

          <CustomerForm />

          <div className="flex flex-col items-center gap-6 pt-8">
            {session && (
              <p className="text-center text-sm tracking-wide text-white/50 uppercase">
                Logged in as <span className="text-white font-bold">{session.user?.name}</span>
              </p>
            )}
            <Link 
              href={session ? "/api/auth/signout" : "/api/auth/signin"}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-none border-white/20 hover:bg-white hover:text-black px-12 py-6 text-sm uppercase tracking-widest transition-all duration-300 h-auto"
              )}
            >
              {session ? "Sign out" : "Sign in"}
            </Link>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
