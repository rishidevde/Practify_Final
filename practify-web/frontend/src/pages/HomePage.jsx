import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  Globe,
  Languages,
  LineChart,
  Mail,
  Mic,
  MessageCircle,
  Phone,
  GraduationCap,
  Shield,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getToken } from "../lib/auth";
import { useAppContext } from "../shared/AppContext";

const examCards = [
  { exam: "NDA/CDS", descKey: "examCard_nda_desc", icon: Shield },
  { exam: "JEE", descKey: "examCard_jee_desc", icon: GraduationCap },
  { exam: "NEET", descKey: "examCard_neet_desc", icon: UserPlus },
  { exam: "GATE", descKey: "examCard_gate_desc", icon: GraduationCap },
];

export function HomePage() {
  const { t } = useAppContext();
  const homeTarget = getToken() ? "/dashboard" : "/";
  const highlights = [
    { title: t("highlight_realistic_title"), text: t("highlight_realistic_text"), icon: BookOpenCheck },
    { title: t("highlight_analytics_title"), text: t("highlight_analytics_text"), icon: LineChart },
    { title: t("highlight_smart_title"), text: t("highlight_smart_text"), icon: Brain },
    { title: t("highlight_peer_title"), text: t("highlight_peer_text"), icon: MessageCircle },
    { title: t("highlight_ssb_title"), text: t("highlight_ssb_text"), icon: Mic },
    { title: t("highlight_lang_title"), text: t("highlight_lang_text"), icon: Languages },
  ];

  return (
    <div className="landing-v2">
      <header className="topbar landing-topbar">
        <div className="brand-inline">
          <Link to={homeTarget} aria-label={t("goHomeAria")}>
            <img src="/logo.png" alt="Practify Logo" className="brand-logo" />
          </Link>
          <Link to={homeTarget} aria-label={t("goHomeAria")}>
            <b>Practify</b>
          </Link>
        </div>
        <div className="hero-actions">
          <Link to="/auth" className="ghost-btn compact">
            {t("login")}
          </Link>
          <Link to="/auth" className="cta-btn compact">
            {t("createAccount")}
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <img src="/logo.png" alt="Practify Logo" className="landing-hero-logo" />
        <h1>PRACTIFY</h1>
        <h2>{t("landingHeadline")}</h2>
        <p>{t("landingSubhead")}</p>
        <div className="hero-actions">
          <Link to="/auth" className="ghost-btn">
            {t("login")}
          </Link>
          <Link to="/auth" className="cta-btn">
            {t("createAccount")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="landing-section landing-section-soft">
        <h3>{t("whyChoose")}</h3>
        <div className="landing-feature-grid">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article className="landing-feature-card" key={item.title}>
                <Icon size={22} />
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-section landing-section-soft">
        <h3>{t("prepareFor")}</h3>
        <div className="landing-exam-grid">
          {examCards.map((item) => {
            const Icon = item.icon;
            return (
              <article className="landing-exam-card" key={item.exam}>
                <span className="landing-exam-icon">
                  <Icon size={18} />
                </span>
                <h4>{item.exam}</h4>
                <p>{t(item.descKey)}</p>
              </article>
            );
          })}
        </div>
        <div className="landing-stats">
          <article>
            <b>10K+</b>
            <span>{t("activeStudents")}</span>
          </article>
          <article>
            <b>500+</b>
            <span>{t("practiceQuestions")}</span>
          </article>
          <article>
            <b>95%</b>
            <span>{t("successRate")}</span>
          </article>
          <article>
            <b>24/7</b>
            <span>{t("supportAvailable")}</span>
          </article>
        </div>
      </section>

      <section className="landing-cta-banner">
        <h3>{t("readyToTransform")}</h3>
        <p>{t("joinThousands")}</p>
        <Link to="/auth" className="cta-btn compact">
          {t("startJourney")}
        </Link>
      </section>

      <footer className="landing-footer">
        <div>
          <h4>Practify</h4>
          <p>{t("landingFooterBlurb")}</p>
        </div>
        <div>
          <h4>{t("quickLinks")}</h4>
          <p>
            <Link to="/">{t("home")}</Link>
          </p>
          <p>
            <Link to="/auth">{t("createAccount")}</Link>
          </p>
        </div>
        <div>
          <h4>{t("support")}</h4>
          <p>
            <Mail size={14} /> {t("contactUs")}
          </p>
          <p>
            <Phone size={14} /> +91-90000-00000
          </p>
        </div>
        <div>
          <h4>{t("social")}</h4>
          <p>
            <Globe size={14} /> Instagram
          </p>
          <p>
            <Globe size={14} /> LinkedIn
          </p>
        </div>
      </footer>

      <section className="landing-bottom-note">
        <small>
          &copy; 2026 Practify. {t("rightsReserved")}
        </small>
      </section>
    </div>
  );
}
