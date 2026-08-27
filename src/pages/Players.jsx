import { useEffect, useState } from "react";
import "../styles/Players.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { exportCsv } from "../utils/exportCsv";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function Players() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let usersA = [];
    let usersB = [];
    let scores = [];

    const buildPlayers = () => {
      const merged = [...usersA, ...usersB];
      const uniqueUsers = new Map();

      merged.forEach((user) => {
        const key = user.email ? user.email.trim().toLowerCase() : user.id;
        uniqueUsers.set(key, user);
      });

      const latestScoreById = new Map();

      scores.forEach((entry) => {
        if (!entry.userId) return;

        const existing = latestScoreById.get(entry.userId);
        const time = entry.timestamp ? entry.timestamp.toDate().getTime() : 0;
        const existingTime = existing?.timestamp
          ? existing.timestamp.toDate().getTime()
          : -1;

        if (!existing || time > existingTime) {
          latestScoreById.set(entry.userId, entry);
        }
      });

      const data = Array.from(uniqueUsers.values()).map((user) => {
        const score = latestScoreById.get(user.id);

        const lastActive = score?.timestamp
          ? score.timestamp.toDate().toLocaleString()
          : "Never";

        return {
          id: user.id,
          username: user.username || user.name || "Unknown",
          email: user.email || "No email",
          coins: user.coins || 0,
          score: score ? score.score : user.totalScore || 0,
          level: score ? score.level : user.currentLevel || 0,
          lastActive,
        };
      });

      setPlayers(data);
      setLoading(false);
    };

    const unsubA = onSnapshot(collection(db, "Users"), (snap) => {
      usersA = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      buildPlayers();
    });

    const unsubB = onSnapshot(collection(db, "users"), (snap) => {
      usersB = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      buildPlayers();
    });

    const unsubScores = onSnapshot(collection(db, "scores"), (snap) => {
      scores = snap.docs.map((d) => d.data());
      buildPlayers();
    });

    return () => {
      unsubA();
      unsubB();
      unsubScores();
    };
  }, []);

  const filteredPlayers = players.filter((player) =>
    player.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <main className="page-content">
          <div className="page-heading">
            <div>
              <h1>Player Statistics 👥</h1>
              <p>View player progress and activity.</p>
            </div>

            <button
              className="green-btn"
              onClick={() => exportCsv("players.csv", filteredPlayers)}
            >
              📥 Export CSV
            </button>
          </div>

          <div className="filter-box">
            <input
              type="text"
              placeholder="🔍 Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="message">Loading players...</p>
          ) : (
            <div className="table-box">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Score</th>
                    <th>Level</th>
                    <th>Coins</th>
                    <th>Last Active</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPlayers.map((player) => (
                    <tr key={player.id}>
                      <td>{player.username}</td>
                      <td>{player.email}</td>
                      <td>{player.score}</td>
                      <td>Level {player.level}</td>
                      <td>🪙 {player.coins}</td>
                      <td>{player.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredPlayers.length === 0 && (
                <p className="message">No player data available yet.</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Players;