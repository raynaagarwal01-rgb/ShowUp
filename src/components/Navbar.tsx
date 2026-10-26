import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-ink" : "text-[#666] hover:text-ink"}`;

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      navigate("/", { replace: true });
      setOpen(false);
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : "Couldn't sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  const links = (
    <>
      <NavLink to="/events" className={navLinkClass} onClick={() => setOpen(false)}>Events</NavLink>
      {user?.role === "organizer" && <NavLink to="/organizer" className={navLinkClass} onClick={() => setOpen(false)}>Organizer studio</NavLink>}
      {user?.role === "student" && <NavLink to="/dashboard" className={navLinkClass} onClick={() => setOpen(false)}>My events</NavLink>}
      {user && <NavLink to="/profile" className={navLinkClass} onClick={() => setOpen(false)}>Profile</NavLink>}
    </>
  );

  const signOutButton = (mobile = false) => <button type="button" onClick={() => void handleSignOut()} disabled={signingOut} className={`${mobile ? "min-h-11 px-3" : "min-h-10 gap-2 rounded-md border border-[#ebebeb] px-4 hover:bg-[#fafafa]"} inline-flex items-center text-sm font-medium text-ink disabled:cursor-wait`}>
    {!mobile && <LogOut aria-hidden="true" className="h-4 w-4" />}{signingOut ? "Signing out…" : "Sign out"}
  </button>;

  return (
    <header className="sticky top-0 z-40 border-b border-[#ebebeb] bg-white/90 backdrop-blur-md">
      <div className="page-shell flex min-h-16 items-center justify-between">
        <Link to="/" aria-label="ShowUp home" onClick={() => setOpen(false)}><Logo /></Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">{links}</nav>
        <div className="hidden items-center gap-3 md:flex">
          {user ? <><span className="max-w-48 truncate text-sm text-[#666]">Hi, {user.name.split(" ")[0]}</span>{signOutButton()}</> : <><Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-[#fafafa]">Sign in</Link><Link to="/signup" className="btn-primary min-h-10 rounded-md px-4 text-sm">Get started</Link></>}
        </div>
        <button ref={toggleRef} type="button" className="grid h-11 w-11 place-items-center rounded-md border border-[#ebebeb] text-ink md:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen((value) => !value)}>
          {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
        </button>
      </div>
      {signOutError && <p role="alert" className="page-shell pb-2 text-sm text-red-700">{signOutError}</p>}
      {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-[#ebebeb] bg-white px-4 py-3 md:hidden">
        <div className="mx-auto flex max-w-[1200px] flex-col items-stretch gap-1">{links}
          <div className="mt-2 flex items-center gap-3 border-t border-[#ebebeb] pt-3">
            {user ? signOutButton(true) : <><Link to="/login" onClick={() => setOpen(false)} className="min-h-11 px-3 py-3 text-sm font-medium">Sign in</Link><Link to="/signup" onClick={() => setOpen(false)} className="btn-primary min-h-11 rounded-md px-4 text-sm">Get started</Link></>}
          </div>
        </div>
      </nav>}
    </header>
  );
};
