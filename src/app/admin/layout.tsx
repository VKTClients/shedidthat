"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardList, Lock, LogOut, Loader2, Scissors, Users } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { adminFetch } from "@/lib/admin-fetch";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const initialise = async () => {
      try {
        const bootstrapResponse = await fetch("/api/admin/bootstrap", { cache: "no-store" });
        const bootstrap = await bootstrapResponse.json();
        if (!bootstrapResponse.ok) throw new Error(bootstrap.error || "Admin setup unavailable");
        setRegistrationOpen(Boolean(bootstrap.registrationOpen));
        const { data } = await supabase.auth.getSession();
        setSession(data?.session);
        if (data?.session) {
          const verification = await adminFetch("/api/admin/me");
          if (!verification.ok) { await supabase.auth.signOut(); setError("This account is not the studio admin."); }
          else setAdminVerified(true);
        }
      } catch (initialiseError) {
        setError(initialiseError instanceof Error ? initialiseError.message : "Admin setup unavailable");
      } finally { setLoading(false); }
    };
    initialise();

    try {

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        if (!nextSession) setAdminVerified(false);
      });

      return () => subscription.unsubscribe();
    } catch { setLoading(false); }
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginLoading(true);
    setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) setError(loginError.message);
    else {
      const verification = await adminFetch("/api/admin/me");
      if (!verification.ok) { await supabase.auth.signOut(); setError("This account is not the studio admin."); }
      else setAdminVerified(true);
    }
    setLoginLoading(false);
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoginLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/bootstrap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, setupCode }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Registration failed");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      setRegistrationOpen(false); setAdminVerified(true);
    } catch (registerError) { setError(registerError instanceof Error ? registerError.message : "Registration failed"); }
    finally { setLoginLoading(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="admin-loading"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  if (!session || !adminVerified) {
    return (
      <div className="admin-login-shell">
        <div className="admin-login-card">
          <div className="admin-brand-mark admin-brand-mark-large">SDT</div>
          <div className="text-center mb-8">
            <p className="admin-kicker">Studio operations</p>
            <h1 className="admin-login-title">{registrationOpen ? "Create the studio admin" : "Welcome back"}</h1>
            <p className="admin-copy mt-2">{registrationOpen ? "Register the single owner account. Registration closes permanently once completed." : "Sign in to manage bookings, clients, and your studio calendar."}</p>
          </div>
          <div className="admin-login-lock"><Lock className="h-4 w-4" /> Private admin area</div>
          <form onSubmit={registrationOpen ? handleRegister : handleLogin} className="space-y-5 mt-5">
            <div>
              <label className="admin-label" htmlFor="admin-email">Email</label>
              <input id="admin-email" type="email" className="admin-input" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div>
              <label className="admin-label" htmlFor="admin-password">Password</label>
              <input id="admin-password" type="password" className="admin-input" value={password} onChange={(event) => setPassword(event.target.value)} minLength={registrationOpen ? 12 : undefined} required />
            </div>
            {registrationOpen && <>
              <div><label className="admin-label" htmlFor="admin-confirm-password">Confirm password</label><input id="admin-confirm-password" type="password" className="admin-input" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} required /></div>
              <div><label className="admin-label" htmlFor="admin-setup-code">Private setup code</label><input id="admin-setup-code" type="password" className="admin-input" value={setupCode} onChange={(event) => setSetupCode(event.target.value)} required /><p className="admin-copy mt-2 text-xs">Use the ADMIN_SETUP_TOKEN configured on your host.</p></div>
            </>}
            {error && <p className="admin-error">{error}</p>}
            <button type="submit" disabled={loginLoading} className="admin-button admin-button-primary w-full">
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : registrationOpen ? "Create sole admin" : "Sign in"}
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
