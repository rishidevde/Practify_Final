import { Link } from "react-router-dom";
import { useAppContext } from "../shared/AppContext";

export function NotFoundPage() {
  const { t } = useAppContext();
  return (
    <div className="landing">
      <section className="glass-card">
        <h1>404</h1>
        <p className="muted">{t("notFound")}</p>
        <Link to="/" className="cta-btn compact">
          {t("backHome")}
        </Link>
      </section>
    </div>
  );
}

