import { CustomerForm } from "@/app/_components/customer-form";
import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
              Hack<span className="text-primary">Party</span>
            </h1>
            <p className="text-xl text-muted-foreground">High performance software scaling.</p>
          </div>

          <CustomerForm />

          <div className="flex flex-col items-center gap-6 pt-8">
            {session && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-center text-sm text-muted-foreground font-medium">
                  Logged in as <span className="text-foreground font-bold">{session.user?.name}</span>
                </p>
                <Link 
                  href="/back-office"
                  className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 underline underline-offset-4"
                >
                  Enter Back Office
                </Link>
              </div>
            )}
            <Link 
              href={session ? "/api/auth/signout" : "/api/auth/signin"}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "px-8 transition-all duration-300"
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
