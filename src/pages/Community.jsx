import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  deleteField,
  updateDoc,
} from "firebase/firestore";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { db } from "../firebase";
import "../styles/community.css";

function Community() {
  const [posts, setPosts] = useState([]);
  const [bannedPlayers, setBannedPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReportedOnly, setShowReportedOnly] = useState(false);

  useEffect(() => {
    const unsubPosts = onSnapshot(
      collection(db, "CommunityPosts"),
      (snapshot) => {
        setPosts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(`Community posts error: ${err.message}`);
        setLoading(false);
      }
    );

    const unsubBans = onSnapshot(collection(db, "bannedPlayers"), (snapshot) => {
      setBannedPlayers(snapshot.docs.map((d) => d.id));
    });

    return () => {
      unsubPosts();
      unsubBans();
    };
  }, []);

  const deletePost = async (id) => {
    try {
      setError("");
      await deleteDoc(doc(db, "CommunityPosts", id));
    } catch (err) {
      setError(`Delete post failed: ${err.message}`);
    }
  };

  const isBanned = (playerName) =>
    bannedPlayers.includes((playerName || "").trim().toLowerCase());

  const toggleBanPlayer = async (playerName) => {
    if (!playerName) return;
    const key = playerName.trim().toLowerCase();

    try {
      setError("");
      if (isBanned(playerName)) {
        await deleteDoc(doc(db, "bannedPlayers", key));
      } else {
        await setDoc(doc(db, "bannedPlayers", key), {
          username: playerName,
          bannedAt: new Date(),
        });
      }
    } catch (err) {
      setError(`Ban player failed: ${err.message}`);
    }
  };

  const filteredPosts = posts.filter(
    (post) => !showReportedOnly || post.reported
  );

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <main className="page-content">
          <div className="page-heading">
            <div>
              <h1>Community 💬</h1>
              <p>Manage player posts and reported content.</p>
            </div>

            <button
              className="green-btn"
              onClick={() => setShowReportedOnly(!showReportedOnly)}
            >
              {showReportedOnly ? "Show All Posts" : "⚠ Show Reported Only"}
            </button>
          </div>

          {error && <p className="message">⚠️ {error}</p>}

          {loading ? (
            <p className="message">Loading posts...</p>
          ) : (
            <div className="post-list">
              {filteredPosts.map((post) => (
                <div className="post-card" key={post.id}>
                  <div className="post-header">
                    <b>👤 {post.player || "Unknown"}</b>

                    {post.reported && <span className="reported">⚠ Reported</span>}

                    {isBanned(post.player) && (
                      <span className="banned">Banned</span>
                    )}
                  </div>

                  <p>{post.text}</p>

                  <div className="post-buttons">
                    <button onClick={() => toggleBanPlayer(post.player)}>
                      {isBanned(post.player) ? "Unban Player" : "Ban Player"}
                    </button>

                    <button className="delete-btn" onClick={() => deletePost(post.id)}>
                      Delete Post
                    </button>
                  </div>
                </div>
              ))}

              {filteredPosts.length === 0 && (
                <p className="message">
                  {showReportedOnly ? "No reported posts found." : "No community posts found."}
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Community;