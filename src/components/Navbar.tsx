import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-coral" : "text-cream/70 hover:text-cream"
  }`;

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/events" className={navLinkClass}>
            Events
          </NavLink>
          {user?.role === "organizer" || user?.role === "admin" ? (
            <NavLink to="/organizer" className={navLinkClass}>
              Organizer Studio
            </NavLink>
          ) : null}
          {user ? (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>
                My Events
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                Portfolio
              </NavLink>
            </>
          ) : null}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="text-sm text-muted">
                Hi, {user.name.split(" ")[0]}
                {user.city && <span className="text-cream/40"> · {user.city}</span>}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm text-cream/80 transition-colors hover:border-coral/60 hover:text-coral"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-cream/80 hover:text-cream"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-coral px-4 py-1.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-ink px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-3 pt-3">
            <NavLink to="/events" className={navLinkClass} onClick={() => setOpen(false)}>
              Events
            </NavLink>
            {user?.role === "organizer" || user?.role === "admin" ? (
              <NavLink to="/organizer" className={navLinkClass} onClick={() => setOpen(false)}>
                Organizer Studio
              </NavLink>
            ) : null}
            {user ? (
              <>
                <NavLink to="/dashboard" className={navLinkClass} onClick={() => setOpen(false)}>
                  <span className="flex items-center gap-1.5">
                    <LayoutDashboard className="h-4 w-4" /> My Events
                  </span>
                </NavLink>
                <NavLink to="/profile" className={navLinkClass} onClick={() => setOpen(false)}>
                  My Portfolio
                </NavLink>
              </>
            ) : null}
            <div className="mt-2 flex gap-3 border-t border-border pt-3">
              {user ? (
                <button onClick={handleSignOut} className="text-sm text-cream/80">
                  Sign out
                </button>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-cream/80" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="rounded-full bg-coral px-4 py-1.5 text-sm font-semibold text-ink"
                    onClick={() => setOpen(false)}
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
