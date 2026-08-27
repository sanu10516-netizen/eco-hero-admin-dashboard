import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { db } from "../firebase";

import "../styles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [totalPlayers, setTotalPlayers] = useState(0);
  const [activePlayers, setActivePlayers] = useState(0);
  const [totalLevels, setTotalLevels] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    let usersA = [];
    let usersB = [];
    let sessions = [];

    const updateStats = () => {
      const merged = [...usersA, ...usersB];
      const uniqueUsers = new Map();

      merged.forEach((user) => {
        const key = user.email ? user.email.trim().toLowerCase() : user.id;
        uniqueUsers.set(key, user);
      });

      setTotalPlayers(uniqueUsers.size);

      const onlineUserIds = new Set(
        sessions.filter((session) => !session.endTime).map((session) => session.userId)
      );

      setActivePlayers(onlineUserIds.size);
    };

    const unsubscribeUsersA = onSnapshot(collection(db, "Users"), (snapshot) => {
      usersA = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      updateStats();
    });

    const unsubscribeUsersB = onSnapshot(collection(db, "users"), (snapshot) => {
      usersB = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      updateStats();
    });

    const unsubscribeSessions = onSnapshot(collection(db, "gameSessions"), (snapshot) => {
      sessions = snapshot.docs.map((doc) => doc.data());
      updateStats();
    });

    const unsubscribeLevels = onSnapshot(collection(db, "Levels"), (snapshot) => {
      setTotalLevels(snapshot.size);
    });

    const unsubscribePosts = onSnapshot(collection(db, "CommunityPosts"), (snapshot) => {
      setTotalPosts(snapshot.size);
    });

    return () => {
      unsubscribeUsersA();
      unsubscribeUsersB();
      unsubscribeSessions();
      unsubscribeLevels();
      unsubscribePosts();
    };
  }, []);

  const stats = [
    ["👥", "Total Players", totalPlayers],
    ["🟢", "Active Players", activePlayers],
    ["🎮", "Total Levels", totalLevels],
    ["💬", "Community Posts", totalPosts],
  ];

  const modules = [
    ["👥", "Players", "View player statistics", "/players"],
    ["🎮", "Game Content", "Manage levels and objects", "/game-content"],
    ["💬", "Community", "Manage player posts", "/community"],
    ["📝", "Questionnaire", "View player responses", "/questionnaire"],
  ];

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <main className="dashboard-content">
          <div className="welcome">
            <div>
              <h1>Welcome, Admin 👋</h1>
              <p>Here is an overview of your Eco Hero Adventure game.</p>
            </div>
          </div>

          <div className="stats">
            {stats.map((item) => (
              <div className="stat-card" key={item[1]}>
                <div className="stat-icon">{item[0]}</div>
                <div>
                  <p>{item[1]}</p>
                  <h2>{item[2]}</h2>
                </div>
              </div>
            ))}
          </div>

          <h2 className="section-title">Quick Modules</h2>

          <div className="modules">
            {modules.map((item) => (
              <div className="module-card" key={item[3]}>
                <div className="module-icon">{item[0]}</div>
                <h3>{item[1]}</h3>
                <p>{item[2]}</p>

                <button onClick={() => navigate(item[3])}>
                  Open →
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;