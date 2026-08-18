"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardList, Lock, LogOut, Loader2, Scissors, Users } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const adminTabs = [
  { href: "/admin", label: "Bookings", icon: ClipboardList },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/clients", label: "Clients & Sales", icon: Users },
  { href: "/admin/services", label: "Services", icon: Scissors },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    try {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data?.session);
        setLoading(false);
      }).catch(() => setLoading(false));

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
      });

      return () => subscription.unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginLoading(true);
    setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) setError(loginError.message);
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="admin-loading"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  if (!session) {
    return (
      <div className="admin-login-shell">
        <div className="admin-login-card">
          <div className="admin-brand-mark admin-brand-mark-large">SDT</div>
          <div className="text-center mb-8">
            <p className="admin-kicker">Studio operations</p>
            <h1 className="admin-login-title">Welcome back</h1>
            <p className="admin-copy mt-2">Sign in to manage bookings, clients, and your studio calendar.</p>
          </div>
          <div className="admin-login-lock"><Lock className="h-4 w-4" /> Private admin area</div>
          <form onSubmit={handleLogin} className="space-y-5 mt-5">
            <div>
              <label className="admin-label" htmlFor="admin-email">Email</label>
              <input id="admin-email" type="email" className="admin-input" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div>
              <label className="admin-label" htmlFor="admin-password">Password</label>
              <input id="admin-password" type="password" className="admin-input" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            {error && <p className="admin-error">{error}</p>}
            <button type="submit" disabled={loginLoading} className="admin-button admin-button-primary w-full">
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-brand-mark">SDT</div>
          <div>
            <p className="admin-wordmark">SheDidThat</p>
            <p className="admin-sidebar-caption">Admin studio</p>
          </div>
        </div>
        <div className="admin-sidebar-section-label">Workspace</div>
        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            const active = pathname === tab.href || (tab.href === "/admin" && pathname === "/admin/");
            return (
              <Link key={tab.href} href={tab.href} className={cn("admin-nav-item", active && "admin-nav-item-active")}>
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-status-dot"><span /> Studio is online</div>
          <button onClick={handleLogout} className="admin-nav-item admin-signout"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </aside>
      <div className="admin-content-shell">
        <div className="admin-mobile-topbar">
          <div className="flex items-center gap-3"><div className="admin-brand-mark">SDT</div><p className="admin-wordmark">SheDidThat</p></div>
          <button onClick={handleLogout} className="admin-icon-button" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
        </div>
        <div className="admin-mobile-nav" aria-label="Mobile admin navigation">
          {adminTabs.map((tab) => <Link key={tab.href} href={tab.href} className={cn("admin-mobile-nav-item", pathname === tab.href && "admin-mobile-nav-item-active")}>{tab.label}</Link>)}
        </div>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
