"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sunrise,
  Moon,
  Dumbbell,
  Scale,
  Droplets,
  CalendarCheck,
  TrendingUp,
  Sparkles,
  Settings,
  Sun,
  MoonStar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/daily-check-in", label: "Daily Check-In", icon: Sun },
  { href: "/morning", label: "Morning", icon: Sunrise },
  { href: "/evening", label: "Evening", icon: Moon },
  { href: "/evening-shutdown", label: "Evening Shutdown", icon: MoonStar },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/weight", label: "Weight", icon: Scale },
  { href: "/hydration", label: "Hydration", icon: Droplets },
  { href: "/weekly-review", label: "Weekly Review", icon: CalendarCheck },
  { href: "/correlations", label: "Correlations", icon: TrendingUp },
  { href: "/future-self", label: "Future Self", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();
  // Hide chrome on the auth screen.
  if (pathname?.startsWith("/login")) return null;

  return (
    <nav className="border-b border-border bg-card/40 lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="px-4 py-4 lg:py-6">
        <Link href="/dashboard" className="block px-2 pb-3 text-base font-bold tracking-tight">
          ⚡ Performance OS
        </Link>
        <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
        <form action="/auth/signout" method="post" className="mt-3 hidden px-1 lg:block">
          <button className="text-xs text-muted-foreground hover:text-foreground" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
