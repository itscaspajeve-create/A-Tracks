import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { AppLogo } from "@/components/layout/app-logo";
import { hasPassword, isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default function LoginPage() {
  if (isAuthed()) redirect("/");
  const mode = hasPassword() ? "login" : "setup";

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <AppLogo size={48} />
          <div>
            <h1 className="text-lg font-semibold">A Tracks</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "setup"
                ? "Welcome! Create a password to protect your finances."
                : "Enter your password to continue."}
            </p>
          </div>
        </div>
        <LoginForm mode={mode} />
      </div>
    </div>
  );
}
