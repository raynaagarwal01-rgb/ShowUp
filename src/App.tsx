import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ProtectedRoute, OrganizerRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OrganizerDashboardPage } from "./pages/organizer/OrganizerDashboardPage";
import { CreateEventPage } from "./pages/organizer/CreateEventPage";
import { EventRegistrantsPage } from "./pages/organizer/EventRegistrantsPage";
import { CheckInPage } from "./pages/organizer/CheckInPage";

function App() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-ink text-cream">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id"
              element={
                <ProtectedRoute>
                  <EventDetailPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizer"
              element={
                <OrganizerRoute>
                  <OrganizerDashboardPage />
                </OrganizerRoute>
              }
            />
            <Route
              path="/organizer/new"
              element={
                <OrganizerRoute>
                  <CreateEventPage />
                </OrganizerRoute>
              }
            />
            <Route
              path="/organizer/events/:id/edit"
              element={
                <OrganizerRoute>
                  <CreateEventPage />
                </OrganizerRoute>
              }
            />
            <Route
              path="/organizer/events/:id"
              element={
                <OrganizerRoute>
                  <EventRegistrantsPage />
                </OrganizerRoute>
              }
            />
            <Route
              path="/organizer/events/:id/checkin"
              element={
                <OrganizerRoute>
                  <CheckInPage />
                </OrganizerRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
