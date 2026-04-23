import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpenCheck,
  Flame,
  Heart,
  House,
  Languages,
  LogOut,
  Medal,
  Moon,
  Sun,
  SunMoon,
  UserRound,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import { getQuizzes } from "../lib/api";
import { clearToken, getToken, isLoggedIn } from "../lib/auth";
import { useAppContext } from "./AppContext";
import { GlobalSearch } from "./GlobalSearch";

export function ProtectedRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/auth" replace />;
  return children;
}

export function AppLayout() {
  const navigate = useNavigate();
  const { t, theme, setTheme, language, setLanguage, languages, streak } = useAppContext();
  const [quizzes, setQuizzes] = useState([]);
  const homeTarget = getToken() ? "/dashboard" : "/";
  const navItems = [
    { to: "/dashboard", label: t("dashboard"), icon: House },
    { to: "/leaderboard", label: t("leaderboard"), icon: Medal },
    { to: "/practice", label: t("practice"), icon: BookOpenCheck },
    { to: "/results", label: t("results"), icon: BarChart3 },
    { to: "/wishlist", label: t("wishlist"), icon: Heart },
    { to: "/interview", label: t("interview"), icon: Video },
  ];

  useEffect(() => {
    getQuizzes().then(setQuizzes).catch(() => {});
  }, []);

  return (
    <div className="app-shell">
      <header className="app-topbar glass-card">
        <div className="app-topbar-left">
          <div className="brand">
            <Link to={homeTarget} aria-label={t("goHomeAria")}>
              <img src="/logo.png" alt="Practify Logo" className="brand-logo" />
            </Link>
            <div>
              <h1>Practify</h1>
              <p>{t("brandTagline")}</p>
            </div>
          </div>
        </div>

        <div className="app-topbar-center">
          <div className="streak-inline" aria-label={t("currentStreak")}>
            <Flame size={14} />
            <span className="muted">
              {t("currentStreak")}: <b>{t("days", { count: streak.currentStreak })}</b>
            </span>
          </div>
        </div>

        <div className="app-topbar-right">
          <div className="topbar-controls">
            <label className="topbar-select" aria-label={t("language")}>
              <Languages size={14} />
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                aria-label={t("language")}
              >
                {languages.map((item) => (
                  <option value={item.code} key={item.code}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            <label className="topbar-select" aria-label={t("theme")}>
              {theme === "dark" ? <Moon size={14} /> : theme === "light" ? <Sun size={14} /> : <SunMoon size={14} />}
              <select value={theme} onChange={(event) => setTheme(event.target.value)} aria-label={t("theme")}>
                <option value="system">{t("system")}</option>
                <option value="light">{t("light")}</option>
                <option value="dark">{t("dark")}</option>
              </select>
            </label>
          </div>

          <Link className="ghost-btn compact topbar-action-btn" to="/profile">
            <UserRound size={16} /> {t("profile")}
          </Link>
          <button
            className="ghost-btn compact topbar-action-btn"
            onClick={() => {
              clearToken();
              navigate("/auth");
            }}
          >
            <LogOut size={16} /> {t("logout")}
          </button>
        </div>

        <nav className="app-topnav" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "topnav-item active" : "topnav-item")}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </header>

      <main className="main-pane">
        <GlobalSearch quizzes={quizzes} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="page-wrap"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}

