import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
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

  // Fetch Community Posts from Firestore
  useEffect(() => {
    const postsRef = collection(db, "CommunityPosts");

    const unsubscribePosts = onSnapshot(
      postsRef,
      (snapshot) => {
        const postData = snapshot.docs.map((postDoc) => {
          const data = postDoc.data();

          return {
            id: postDoc.id,
            ...data,

            // Supports different possible Firestore field names
            playerName:
              data.playerName ||
              data.player ||
              data.username ||
              data.userName ||
              data.name ||
              "Unknown",

            postText:
              data.text ||
              data.content ||
              data.message ||
              data.postText ||
              data.post ||
              "",

            reported:
              data.reported === true ||
              data.isReported === true ||
              data.report === true,
          };
        });

        setPosts(postData);
        setLoading(false);
      },
      (err) => {
        console.error("Community posts error:", err);
        setError(`Community posts error: ${err.message}`);
        setLoading(false);
      }
    );

    // Fetch banned players
    const unsubscribeBans = onSnapshot(
      collection(db, "bannedPlayers"),
      (snapshot) => {
        setBannedPlayers(snapshot.docs.map((d) => d.id));
      },
      (err) => {
        console.error("Banned players error:", err);
      }
    );

    return () => {
      unsubscribePosts();
      unsubscribeBans();
    };
  }, []);

  // Delete post
  const deletePost = async (postId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmDelete) return;

    try {
      setError("");

      await deleteDoc(doc(db, "CommunityPosts", postId));
    } catch (err) {
      console.error("Delete post failed:", err);
      setError(`Delete post failed: ${err.message}`);
    }
  };

  // Check if player is banned
  const isBanned = (playerName) => {
    if (!playerName) return false;

    return bannedPlayers.includes(
      playerName.trim().toLowerCase()
    );
  };

  // Ban / Unban player
  const toggleBanPlayer = async (playerName) => {
    if (!playerName || playerName === "Unknown") {
      alert("Player name is not available.");
      return;
    }

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
      console.error("Ban player failed:", err);
      setError(`Ban player failed: ${err.message}`);
    }
  };

  // Reported posts filter
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
              onClick={() =>
                setShowReportedOnly(!showReportedOnly)
              }
            >
              {showReportedOnly
                ? "Show All Posts"
                : "⚠ Show Reported Only"}
            </button>
          </div>

          {error && (
            <p className="message error-message">
              ⚠️ {error}
            </p>
          )}

          {loading ? (
            <p className="message">Loading posts...</p>
          ) : (
            <div className="post-list">
              {filteredPosts.map((post) => (
                <div className="post-card" key={post.id}>
                  <div className="post-header">
                    <b>👤 {post.playerName}</b>

                    {post.reported && (
                      <span className="reported">
                        ⚠ Reported
                      </span>
                    )}

                    {isBanned(post.playerName) && (
                      <span className="banned">
                        Banned
                      </span>
                    )}
                  </div>

                  <p>
                    {post.postText || "No post content available."}
                  </p>

                  <div className="post-buttons">
                    <button
                      onClick={() =>
                        toggleBanPlayer(post.playerName)
                      }
                    >
                      {isBanned(post.playerName)
                        ? "Unban Player"
                        : "Ban Player"}
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deletePost(post.id)}
                    >
                      Delete Post
                    </button>
                  </div>
                </div>
              ))}

              {filteredPosts.length === 0 && (
                <p className="message">
                  {showReportedOnly
                    ? "No reported posts found."
                    : "No community posts found."}
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