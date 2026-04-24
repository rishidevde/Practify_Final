import { useEffect, useMemo, useState } from "react";
import { CircleGauge, Flame, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { getAttempts } from "../lib/api";
import { computeStreak } from "../lib/streak";
import { useAppContext } from "../shared/AppContext";

export function ResultsPage() {
  const { state } = useLocation();
  const { t } = useAppContext();
  const [attempts, setAttempts] = useState([]);
  const [activeAttemptId, setActiveAttemptId] = useState(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    getAttempts().then(setAttempts).catch(() => {});
  }, []);

  const latest = state?.result || attempts[0];
  const activeAttempt = attempts.find((row) => row.id === activeAttemptId) || latest;
  const accuracy = latest
    ? Math.round((latest.correct / Math.max(1, latest.correct + latest.wrong)) * 100)
    : 0;
  const streak = useMemo(() => computeStreak(attempts), [attempts]);

  const previous = attempts[1];
  const previousAccuracy = previous
    ? Math.round((previous.correct / Math.max(1, previous.correct + previous.wrong)) * 100)
    : accuracy;
  const deltaScorePercent = previous?.score
    ? Math.round(((latest.score - previous.score) / Math.max(1, previous.score)) * 100)
    : 0;
  const trend = latest && previous ? (latest.score > previous.score ? "improving" : latest.score < previous.score ? "declining" : "stagnant") : "stagnant";

  const topicBreakdown = safeParse(activeAttempt?.topic_accuracy_json, []);
  const difficultyBreakdown = safeParse(activeAttempt?.difficulty_breakdown_json, []);
  const questionFeedback = safeParse(activeAttempt?.question_feedback_json, []);
  const verdict = getVerdict(t, accuracy, activeAttempt?.score || 0, activeAttempt?.skipped || 0);
  const localizeMistakeTag = (tag) => {
    if (!tag) return tag;
    if (tag === "Conceptual error") return t("conceptualError");
    if (tag === "Silly mistake") return t("sillyMistake");
    if (tag === "Time pressure") return t("timePressure");
    return tag;
  };

  const bestTopics = useMemo(() => {
    return [...topicBreakdown]
      .filter((r) => typeof r?.accuracy === "number" && r?.topic)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 3);
  }, [topicBreakdown]);

  const weakTopics = useMemo(() => {
    return [...topicBreakdown]
      .filter((r) => typeof r?.accuracy === "number" && r?.topic)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);
  }, [topicBreakdown]);

  const timeSummary = useMemo(() => {
    const avg = Math.round(activeAttempt?.avg_time_per_question || 0);
    const correct = activeAttempt?.time_correct_seconds || 0;
    const wrong = activeAttempt?.time_wrong_seconds || 0;
    const total = activeAttempt?.time_taken_seconds || 0;
    return { avg, correct, wrong, total };
  }, [activeAttempt]);

  return (
    <div className="stack-lg">
      <section className="glass-card premium-hero">
        <h2>{t("feedback")}</h2>
        <p className="muted">{t("improveSteps")}</p>
        <div className="hero-tags">
          <span>
            <Trophy size={14} /> {t("performanceSnapshot")}
          </span>
          <span>
            <CircleGauge size={14} /> {t("speedAccuracy")}
          </span>
        </div>
      </section>

      {!latest ? <section className="glass-card">{t("noAttempts")}</section> : null}

      {latest ? (
        <>
          <section className="glass-card">
            <h3>🟢 {t("resultSection")}</h3>
            <div className="metrics-grid" style={{ marginTop: "0.75rem" }}>
              <Result title={t("score")} value={latest.score} />
              <Result title={t("correct")} value={latest.correct} />
              <Result title={t("wrong")} value={latest.wrong} />
              <Result title={t("skipped")} value={latest.skipped} />
            </div>
            <p className={`feedback-chip ${verdict.tone}`} style={{ marginTop: "0.75rem" }}>
              {t("overall")}: {verdict.label}
            </p>
          </section>

          <section className="glass-card">
            <h3>📊 {t("performanceSection")}</h3>
            <div className="result-focus" style={{ marginTop: "0.75rem" }}>
              <div className="result-ring" aria-label="Accuracy">
                <div>
                  <b>{accuracy}%</b>
                  <span>{t("accuracy")}</span>
                </div>
              </div>
              <div className="stack" style={{ gap: "0.6rem" }}>
                <div className="mini-item">
                  <span>{t("scoreTrend")}</span>
                  <span>
                    {deltaScorePercent < 0 ? "-" : "+"}
                    {Math.abs(deltaScorePercent)}%{" "}
                    {trend === "improving" ? <TrendingUp size={16} /> : trend === "declining" ? <TrendingDown size={16} /> : "—"}
                  </span>
                </div>
                <div className="mini-item">
                  <span>{t("percentileEstimate")}</span>
                  <span>{latest.percentile ?? "--"}</span>
                </div>
                {bestTopics.length ? (
                  <div className="mini-item">
                    <span>{t("strongAreas")}</span>
                    <span>{bestTopics.map((t) => t.topic).join(", ")}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="glass-card">
            <h3>⏱️ {t("timeSection")}</h3>
            <div className="mini-list" style={{ marginTop: "0.75rem" }}>
              <div className="mini-item">
                <span>{t("totalTime")}</span>
                <span>{Math.round((timeSummary.total || 0) / 60)} min</span>
              </div>
              <div className="mini-item">
                <span>{t("avgTimePerQuestion")}</span>
                <span>{timeSummary.avg} sec</span>
              </div>
              <div className="mini-item">
                <span>{t("timeOnCorrectWrong")}</span>
                <span>
                  {timeSummary.correct}s / {timeSummary.wrong}s
                </span>
              </div>
            </div>
          </section>

          <section className="glass-card">
            <h3>📚 {t("whatToFix")}</h3>
            <div className="mini-list" style={{ marginTop: "0.75rem" }}>
              <div className="mini-item">
                <span>{t("bigMessage")}</span>
                <span>{verdict.message}</span>
              </div>
              <div className="mini-item">
                <span>{t("stopNegativeMarks")}</span>
                <span>
                  {t("wrongCountAdvice", { count: latest.wrong })}
                </span>
              </div>
              {weakTopics.length ? (
                <div className="mini-item">
                  <span>{t("weakTopics")}</span>
                  <span>{weakTopics.map((t) => `${t.topic} (${t.accuracy}%)`).join(", ")}</span>
                </div>
              ) : null}
              {difficultyBreakdown?.length ? (
                <div className="mini-item">
                  <span>{t("difficultyCheck")}</span>
                  <span>
                    {t("easy")}: {difficultyBreakdown.find((d) => d.difficulty === "Easy")?.accuracy ?? "--"}% •{" "}
                    {t("medium")}: {difficultyBreakdown.find((d) => d.difficulty === "Medium")?.accuracy ?? "--"}% •{" "}
                    {t("hard")}: {difficultyBreakdown.find((d) => d.difficulty === "Hard")?.accuracy ?? "--"}%
                  </span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="glass-card">
            <h3>🔁 {t("reviewButtonSection")}</h3>
            <div className="inline-actions" style={{ marginTop: "0.75rem" }}>
              <button className="cta-btn compact" type="button" onClick={() => setShowReview((s) => !s)}>
                {showReview ? t("hideReview") : t("reviewQuestions")}
              </button>
              <Link className="ghost-btn compact" to="/practice">
                {t("continuePracticeBtn")}
              </Link>
            </div>
          </section>

          {showReview ? (
            <>
              {questionFeedback.length ? (
                <section className="glass-card">
                  <h3>{t("review")}</h3>
                  <div className="mini-list">
                    {questionFeedback.slice(0, 20).map((q) => (
                      <article
                        key={q.questionId}
                        className={`mini-item ${q.isCorrect ? "metric-good" : q.skipped ? "metric-mid" : "metric-bad"}`}
                      >
                        <div>
                          <b>
                            Q{q.questionId} ({q.topic} • {q.difficulty})
                          </b>
                          <p>
                            {t("yourAnswer")}: {q.yourAnswer || t("skippedLabel")} | {t("correctAnswer")}: {q.correctAnswer}
                          </p>
                          <p>{q.explanation}</p>
                        </div>
                        <span>
                          {localizeMistakeTag(q.mistakeTag) ||
                            (q.isCorrect ? t("correct") : q.skipped ? t("skippedLabel") : t("wrongLabel"))}
                        </span>
                      </article>
                    ))}
                  </div>
                </section>
              ) : (
                <section className="glass-card">{t("noReviewData")}</section>
              )}

              <section className="glass-card">
                <h3>{t("recentAttempts")}</h3>
                <div className="mini-list">
                  {attempts.map((a) => (
                    <button
                      key={a.id}
                      className="mini-item attempt-item-btn"
                      onClick={() => {
                        setActiveAttemptId(a.id);
                        setShowReview(false);
                      }}
                    >
                      <div>
                        <b>{t("attemptNumber", { count: a.id })}</b>
                        <p>{t("quizIdLabel", { count: a.quiz_id })}</p>
                      </div>
                      <span>{a.score}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </>
      ) : null}

    </div>
  );
}

function safeParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getVerdict(t, accuracy, score, skipped) {
  if (accuracy >= 82 && score >= 55) {
    return { label: t("verdict_excellent"), tone: "metric-good", message: t("verdict_excellent_msg") };
  }
  if (accuracy >= 62 && score >= 35) {
    return { label: t("verdict_good"), tone: "metric-good", message: t("verdict_good_msg") };
  }
  if (accuracy >= 40) {
    return {
      label: t("verdict_average"),
      tone: "metric-mid",
      message: t("verdict_average_msg", { count: skipped }),
    };
  }
  return {
    label: t("verdict_poor"),
    tone: "metric-bad",
    message: t("verdict_poor_msg", { count: skipped }),
  };
}

function Result({ title, value }) {
  return (
    <article className="metric glass-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

