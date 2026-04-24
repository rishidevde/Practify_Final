import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { InterviewPage } from "./pages/InterviewPage.jsx";
import { LeaderboardPage } from "./pages/LeaderboardPage.jsx";
import { NotFoundPage } from "./pages/NotFoundPage.jsx";
import { PracticePage } from "./pages/PracticePage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { QuizPage } from "./pages/QuizPage.jsx";
import { ResultsPage } from "./pages/ResultsPage.jsx";
import { WishlistPage } from "./pages/WishlistPage.jsx";
import { AppLayout, ProtectedRoute } from "./shared/Layout.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/quiz/:quizId" element={<QuizPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/interview" element={<InterviewPage />} />
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;
