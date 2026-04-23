import { Heart, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getQuizzes } from "../lib/api";
import { useAppContext } from "../shared/AppContext";

export function WishlistPage() {
  const { wishlist, toggleWishlist, t } = useAppContext();
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    getQuizzes().then(setQuizzes).catch(() => {});
  }, []);

  const items = useMemo(() => {
    const ids = new Set(wishlist.map((item) => item.quiz_id));
    return quizzes.filter((quiz) => ids.has(quiz.id));
  }, [wishlist, quizzes]);

  return (
    <div className="stack-lg">
      <section className="glass-card premium-hero">
        <h2>{t("wishlist")}</h2>
        <p className="muted">{t("wishlistIntro")}</p>
      </section>

      {!items.length ? (
        <section className="glass-card">{t("noWishlist")}</section>
      ) : (
        <section className="quiz-grid">
          {items.map((quiz) => (
            <article className="quiz-card glass-card elevated" key={quiz.id}>
              <div className="quiz-chip">
                <Heart size={14} />
                {t("saved")}
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
              <div className="inline-actions">
                <Link to={`/quiz/${quiz.id}`} state={{ quiz }} className="cta-btn compact">
                  {t("startQuiz")}
                </Link>
                <button className="ghost-btn compact" onClick={() => toggleWishlist(quiz.id)}>
                  <Trash2 size={14} /> {t("remove")}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
