import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "./AppContext";

export function GlobalSearch({ quizzes = [] }) {
  const { t } = useAppContext();
  const [query, setQuery] = useState("");
  const staticContent = useMemo(
    () => [
      { id: "c1", label: t("search_dashboard_overview"), to: "/dashboard", kind: t("content") },
      { id: "c2", label: t("search_practice_quizzes"), to: "/practice", kind: t("content") },
      { id: "c3", label: t("search_leaderboard_ranks"), to: "/leaderboard", kind: t("content") },
      { id: "c4", label: t("search_profile_settings"), to: "/profile", kind: t("content") },
    ],
    [t],
  );
  const source = useMemo(
    () => [
      ...quizzes.map((quiz) => ({
        id: `q-${quiz.id}`,
        label: `${quiz.title} (${quiz.subject} - ${quiz.topic})`,
        to: `/quiz/${quiz.id}`,
        kind: t("quizKind"),
      })),
      ...staticContent,
    ],
    [quizzes, staticContent, t],
  );

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return source.filter((item) => item.label.toLowerCase().includes(lower)).slice(0, 7);
  }, [query, source]);

  function renderHighlighted(text) {
    const term = query.trim();
    if (!term) return text;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx < 0) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + term.length);
    const after = text.slice(idx + term.length);
    return (
      <>
        {before}
        <mark>{match}</mark>
        {after}
      </>
    );
  }

  return (
    <div className="global-search">
      <label className="search-wrap">
        <Search size={16} />
        <input
          value={query}
          placeholder={t("search")}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {suggestions.length ? (
        <div className="search-suggestions glass-card">
          {suggestions.map((item) => (
            <Link key={item.id} to={item.to} onClick={() => setQuery("")} className="search-item">
              <span>{renderHighlighted(item.label)}</span>
              <small>{item.kind}</small>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
