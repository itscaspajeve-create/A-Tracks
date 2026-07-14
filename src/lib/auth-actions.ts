"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  hasPassword,
  setPassword,
  verifyPassword,
} from "./auth";

export async function setupPasswordAction(formData: FormData) {
  if (hasPassword()) return { error: "A password is already set — sign in instead." };
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  if (password.length < 4) return { error: "Password must be at least 4 characters." };
  if (password !== confirm) return { error: "Passwords don’t match." };
  setPassword(password);
  createSession();
  redirect("/");
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (!verifyPassword(password)) return { error: "Wrong password — try again." };
  createSession();
  redirect("/");
}

export async function logoutAction() {
  destroySession();
  redirect("/login");
}
