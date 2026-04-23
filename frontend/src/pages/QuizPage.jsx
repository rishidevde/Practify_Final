import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { createAttempt, getQuizzes } from "../lib/api";
import { buildMockQuestions } from "../lib/quiz";
import { useAppContext } from "../shared/AppContext";

export function QuizPage() {
  const { refreshAttempts, t } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(location.state?.quiz || null);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState(() => new Set());
  const [visited, setVisited] = useState(() => new Set());
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("rules"); // rules | exam | submitted
  const [timeLeftSec, setTimeLeftSec] = useState(null);
  const [proctoredMode, setProctoredMode] = useState(true);
  const [proctorCamReady, setProctorCamReady] = useState(false);
  const [proctorCamError, setProctorCamError] = useState("");
  const startTsRef = useRef(null);
  const submittedRef = useRef(false);
  const proctorVideoRef = useRef(null);
  const proctorStreamRef = useRef(null);

  useEffect(() => {
    if (quiz) return;
    getQuizzes().then((items) => {
      const found = items.find((q) => String(q.id) === String(quizId));
      setQuiz(found || null);
    });
  }, [quiz, quizId]);

  const questions = useMemo(() => buildMockQuestions(quiz), [quiz]);
  const activeQ = questions[activeIdx];
  const [notice, setNotice] = useState("");
  const isNeetSectional =
    quiz?.title === "NEET Physics Sectional Mock Test" || quiz?.title === "NEET Chemistry Sectional Mock Test";
  const sectionBLimit = isNeetSectional ? 10 : null;
  const solved = useMemo(() => {
    return questions.reduce((count, q) => {
      const v = answers[q.id];
      if (q.type === "multi") return count + (Array.isArray(v) && v.length ? 1 : 0);
      if (q.type === "numerical") return count + (typeof v === "string" && v.trim() ? 1 : 0);
      return count + (typeof v === "number" ? 1 : 0);
    }, 0);
  }, [answers, questions]);

  useEffect(() => {
    if (!quiz) return;
    setTimeLeftSec(quiz.time_limit_seconds);
  }, [quiz]);

  useEffect(() => {
    if (phase !== "exam") return;
    if (!quiz) return;
    if (timeLeftSec === null) return;

    const interval = setInterval(() => {
      setTimeLeftSec((prev) => {
        const next = Math.max(0, (prev ?? quiz.time_limit_seconds) - 1);
        if (next === 0 && !submittedRef.current) {
          submittedRef.current = true;
          submitQuiz({ auto: true });
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, quiz]);

  useEffect(() => {
    if (phase !== "exam") return;
    if (!activeQ) return;
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(activeQ.id);
      return next;
    });
  }, [phase, activeQ?.id]);

  useEffect(() => {
    if (phase !== "exam" || !proctoredMode) return undefined;

    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        setNotice("Proctored mode: stay on the quiz tab.");
      }
    };
    const block = (event) => event.preventDefault();
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("copy", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", block);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("copy", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", block);
    };
  }, [phase, proctoredMode]);

  useEffect(() => {
    document.body.classList.toggle("exam-mode-active", phase === "exam");
    return () => document.body.classList.remove("exam-mode-active");
  }, [phase]);

  useEffect(() => {
    return () => {
      if (proctorStreamRef.current) {
        proctorStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== "exam") return;
    if (proctorVideoRef.current && proctorStreamRef.current) {
      proctorVideoRef.current.srcObject = proctorStreamRef.current;
    }
  }, [phase]);

  if (!quiz) return <div className="glass-card">{t("loadingQuiz")}</div>;

  function formatTime(totalSeconds) {
    const sec = Math.max(0, totalSeconds || 0);
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function startExam() {
    submittedRef.current = false;
    setPhase("exam");
    startTsRef.current = Date.now();
    setActiveIdx(0);
    setVisited(new Set());
    setMarked(new Set());
    setAnswers({});
    setNotice("");
    setTimeLeftSec(quiz.time_limit_seconds);
    if (proctoredMode && !proctorCamReady) {
      setProctorCamError("Enable camera for proctoring before starting exam mode.");
      return;
    }
    if (proctoredMode && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setProctorCamError("");
  }

  async function enableProctorCamera() {
    try {
      setProctorCamError("");
      if (!proctorStreamRef.current) {
        proctorStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      if (proctorVideoRef.current) {
        proctorVideoRef.current.srcObject = proctorStreamRef.current;
      }
      setProctorCamReady(true);
    } catch {
      setProctorCamError("Unable to access camera. Please allow camera permission.");
      setProctorCamReady(false);
    }
  }

  async function submitQuiz({ auto = false } = {}) {
    if (loading) return;
    setLoading(true);
    setPhase("submitted");
    try {
      let correct = 0;
      let score = 0;
      let timeCorrectSeconds = 0;
      let timeWrongSeconds = 0;
      const topicRollup = {};
      const difficultyRollup = {};
      const questionFeedback = [];
      let maxScore = 0;

      const letters = ["A", "B", "C", "D", "E", "F"];
      const sameArray = (a, b) =>
        Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => x === b[i]);
      const toSuperscript = (digit) => {
        const map = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
        return map[digit] ?? digit;
      };
      const normalizeNumberText = (raw) => {
        if (raw == null) return "";
        let s = String(raw).trim();
        if (!s) return "";
        s = s
          .replaceAll("−", "-")
          .replaceAll("–", "-")
          .replaceAll("—", "-")
          .replaceAll("×", "x")
          .replaceAll("·", ".")
          .replace(/\s+/g, "");

        // Convert common superscripts (including ²³) into ^ form
        const superscripts = {
          "⁰": "0",
          "¹": "1",
          "²": "2",
          "³": "3",
          "⁴": "4",
          "⁵": "5",
          "⁶": "6",
          "⁷": "7",
          "⁸": "8",
          "⁹": "9",
        };
        s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (m) => superscripts[m] ?? m);

        // Allow "10^-3" or "10^ -3"
        s = s.replace(/10\^(-?\d+)/i, "1e$1");

        // Allow "a x 10^b"
        const sci = s.match(/^([+-]?\d+(\.\d+)?)(x10\^([+-]?\d+))$/i);
        if (sci) {
          const base = Number(sci[1]);
          const exp = Number(sci[4]);
          if (Number.isFinite(base) && Number.isFinite(exp)) return String(base * 10 ** exp);
        }

        return s;
      };
      const parseNumeric = (raw) => {
        const s = normalizeNumberText(raw);
        if (!s) return null;
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
      };
      const numbersClose = (a, b) => {
        if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
        if (a === b) return true;
        const diff = Math.abs(a - b);
        const scale = Math.max(1, Math.abs(a), Math.abs(b));
        return diff / scale <= 1e-9;
      };
      const formatMulti = (q, idxs) => {
        if (!Array.isArray(idxs) || !idxs.length) return null;
        return idxs
          .map((i) => {
            const label = letters[i] ?? String(i + 1);
            const opt = q.options?.[i];
            return opt ? `${label}. ${opt}` : label;
          })
          .join(", ");
      };
      const formatSingle = (q, idx) => {
        if (typeof idx !== "number") return null;
        const label = letters[idx] ?? String(idx + 1);
        const opt = q.options?.[idx];
        return opt ? `${label}. ${opt}` : label;
      };

      questions.forEach((q) => {
        const selected = answers[q.id];
        const isSkipped =
          q.type === "multi"
            ? !Array.isArray(selected) || selected.length === 0
            : q.type === "numerical"
              ? typeof selected !== "string" || !selected.trim()
              : selected === undefined;

        const isCorrect =
          q.type === "multi"
            ? sameArray(
                [...(selected || [])].slice().sort((a, b) => a - b),
                [...(q.answerIndices || [])].slice().sort((a, b) => a - b),
              )
            : q.type === "numerical"
              ? numbersClose(parseNumeric(selected), Number(q.answerValue))
              : selected === q.answer;

        const baseTime = Math.max(18, Math.round((quiz.time_limit_seconds / questions.length) * 0.95));
        const timeSpent = isSkipped ? Math.round(baseTime * 0.45) : isCorrect ? baseTime : Math.round(baseTime * 1.2);

        if (isCorrect) correct += 1;
        if (isCorrect) timeCorrectSeconds += timeSpent;
        else if (!isSkipped) timeWrongSeconds += timeSpent;

        if (!topicRollup[q.topic]) topicRollup[q.topic] = { total: 0, correct: 0 };
        topicRollup[q.topic].total += 1;
        if (isCorrect) topicRollup[q.topic].correct += 1;

        if (!difficultyRollup[q.difficulty]) difficultyRollup[q.difficulty] = { total: 0, correct: 0 };
        difficultyRollup[q.difficulty].total += 1;
        if (isCorrect) difficultyRollup[q.difficulty].correct += 1;

        const marks = Number(q.marks ?? 4);
        const negative = Number(q.negative ?? 0);
        maxScore += marks;
        if (isCorrect) score += marks;
        else if (!isSkipped) score -= negative;

        let mistakeTag = null;
        if (!isSkipped && !isCorrect) {
          if (timeSpent > baseTime * 1.1) mistakeTag = "Conceptual error";
          else if (q.type === "single" && selected === (q.answer + 1) % 4) mistakeTag = "Silly mistake";
          else mistakeTag = "Time pressure";
        }

        questionFeedback.push({
          questionId: q.id,
          topic: q.topic,
          difficulty: q.difficulty,
          yourAnswer: isSkipped
            ? null
            : q.type === "numerical"
              ? String(selected).trim()
              : q.type === "multi"
                ? formatMulti(q, selected)
                : formatSingle(q, selected),
          correctAnswer:
            q.type === "numerical"
              ? String(q.answerValue)
              : q.type === "multi"
                ? formatMulti(q, q.answerIndices)
                : formatSingle(q, q.answer),
          isCorrect,
          skipped: isSkipped,
          explanation: q.explanation,
          mistakeTag,
          timeSpent,
        });
      });
      const wrong = solved - correct;
      const skipped = questions.length - solved;
      score = Math.max(0, Math.round(score));
      const attemptedQuestions = solved;
      const avgTimePerQuestion = Number((quiz.time_limit_seconds / questions.length).toFixed(1));
      const goalScore = Math.round(maxScore * 0.72);
      const topicAccuracy = Object.entries(topicRollup).map(([topic, row]) => ({
        topic,
        accuracy: Math.round((row.correct / Math.max(1, row.total)) * 100),
        total: row.total,
      }));
      const difficultyBreakdown = Object.entries(difficultyRollup).map(([difficulty, row]) => ({
        difficulty,
        accuracy: Math.round((row.correct / Math.max(1, row.total)) * 100),
        total: row.total,
      }));
      const behaviorInsights = [
        skipped > questions.length * 0.35 ? "You skip too many questions early." : null,
        wrong > correct ? "You rush in the first half of the quiz." : null,
        timeWrongSeconds > timeCorrectSeconds
          ? "You spent too long on questions answered incorrectly."
          : "You used time better on correct questions.",
      ].filter(Boolean);
      const recommendations = [
        skipped > 8 ? `You skipped ${skipped} questions - attempt at least ${Math.min(10, questions.length)} next time.` : null,
        correct === 0 ? "Your accuracy is 0% - slow down and focus on understanding." : null,
        wrong > correct ? "Practice time management drills and avoid guessing early." : null,
        "Retry wrong questions, then practice skipped questions.",
      ].filter(Boolean);

      const result = await createAttempt({
        quiz_id: quiz.id,
        score,
        correct,
        wrong,
        skipped,
        time_taken_seconds: Math.min(
          quiz.time_limit_seconds,
          Math.max(1, Math.round(((Date.now() - (startTsRef.current || Date.now())) / 1000) * 1)),
        ),
        attempted_questions: attemptedQuestions,
        max_score: maxScore,
        goal_score: goalScore,
        avg_time_per_question: avgTimePerQuestion,
        time_correct_seconds: timeCorrectSeconds,
        time_wrong_seconds: timeWrongSeconds,
        topic_accuracy_json: JSON.stringify(topicAccuracy),
        difficulty_breakdown_json: JSON.stringify(difficultyBreakdown),
        question_feedback_json: JSON.stringify(questionFeedback),
        behavior_insights_json: JSON.stringify(behaviorInsights),
        recommendations_json: JSON.stringify(recommendations),
      });
      refreshAttempts();

      // brief transition to show SUBMITTED ✅
      setTimeout(() => {
        navigate("/results", { state: { result, quiz, auto_submitted: auto } });
      }, 700);
    } finally {
      setLoading(false);
    }
  }

  function saveAndNext() {
    if (!activeQ) return;
    if (activeIdx >= questions.length - 1) {
      submittedRef.current = true;
      submitQuiz({ auto: false });
      return;
    }
    setActiveIdx((i) => Math.min(questions.length - 1, i + 1));
  }

  function previous() {
    setActiveIdx((i) => Math.max(0, i - 1));
  }

  function toggleMark() {
    if (!activeQ) return;
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(activeQ.id)) next.delete(activeQ.id);
      else next.add(activeQ.id);
      return next;
    });
  }

  function trackerClass(qId) {
    if (marked.has(qId)) return "qt-item qt-marked";
    const q = questions.find((x) => x.id === qId);
    const v = answers[qId];
    const answered =
      q?.type === "multi"
        ? Array.isArray(v) && v.length
        : q?.type === "numerical"
          ? typeof v === "string" && v.trim()
          : v !== undefined;
    if (answered) return "qt-item qt-answered";
    if (visited.has(qId)) return "qt-item qt-visited";
    return "qt-item";
  }

  function toggleMulti(optionIdx) {
    if (!activeQ) return;
    setAnswers((prev) => {
      const current = Array.isArray(prev[activeQ.id]) ? prev[activeQ.id] : [];
      const set = new Set(current);
      if (set.has(optionIdx)) set.delete(optionIdx);
      else set.add(optionIdx);
      return { ...prev, [activeQ.id]: [...set].sort((a, b) => a - b) };
    });
  }

  useEffect(() => {
    if (!isNeetSectional) return;
    // Clear any stale notice when moving questions
    setNotice("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQ?.id]);

  function countAnsweredInSection(section) {
    const ids = new Set(questions.filter((q) => q.section === section).map((q) => q.id));
    return Object.entries(answers).reduce((count, [k, v]) => {
      const qid = Number(k);
      if (!ids.has(qid)) return count;
      const q = questions.find((x) => x.id === qid);
      if (q?.type === "multi") return count + (Array.isArray(v) && v.length ? 1 : 0);
      if (q?.type === "numerical") return count + (typeof v === "string" && v.trim() ? 1 : 0);
      return count + (typeof v === "number" ? 1 : 0);
    }, 0);
  }

  function setSingleAnswer(q, idx) {
    setNotice("");
    if (isNeetSectional && q?.section === "B" && sectionBLimit) {
      const alreadyAnswered = typeof answers[q.id] === "number";
      const answeredInB = countAnsweredInSection("B");
      if (!alreadyAnswered && answeredInB >= sectionBLimit) {
        setNotice(t("sectionBLimitReached", { count: sectionBLimit }));
        return;
      }
    }
    setAnswers((s) => ({ ...s, [q.id]: idx }));
  }

  return (
    <div className="exam-wrap">
      {phase === "rules" ? (
        <section className="glass-card exam-rules">
          <h2>{quiz.title}</h2>
          <div className="mini-list" style={{ marginTop: "0.75rem" }}>
            <div className="mini-item">
              <span>{t("totalQuestions")}</span>
              <span>
                <b>{questions.length}</b>
              </span>
            </div>
            <div className="mini-item">
              <span>{t("time")}</span>
              <span>
                <b>{t("minutes", { count: Math.round(quiz.time_limit_seconds / 60) })}</b>
              </span>
            </div>
            <div className="mini-item">
              <span>{t("wrongAnswer")}</span>
              <span>
                <b>{t("negativeMark")}</b>
              </span>
            </div>
          </div>
          <button className="cta-btn" type="button" onClick={startExam} style={{ marginTop: "0.9rem" }}>
            {t("startTest")}
          </button>
          <label className="proctored-toggle">
            <input
              type="checkbox"
              checked={proctoredMode}
              onChange={(event) => setProctoredMode(event.target.checked)}
            />
            <span>Enable proctored mode while attempting quiz</span>
          </label>
          {proctoredMode ? (
            <div className="proctor-setup">
              <button className="ghost-btn compact" type="button" onClick={enableProctorCamera}>
                {proctorCamReady ? "Camera enabled" : "Enable camera for proctoring"}
              </button>
              {proctorCamError ? <p className="muted">{proctorCamError}</p> : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {phase === "submitted" ? (
        <section className="glass-card exam-submitted" aria-live="polite">
          <h2>{t("submitted")}</h2>
          <p className="muted">{loading ? t("savingResult") : t("openingFeedback")}</p>
        </section>
      ) : null}

      {phase === "exam" ? (
        <div className="exam-screen">
          <header className="exam-topbar">
            <div className="exam-timer">
              <span className="muted">{t("timeLeft")}</span> <b>{formatTime(timeLeftSec)}</b>
            </div>
          </header>

          <main className="exam-main">
            <section className="exam-question glass-card">
              <h3>
                Q{activeQ?.id}. {activeQ?.question}
              </h3>
              {activeQ?.type === "numerical" ? (
                <div style={{ marginTop: "0.85rem" }}>
                  <input
                    inputMode="decimal"
                    placeholder={t("enterNumerical")}
                    value={answers[activeQ.id] ?? ""}
                    onChange={(e) => setAnswers((s) => ({ ...s, [activeQ.id]: e.target.value }))}
                  />
                  <p className="muted" style={{ margin: "0.55rem 0 0" }}>
                    {t("marksLabel")}: <b>{activeQ.marks}</b> • {t("negativeLabel")}: <b>{activeQ.negative}</b>
                  </p>
                </div>
              ) : (
                <div className="exam-options">
                  {(activeQ?.options || []).map((option, idx) => {
                    const checked =
                      activeQ?.type === "multi"
                        ? Array.isArray(answers[activeQ.id]) && answers[activeQ.id].includes(idx)
                        : answers[activeQ.id] === idx;
                    return (
                      <button
                        key={`${activeQ.id}-${idx}`}
                        type="button"
                        className={checked ? "exam-opt active" : "exam-opt"}
                        onClick={() =>
                          activeQ?.type === "multi"
                            ? toggleMulti(idx)
                            : setSingleAnswer(activeQ, idx)
                        }
                      >
                        <span className="exam-radio">
                          {activeQ?.type === "multi" ? (checked ? "[✓]" : "[ ]") : checked ? "(•)" : "( )"}
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {notice ? (
                <p className="muted" style={{ margin: "0.7rem 0 0" }}>
                  {notice}
                </p>
              ) : null}

              <div className="exam-actions">
                <button className="cta-btn" type="button" onClick={saveAndNext} disabled={loading}>
                  {t("saveNext")}
                </button>
                <button className="ghost-btn" type="button" onClick={toggleMark} disabled={loading}>
                  {t("mark")}
                </button>
                <button className="ghost-btn" type="button" onClick={previous} disabled={loading}>
                  {t("previous")}
                </button>
              </div>
            </section>

            <section className="exam-tracker glass-card" aria-label={t("questionTracker")}>
              <div className="qt-grid">
                {questions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    className={trackerClass(q.id)}
                    onClick={() => setActiveIdx(q.id - 1)}
                    aria-label={t("questionAria", { count: q.id })}
                  >
                    {q.id}
                  </button>
                ))}
              </div>
            </section>
          </main>
          {proctoredMode ? (
            <aside className="proctor-cam-preview" aria-label="Proctor camera preview">
              <video ref={proctorVideoRef} autoPlay playsInline muted />
            </aside>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

