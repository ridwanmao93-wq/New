/** Green "already logged today" banner, reused across form pages. */
export function DoneTodayBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
      ✅ {children}
    </div>
  );
}
