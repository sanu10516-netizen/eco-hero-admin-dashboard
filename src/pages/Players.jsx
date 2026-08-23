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
    const unsubscribe = onSnapshot(
      collection(db, "Users"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const user = doc.data();

          return {
            id: doc.id,

            username:
              user.username ||
              user.Username ||
              user.name ||
              "Unknown",

            email:
              user.email ||
              user.Email ||
              "No email",

            score:
              user.totalscores ||
              user.totalScore ||
              user.Totalscore ||
              user.score ||
              0,

            level:
              user.currentLevel ||
              user.Currentlevel ||
              user["current level"] ||
              user.level ||
              0,

            coins:
              user.coins ||
              user.Coins ||
              0,
          };
        });

        setPlayers(data);
        setLoading(false);
      },
      (error) => {
        console.log("Error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
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
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredPlayers.length === 0 && (
                <p className="message">No players found.</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Players;