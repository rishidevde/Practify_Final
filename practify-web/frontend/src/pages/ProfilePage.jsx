import { useEffect, useState } from "react";
import { Gem, UserRound } from "lucide-react";
import { getMe, updateMe } from "../lib/api";
import { useAppContext } from "../shared/AppContext";

export function ProfilePage() {
  const { t } = useAppContext();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState("ok"); // ok | error

  useEffect(() => {
    getMe().then(setProfile);
  }, []);

  async function save() {
    if (!profile) return;
    setSaving(true);
    setStatus("");
    setStatusTone("ok");
    try {
      const updated = await updateMe({
        full_name: profile.full_name,
        phone: profile.phone,
        email: profile.email,
        target_exam: profile.target_exam,
        profile_details: profile.profile_details,
      });
      setProfile(updated);
      setStatus(t("profileUpdated"));
      setStatusTone("ok");
    } catch {
      setStatus(t("unableUpdateProfile"));
      setStatusTone("error");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return <div className="glass-card">{t("loadingProfile")}</div>;
  const d = profile.profile_details || {};

  function patchDetails(key, value) {
    setProfile((state) => ({
      ...state,
      profile_details: { ...(state.profile_details || {}), [key]: value },
    }));
  }

  return (
    <div className="stack-lg">
      <section className="glass-card premium-hero profile-hero">
        <div className="profile-id">
          <div className="profile-avatar">
            {profile.full_name?.charAt(0)?.toUpperCase() || <UserRound size={20} />}
          </div>
          <div>
            <h2>{profile.full_name}</h2>
            <p className="muted">{profile.phone}</p>
          </div>
        </div>
        <div className="coin-pill">
          <Gem size={16} />
          {profile.coins} {t("gems")}
        </div>
      </section>

      <section className="glass-card form-grid">
        <label>
          {t("fullName")}
          <input
            value={profile.full_name}
            onChange={(e) => setProfile((s) => ({ ...s, full_name: e.target.value }))}
          />
        </label>
        <label>
          {t("gender")}
          <select value={d.gender || ""} onChange={(e) => patchDetails("gender", e.target.value)}>
            <option value="">{t("select")}</option>
            <option value="Male">{t("male")}</option>
            <option value="Female">{t("female")}</option>
            <option value="Other">{t("other")}</option>
            <option value="Prefer not to say">{t("preferNot")}</option>
          </select>
        </label>
        <label>
          {t("dob")}
          <input
            type="date"
            value={d.date_of_birth || ""}
            onChange={(e) => patchDetails("date_of_birth", e.target.value)}
          />
        </label>
        <label className="full">
          {t("bio")}
          <input value={d.bio || ""} onChange={(e) => patchDetails("bio", e.target.value)} />
        </label>
        <label>
          {t("phone")}
          <input value={profile.phone} disabled />
        </label>
        <label>
          {t("email")}
          <input
            value={profile.email || ""}
            onChange={(e) => setProfile((s) => ({ ...s, email: e.target.value }))}
          />
        </label>
        <label>
          {t("targetExam")}
          <select
            value={profile.target_exam}
            onChange={(e) => setProfile((s) => ({ ...s, target_exam: e.target.value }))}
          >
            <option>JEE</option>
            <option>NEET</option>
            <option>GATE</option>
            <option>NDA/CDS</option>
            <option>NDA</option>
          </select>
        </label>
      </section>

      <section className="glass-card form-grid">
        <h3 className="full">{t("addressPrefs")}</h3>
        <label>
          {t("street")}
          <input value={d.street || ""} onChange={(e) => patchDetails("street", e.target.value)} />
        </label>
        <label>
          {t("city")}
          <input value={d.city || ""} onChange={(e) => patchDetails("city", e.target.value)} />
        </label>
        <label>
          {t("state")}
          <input value={d.state || ""} onChange={(e) => patchDetails("state", e.target.value)} />
        </label>
        <label>
          {t("instagram")}
          <input
            value={d.instagram_url || ""}
            onChange={(e) => patchDetails("instagram_url", e.target.value)}
          />
        </label>
        <label className="full">
          {t("linkedin")}
          <input
            value={d.linkedin_url || ""}
            onChange={(e) => patchDetails("linkedin_url", e.target.value)}
          />
        </label>
      </section>

      <button className="cta-btn compact" onClick={save} disabled={saving}>
        {saving ? t("saving") : t("saveProfile")}
      </button>
      {status ? <p className={statusTone === "error" ? "error-text" : "muted"}>{status}</p> : null}
    </div>
  );
}

