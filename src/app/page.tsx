import { CustomerForm } from "@/app/_components/customer-form";
import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0f002d] to-[#050510] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-extrabold tracking-tight sm:text-[6rem]">
              Hack<span className="text-[hsl(280,100%,70%)]">Party</span>
            </h1>
            <p className="text-xl text-white/60">We are here to help you scaling your project.</p>
          </div>

          <CustomerForm />

          <div className="flex flex-col items-center gap-4">
            {session && (
              <p className="text-center text-lg text-white/80">
                Logged in as <span className="text-[hsl(280,100%,70%)] font-semibold">{session.user?.name}</span>
              </p>
            )}
            <Link
              href={session ? "/api/auth/signout" : "/api/auth/signin"}
              className="rounded-full bg-white/5 border border-white/10 px-8 py-3 font-semibold no-underline transition hover:bg-white/10 hover:border-white/20"
            >
              {session ? "Sign out" : "Sign in"}
            </Link>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
