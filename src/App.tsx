import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ProtectedRoute, OrganizerRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OrganizerDashboardPage } from "./pages/organizer/OrganizerDashboardPage";
import { CreateEventPage } from "./pages/organizer/CreateEventPage";
import { EventRegistrantsPage } from "./pages/organizer/EventRegistrantsPage";

const CheckInPage = lazy(() => import("./pages/organizer/CheckInPage").then(({ CheckInPage }) => ({ default: CheckInPage })));

function StudentDashboardRoute() {
  const { user } = useAuth();
  return user?.role === "organizer" ? <Navigate to="/organizer" replace /> : <DashboardPage />;
}

function AppShell() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <Navbar />
      <div className={`flex-1 ${pathname === "/" ? "" : "application-shell"}`}>
        <Routes>
          <Route path="/" element={<main><LandingPage /></main>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><main><StudentDashboardRoute /></main></ProtectedRoute>} />
          <Route path="/organizer" element={<OrganizerRoute><OrganizerDashboardPage /></OrganizerRoute>} />
          <Route path="/organizer/new" element={<OrganizerRoute><CreateEventPage /></OrganizerRoute>} />
          <Route path="/organizer/events/:id/edit" element={<OrganizerRoute><CreateEventPage /></OrganizerRoute>} />
          <Route path="/organizer/events/:id" element={<OrganizerRoute><EventRegistrantsPage /></OrganizerRoute>} />
          <Route path="/organizer/events/:id/checkin" element={<OrganizerRoute><Suspense fallback={<main className="page-shell py-12 text-sm text-[#737373]" role="status">Loading check-in…</main>}><CheckInPage /></Suspense></OrganizerRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return <AuthProvider><AppShell /></AuthProvider>;
}

export default App;
