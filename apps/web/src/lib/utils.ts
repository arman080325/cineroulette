/**
 * Minimal className merge helper — the `cn` utility the shadcn-style
 * component below expects. Deliberately dependency-free (no clsx/
 * tailwind-merge) since this project doesn't need conflict resolution
 * for the classes actually in use here.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}