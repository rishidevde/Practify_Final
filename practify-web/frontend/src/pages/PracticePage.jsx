import { useEffect, useMemo, useState } from "react";
import { BookOpen, Heart, Search, TimerReset, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { getMe, getQuizzes } from "../lib/api";
import { useAppContext } from "../shared/AppContext";

export function PracticePage() {
  const { wishlist, toggleWishlist, t } = useAppContext();
  const [me, setMe] = useState(null);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All");

  useEffect(() => {
    Promise.all([getMe(), getQuizzes()]).then(([meData, quizData]) => {
      setMe(meData);
      setAllQuizzes(quizData);
    });
  }, []);

  const subjects = useMemo(
    () => ["All", ...new Set(allQuizzes.map((q) => q.subject))],
    [allQuizzes],
  );

  const quizzes = useMemo(() => {
    return allQuizzes.filter((q) => {
      const bySubject = subject === "All" || q.subject === subject;
      const text = `${q.title} ${q.subject} ${q.topic}`.toLowerCase();
      const byQuery = text.includes(query.toLowerCase());
      const byExam = me?.target_exam ? q.exam === me.target_exam : true;
      return bySubject && byQuery && byExam;
    });
  }, [allQuizzes, subject, query, me?.target_exam]);

  return (
    <div className="stack-lg">
      <section className="glass-card premium-hero">
        <h2>{t("practiceArena")}</h2>
        <p className="muted">
          {t("practiceIntro", { exam: me?.target_exam || t("targetExam") })}
        </p>
        <div className="hero-tags">
          <span>
            <BookOpen size={14} /> {t("topicWise")}
          </span>
          <span>
            <TimerReset size={14} /> {t("timedMode")}
          </span>
        </div>
      </section>

      <section className="glass-card">
        <div className="filters">
          <label className="search-wrap">
            <Search size={16} />
            <input
              value={query}
              placeholder={t("search")}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            {subjects.map((s) => (
              <option key={s}>{s === "All" ? t("all") : s}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="quiz-grid">
        {quizzes.map((quiz) => (
          <article className="quiz-card glass-card elevated" key={quiz.id}>
            <div className="quiz-chip">
              <Zap size={14} />
              {quiz.difficulty}
            </div>
            <h3>{quiz.title}</h3>
            <p>
              {quiz.subject} • {quiz.topic}
            </p>
            <div className="quiz-meta">
              <span>
                {quiz.question_count} {t("questions")}
              </span>
              <span>
                {Math.round(quiz.time_limit_seconds / 60)} {t("mins")}
              </span>
            </div>
            <Link to={`/quiz/${quiz.id}`} state={{ quiz }} className="cta-btn compact">
              {t("startQuiz")}
            </Link>
            <button className="ghost-btn compact" onClick={() => toggleWishlist(quiz.id)}>
              <Heart size={14} />
              {wishlist.some((item) => item.quiz_id === quiz.id) ? t("remove") : t("save")}
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

