import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { db } from "../firebase";
import "../styles/community.css";

function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReportedOnly, setShowReportedOnly] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "CommunityPosts"),
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setPosts(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching community posts:", err);
        setError(`Community posts error: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const deletePost = async (id) => {
    try {
      setError("");
      await deleteDoc(doc(db, "CommunityPosts", id));
    } catch (err) {
      console.error("Delete post error:", err);
      setError(`Delete post failed: ${err.message}`);
    }
  };

  const banPlayer = async (post) => {
    try {
      setError("");
      await updateDoc(doc(db, "CommunityPosts", post.id), {
        banned: !post.banned,
      });
    } catch (err) {
      console.error("Ban player error:", err);
      setError(`Ban player failed: ${err.message}`);
    }
  };

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

          {error && (
            <p className="message">⚠️ {error}</p>
          )}

          {loading ? (
            <p className="message">Loading posts...</p>
          ) : (
            <div className="post-list">
              {posts
                .filter((post) => !showReportedOnly || post.reported)
                .map((post) => (
                <div className="post-card" key={post.id}>
                  <div className="post-header">
                    <b>👤 {post.player || "Unknown"}</b>

                    {post.reported && (
                      <span className="reported">⚠ Reported</span>
                    )}

                    {post.banned && (
                      <span className="banned">Banned</span>
                    )}
                  </div>

                  <p>{post.text}</p>

                  <div className="post-buttons">
                    <button onClick={() => banPlayer(post)}>
                      {post.banned ? "Unban Player" : "Ban Player"}
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

              {posts.filter((post) => !showReportedOnly || post.reported)
                .length === 0 && (
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