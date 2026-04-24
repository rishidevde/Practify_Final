import { useEffect, useMemo, useState } from "react";
import { Clock3, Flame, Gauge, Goal, Medal, Sparkles, Target, TrendingUp } from "lucide-react";
import { getAttempts, getMe, getQuizzes } from "../lib/api";
import { useAppContext } from "../shared/AppContext";

export function DashboardPage() {
  const { streak, t } = useAppContext();
  const [me, setMe] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    Promise.all([getMe(), getQuizzes(), getAttempts()])
      .then(([meData, qData, aData]) => {
        setMe(meData);
        setQuizzes(qData);
        setAttempts(aData);
      })
      .catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    const attempted = attempts.length;
    const avg = attempted ? Math.round(totalScore / attempted) : 0;
    const accuracy = attempted
      ? Math.round(
          (attempts.reduce((sum, a) => sum + a.correct, 0) /
            Math.max(
              1,
              attempts.reduce((sum, a) => sum + a.correct + a.wrong, 0),
            )) *
            100,
        )
      : 0;
    return { totalScore, attempted, avg, accuracy };
  }, [attempts]);

  const subjectBreakdown = useMemo(() => {
    const rows = [
      { subject: t("physics"), percent: Math.max(35, Math.min(92, stats.accuracy - 6)) },
      { subject: t("chemistry"), percent: Math.max(30, Math.min(90, stats.accuracy + 2)) },
      { subject: t("mathsBiology"), percent: Math.max(28, Math.min(94, stats.accuracy + 7)) },
    ];
    return rows;
  }, [stats.accuracy, t]);

  return (
    <div className="stack-lg">
      <section className="hero-banner glass-card premium-hero">
        <div className="hero-main">
          <p className="eyebrow">{t("welcomeBack")}</p>
          <h2>{me?.full_name || t("aspirant")}</h2>
          <p className="muted">
            {t("dailyGoalLine", { exam: me?.target_exam || "JEE" })}
          </p>
          <div className="hero-tags">
            <span>
              <Sparkles size={14} /> {t("realExamSim")}
            </span>
            <span>
              <TrendingUp size={14} /> {t("perfIntelligence")}
            </span>
          </div>
        </div>
        <div className="coin-pill">
          <Medal size={18} />
          {me?.coins ?? 0} {t("gems")}
        </div>
      </section>

      <section className="metrics-grid">
        <Metric title={t("attempts")} value={stats.attempted} icon={Target} />
        <Metric title={t("averageScore")} value={stats.avg} icon={Gauge} />
        <Metric title={t("accuracy")} value={`${stats.accuracy}%`} icon={Goal} />
        <Metric title={t("currentStreak")} value={t("days", { count: streak.currentStreak })} icon={Flame} />
      </section>

      <section className="dual-grid">
        <article className="glass-card elevated">
          <h3>{t("continuePractice")}</h3>
          <p className="muted">{t("relevantQuizzes")}</p>
          <div className="mini-list">
            {quizzes.slice(0, 5).map((quiz) => (
              <div className="mini-item" key={quiz.id}>
                <div>
                  <b>{quiz.title}</b>
                  <p>
                    {quiz.subject} • {quiz.topic}
                  </p>
                </div>
                <span>
                  {quiz.question_count} {t("questionsShort")}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card elevated">
          <h3>{t("readinessInsight")}</h3>
          <div className="insight-row">
            <Clock3 size={18} />
            <p>{t("speedInsight")}</p>
          </div>
          <div className="progress-block">
            <label>{t("confidenceMeter")}</label>
            <div className="progress-track">
              <div style={{ width: `${Math.min(95, Math.max(35, stats.accuracy))}%` }} />
            </div>
          </div>
        </article>
      </section>

      <section className="glass-card elevated">
        <h3>{t("subjectRadar")}</h3>
        <p className="muted">{t("momentumSnapshot")}</p>
        <div className="subject-bars">
          {subjectBreakdown.map((row) => (
            <div className="subject-row" key={row.subject}>
              <div className="subject-meta">
                <span>{row.subject}</span>
                <b>{row.percent}%</b>
              </div>
              <div className="progress-track">
                <div style={{ width: `${row.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value, icon: Icon }) {
  return (
    <article className="metric glass-card">
      <Icon size={20} />
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

