import { useEffect, useState } from "react";
import { Crown, Medal, Trophy } from "lucide-react";
import { getLeaderboard, getMe } from "../lib/api";
import { useAppContext } from "../shared/AppContext";

export function LeaderboardPage() {
  const { t } = useAppContext();
  const [entries, setEntries] = useState([]);
  const [exam, setExam] = useState("JEE");

  useEffect(() => {
    getMe().then((me) => setExam(me.target_exam)).catch(() => {});
  }, []);

  useEffect(() => {
    getLeaderboard({ exam }).then(setEntries).catch(() => {});
  }, [exam]);

  return (
    <div className="stack-lg">
      <section className="glass-card leaderboard-head premium-hero">
        <div>
          <h2>{t("leaderboard")}</h2>
          <p className="muted">{t("leaderboardIntro")}</p>
        </div>
        <select value={exam} onChange={(e) => setExam(e.target.value)}>
          <option>JEE</option>
          <option>NEET</option>
          <option>GATE</option>
          <option>NDA/CDS</option>
          <option>NDA</option>
        </select>
      </section>

      {entries.length >= 3 ? (
        <section className="podium-grid">
          <article className="glass-card podium second">
            <Medal size={18} />
            <h4>{entries[1].full_name}</h4>
            <p>#{entries[1].rank}</p>
            <b>
              {entries[1].points} {t("pts")}
            </b>
          </article>
          <article className="glass-card podium first">
            <Crown size={20} />
            <h4>{entries[0].full_name}</h4>
            <p>#{entries[0].rank}</p>
            <b>
              {entries[0].points} {t("pts")}
            </b>
          </article>
          <article className="glass-card podium third">
            <Trophy size={18} />
            <h4>{entries[2].full_name}</h4>
            <p>#{entries[2].rank}</p>
            <b>
              {entries[2].points} {t("pts")}
            </b>
          </article>
        </section>
      ) : null}

      <section className="glass-card">
        <div className="mini-list">
          {entries.length === 0 ? (
            <p className="muted">{t("noRankings")}</p>
          ) : (
            entries.map((entry) => (
              <article className="mini-item rank-row" key={entry.user_id}>
                <div className="rank-left">
                  <span className={entry.rank <= 3 ? "rank top" : "rank"}>#{entry.rank}</span>
                  <div>
                    <b>{entry.full_name}</b>
                    <p>{t("idLabel", { count: entry.user_id })}</p>
                  </div>
                </div>
                <span className="points">
                  {entry.rank === 1 ? <Crown size={16} /> : null}
                  {entry.points} {t("pts")}
                </span>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

