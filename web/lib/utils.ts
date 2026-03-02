import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number | null): string {
  if (score === null) return "\u2014";
  return Math.round(score).toString();
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "\u2014";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getScoreColor(
  score: number
): "danger" | "warning" | "accent" | "success" {
  if (score < 40) return "danger";
  if (score < 60) return "warning";
  if (score < 80) return "accent";
  return "success";
}

export function getScoreLabel(score: number): string {
  if (score < 40) return "Poor";
  if (score < 60) return "Needs Work";
  if (score < 80) return "Good";
  return "Excellent";
}
