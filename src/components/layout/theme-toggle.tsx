"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  const icon = dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;
  if (compact) {
    return (
      <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
        {mounted ? icon : <Moon className="h-4 w-4" />}
      </Button>
    );
  }
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 text-muted-foreground"
      onClick={toggle}
    >
      {mounted ? icon : <Moon className="h-4 w-4" />}
      {dark ? "Light mode" : "Dark mode"}
    </Button>
  );
}
