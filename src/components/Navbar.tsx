import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-offset-2 ${
    isActive ? "text-ink" : "text-[#666] hover:text-ink"
  }`;

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    window.location.assign("/");
  };

  const links = (
    <>
      <NavLink to="/events" className={navLinkClass} onClick={() => setOpen(false)}>Events</NavLink>
      {user?.role === "organizer" && <NavLink to="/organizer" className={navLinkClass} onClick={() => setOpen(false)}>Organizer studio</NavLink>}
      {user?.role === "student" && <NavLink to="/dashboard" className={navLinkClass} onClick={() => setOpen(false)}>My events</NavLink>}
      {user && <NavLink to="/profile" className={navLinkClass} onClick={() => setOpen(false)}>Profile</NavLink>}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[#ebebeb] bg-white/90 backdrop-blur-md">
      <div className="page-shell flex min-h-16 items-center justify-between">
        <Link to="/" aria-label="ShowUp home" onClick={() => setOpen(false)}><Logo /></Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">{links}</nav>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="max-w-48 truncate text-sm text-[#666]">Hi, {user.name.split(" ")[0]}</span>
              <button onClick={handleSignOut} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#ebebeb] px-4 text-sm font-medium text-ink transition-colors hover:bg-[#fafafa]">
                <LogOut aria-hidden="true" className="h-4 w-4" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-[#fafafa]">Sign in</Link>
              <Link to="/signup" className="btn-primary min-h-10 px-4 text-sm">Get started</Link>
            </>
          )}
        </div>
        <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-[#ebebeb] text-ink md:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen((value) => !value)}>
          {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
        </button>
      </div>
      {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-[#ebebeb] bg-white px-4 py-3 md:hidden">
        <div className="mx-auto flex max-w-[1200px] flex-col items-stretch gap-1">{links}
          <div className="mt-2 flex items-center gap-3 border-t border-[#ebebeb] pt-3">
            {user ? <button onClick={handleSignOut} className="min-h-11 px-3 text-sm font-medium">Sign out</button> : <><Link to="/login" onClick={() => setOpen(false)} className="min-h-11 px-3 py-3 text-sm font-medium">Sign in</Link><Link to="/signup" onClick={() => setOpen(false)} className="btn-primary min-h-11 px-4 text-sm">Get started</Link></>}
          </div>
        </div>
      </nav>}
    </header>
  );
};
