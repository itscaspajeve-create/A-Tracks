"use client";

import { useState, useTransition } from "react";
import { Loader2, LogIn } from "lucide-react";

import { loginAction, setupPasswordAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ mode }: { mode: "login" | "setup" }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res =
        mode === "setup" ? await setupPasswordAction(formData) : await loginAction(formData);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">{mode === "setup" ? "Choose a password" : "Password"}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete={mode === "setup" ? "new-password" : "current-password"}
          placeholder="••••••••"
        />
      </div>
      {mode === "setup" && (
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full gap-2" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {mode === "setup" ? "Set password & enter" : "Sign in"}
      </Button>
      {mode === "setup" && (
        <p className="text-center text-xs text-muted-foreground">
          Stored locally in your database — run <code>npm run reset-password</code> if you ever forget it.
        </p>
      )}
    </form>
  );
}
