import { useEffect, useMemo, useState } from "react";
import { Clock3, Flame, Gauge, Goal, Medal, Target } from "lucide-react";
import { getAttempts, getMe, getQuizzes } from "../lib/api";
import { useAppContext } from "../shared/AppContext";

export function DashboardPage() {
  const { streak, t } = useAppContext();
  const [me, setMe] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [dailyReminderChecked, setDailyReminderChecked] = useState(false);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const targetSuggestions = useMemo(() => {
    const bundles = [
      ["Solve 30 MCQs", "Revise one weak topic", "Attempt 1 timed mini test"],
      ["Solve 20 MCQs", "Review yesterday's mistakes", "Read formula sheet for 20 mins"],
      ["Attempt 1 sectional quiz", "Practice 15 numericals", "Do 10 mins speed revision"],
      ["Solve 25 mixed questions", "Revisit marked concepts", "Practice accuracy (no guessing)"],
      ["Attempt 1 mock test", "Analyze wrong answers", "Revise 2 short notes"],
      ["Solve 35 concept questions", "Do 1 chapter recap", "Practice 10 PYQs"],
      ["Attempt 1 endurance set", "Fix one recurring error", "Quick revise important formulas"],
    ];
    const dayIndex = new Date(todayKey).getDay();
    return bundles[dayIndex] || bundles[0];
  }, [todayKey]);

  useEffect(() => {
    Promise.all([getMe(), getQuizzes(), getAttempts()])
      .then(([meData, qData, aData]) => {
        setMe(meData);
        setQuizzes(qData);
        setAttempts(aData);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`daily-target-done-${todayKey}`);
    setDailyReminderChecked(saved === "true");
  }, [todayKey]);

  useEffect(() => {
    localStorage.setItem(`daily-target-done-${todayKey}`, String(dailyReminderChecked));
  }, [dailyReminderChecked, todayKey]);

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
          <div className="daily-target-reminder">
            <b>Suggested Daily Targets</b>
            <ul className="daily-target-list">
              {targetSuggestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <label className="daily-target-check">
              <input
                type="checkbox"
                checked={dailyReminderChecked}
                onChange={(event) => setDailyReminderChecked(event.target.checked)}
              />
              <span>Mark today&apos;s target as done.</span>
            </label>
          </div>
        </div>
        <div className="coin-pill">
          <Medal size={18} />
          {me?.coins ?? 0} {t("gems")}
        </div>
      </section>

      <section className="metrics-grid">
        <Metric title={t("attempts")} value={stats.attempted} icon={<Target size={20} />} />
        <Metric title={t("averageScore")} value={stats.avg} icon={<Gauge size={20} />} />
        <Metric title={t("accuracy")} value={`${stats.accuracy}%`} icon={<Goal size={20} />} />
        <Metric title={t("currentStreak")} value={t("days", { count: streak.currentStreak })} icon={<Flame size={20} />} />
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

function Metric({ title, value, icon }) {
  return (
    <article className="metric glass-card">
      {icon}
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

