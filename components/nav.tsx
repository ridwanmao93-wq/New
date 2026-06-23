"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sunrise,
  Moon,
  Dumbbell,
  Scale,
  Droplets,
  Timer,
  Users,
  Wallet,
  CalendarCheck,
  TrendingUp,
  Sparkles,
  Image as ImageIcon,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { href: "/morning", label: "Morning", icon: Sunrise },
  { href: "/evening", label: "Evening", icon: Moon },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/weight", label: "Weight", icon: Scale },
  { href: "/hydration", label: "Hydration", icon: Droplets },
  { href: "/relationships", label: "Relationships", icon: Users },
  { href: "/debt", label: "Debt & Money", icon: Wallet },
  { href: "/weekly-review", label: "Weekly Review", icon: CalendarCheck },
  { href: "/correlations", label: "Correlations", icon: TrendingUp },
  { href: "/future-self", label: "Future Self", icon: Sparkles },
  { href: "/vision-board", label: "Vision Board", icon: ImageIcon },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Hide chrome on the auth screen.
  if (pathname?.startsWith("/login")) return null;

  return (
    <nav className="border-b border-border bg-card/40 lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
      {/* Top bar: logo + hamburger (hamburger is mobile-only) */}
      <div className="flex items-center justify-between px-4 py-3 lg:py-6">
        <Link href="/dashboard" className="text-base font-bold tracking-tight">
          ⚡ Performance OS
        </Link>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Menu: collapsible on mobile, always visible on desktop */}
      <div className={cn("px-2 pb-3 lg:block lg:px-4", open ? "block" : "hidden")}>
        <ul className="flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
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

        <form action="/auth/signout" method="post" className="mt-2 px-1">
          <button
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            type="submit"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
