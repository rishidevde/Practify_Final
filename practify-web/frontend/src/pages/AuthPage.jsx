import { useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { login, sendOtp, signup } from "../lib/api";
import { getToken, setToken } from "../lib/auth";
import { useAppContext } from "../shared/AppContext";

export function AuthPage() {
  const navigate = useNavigate();
  const { t } = useAppContext();
  const homeTarget = getToken() ? "/dashboard" : "/";
  const [mode, setMode] = useState("signup");
  const [stage, setStage] = useState("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [challengeId, setChallengeId] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    target_exam: "JEE",
    otp: "",
  });

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const canRequestOtp = useMemo(() => {
    const phoneOk = form.phone.trim().length >= 10;
    const passwordOk = form.password.length >= 6;
    if (mode === "signup") {
      return phoneOk && passwordOk && form.full_name.trim().length >= 2;
    }
    return phoneOk && passwordOk;
  }, [form, mode]);

  const parseError = (err, fallback) => {
    const detail = err?.response?.data?.detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
    if (typeof detail === "string") return detail;
    return fallback;
  };

  const examMeta = useMemo(
    () => ({
      JEE: {
        title: "JEE",
        desc: t("exam_jee_desc"),
        points: [t("exam_jee_p1"), t("exam_jee_p2"), t("exam_jee_p3")],
      },
      NEET: {
        title: "NEET",
        desc: t("exam_neet_desc"),
        points: [t("exam_neet_p1"), t("exam_neet_p2"), t("exam_neet_p3")],
      },
      GATE: {
        title: "GATE",
        desc: t("exam_gate_desc"),
        points: [t("exam_gate_p1"), t("exam_gate_p2"), t("exam_gate_p3")],
      },
      "NDA/CDS": {
        title: "NDA/CDS",
        desc: t("exam_nda_desc"),
        points: [t("exam_nda_p1"), t("exam_nda_p2"), t("exam_nda_p3")],
      },
      // Backward-compatible server value. If an old user has "NDA" saved, we still show NDA/CDS guidance.
      NDA: {
        title: "NDA/CDS",
        desc: t("exam_nda_desc"),
        points: [t("exam_nda_p1"), t("exam_nda_p2"), t("exam_nda_p3")],
      },
    }),
    [t],
  );

  async function requestOtp(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await sendOtp(form.phone.trim(), mode);
      setChallengeId(data.challenge_id);
      setOtpHint(data.dev_otp);
      setStage("verify");
    } catch (err) {
      setError(parseError(err, t("unableToSendOtp")));
    } finally {
      setLoading(false);
    }
  }

  async function submitAuth(e) {
    e.preventDefault();
    if (!challengeId) return;
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        phone: form.phone.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        otp: form.otp.trim(),
        challenge_id: challengeId,
      };
      const data =
        mode === "signup"
          ? await signup(payload)
          : await login({
              phone: form.phone.trim(),
              password: form.password,
              challenge_id: challengeId,
              otp: form.otp.trim(),
            });
      setToken(data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(parseError(err, t("authenticationFailed")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen auth-screen-centered">
      <div className="auth-main-row">
        <section className="auth-left">
          <Link to={homeTarget} aria-label={t("goHomeAria")}>
            <img src="/logo.png" alt="Practify Logo" className="auth-logo" />
          </Link>
          <div className="tag">{t("indiaTagline")}</div>
          <h1>
            {t("authConnect")}
            <br />
            {t("authCompete")}
            <br />
            {t("authConquer")}
          </h1>
        </section>

        <section className="auth-card glass-card">
          <div className="auth-toggle">
            <button
              className={mode === "signup" ? "active" : ""}
              type="button"
              onClick={() => {
                setMode("signup");
                setStage("request");
                setChallengeId(null);
                update("otp", "");
                setError("");
              }}
            >
              {t("signUp")}
            </button>
            <button
              className={mode === "login" ? "active" : ""}
              type="button"
              onClick={() => {
                setMode("login");
                setStage("request");
                setChallengeId(null);
                update("otp", "");
                setError("");
              }}
            >
              {t("loginVerb")}
            </button>
          </div>

          {stage === "request" ? (
            <form onSubmit={requestOtp} className="stack">
              {mode === "signup" && (
                <input
                  placeholder={t("fullName")}
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  required
                />
              )}
              <input
                placeholder={t("phoneNumber")}
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
              />
              {mode === "signup" && (
                <input
                  placeholder={t("emailOptional")}
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              )}
              <input
                placeholder={t("password")}
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
              />
              {mode === "signup" && (
                <select value={form.target_exam} onChange={(e) => update("target_exam", e.target.value)}>
                  <option>JEE</option>
                  <option>NEET</option>
                  <option>GATE</option>
                  <option>NDA/CDS</option>
                </select>
              )}

              {mode === "signup" ? (
                <div className="exam-info-card">
                  <b>{examMeta[form.target_exam]?.title || form.target_exam}</b>
                  <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                    {examMeta[form.target_exam]?.desc || t("focusedGuidanceFallback")}
                  </p>
                  <div className="mini-list" style={{ marginTop: "0.55rem" }}>
                    {(examMeta[form.target_exam]?.points || []).map((row) => (
                      <div className="mini-item" key={row}>
                        <span>{row}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <button className="cta-btn" disabled={loading || !canRequestOtp}>
                {loading ? t("sendingOtp") : t("sendOtp")} <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={submitAuth} className="stack">
              <div className="otp-box">
                <Sparkles size={16} />
                {t("devOtpLabel")} <b>{otpHint}</b>
              </div>
              <input
                placeholder={t("enterOtp")}
                value={form.otp}
                onChange={(e) => update("otp", e.target.value)}
                required
              />
              <button className="cta-btn" disabled={loading}>
                {loading ? t("verifying") : mode === "signup" ? t("createAccount") : t("loginVerb")}
              </button>
              <button className="ghost-btn" type="button" onClick={() => setStage("request")}>
                {t("editDetails")}
              </button>
            </form>
          )}

          {error ? <p className="error-text">{error}</p> : null}
        </section>
        </div>

      <p className="auth-wide-copy">
        {t("authWideCopy")}
      </p>
    </div>
  );
}

