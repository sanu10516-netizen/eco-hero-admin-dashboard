import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { db } from "../firebase";

import "../styles/GameContent.css";

function GameContent() {
  const [levels, setLevels] = useState([]);
  const [objects, setObjects] = useState([]);
  const [newLevel, setNewLevel] = useState("");
  const [newObject, setNewObject] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribeLevels = onSnapshot(
      collection(db, "Levels"),
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setLevels(data);
      },
      (err) => {
        console.error("Levels error:", err);
        setError(`Levels error: ${err.message}`);
      }
    );

    const unsubscribeObjects = onSnapshot(
      collection(db, "GameObjects"),
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setObjects(data);
      },
      (err) => {
        console.error("Objects error:", err);
        setError(`Objects error: ${err.message}`);
      }
    );

    return () => {
      unsubscribeLevels();
      unsubscribeObjects();
    };
  }, []);

  const addLevel = async () => {
    if (!newLevel.trim()) return;

    try {
      setError("");

      await addDoc(collection(db, "Levels"), {
        name: newLevel.trim(),
        objective: "New objective",
        reward: "100 Coins",
      });

      setNewLevel("");
    } catch (err) {
      console.error("Add Level error:", err);
      setError(`Add Level failed: ${err.message}`);
    }
  };

  const addObject = async () => {
    if (!newObject.trim()) return;

    try {
      setError("");

      await addDoc(collection(db, "GameObjects"), {
        name: newObject.trim(),
        type: "Object",
        status: "Active",
      });

      setNewObject("");
    } catch (err) {
      console.error("Add Object error:", err);
      setError(`Add Object failed: ${err.message}`);
    }
  };

  const deleteLevel = async (id) => {
    try {
      setError("");
      await deleteDoc(doc(db, "Levels", id));
    } catch (err) {
      setError(`Delete Level failed: ${err.message}`);
    }
  };

  const deleteObject = async (id) => {
    try {
      setError("");
      await deleteDoc(doc(db, "GameObjects", id));
    } catch (err) {
      setError(`Delete Object failed: ${err.message}`);
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
              <h1>Game Content 🎮</h1>
              <p>Manage game levels and objects.</p>
            </div>
          </div>

          {error && (
            <p className="message">
              ⚠️ {error}
            </p>
          )}

          <div className="content-section">
            <div className="section-head">
              <h2>🎯 Game Levels</h2>

              <div className="add-area">
                <input
                  type="text"
                  placeholder="Level name"
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                />

                <button onClick={addLevel}>
                  + Add Level
                </button>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Objective</th>
                  <th>Reward</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {levels.map((level) => (
                  <tr key={level.id}>
                    <td>{level.name}</td>
                    <td>{level.objective}</td>
                    <td>🪙 {level.reward}</td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => deleteLevel(level.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="content-section">
            <div className="section-head">
              <h2>🌳 Game Objects</h2>

              <div className="add-area">
                <input
                  type="text"
                  placeholder="Object name"
                  value={newObject}
                  onChange={(e) => setNewObject(e.target.value)}
                />

                <button onClick={addObject}>
                  + Add Object
                </button>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Object</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {objects.map((object) => (
                  <tr key={object.id}>
                    <td>{object.name}</td>
                    <td>{object.type}</td>
                    <td>
                      <span className="status">
                        ● {object.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => deleteObject(object.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

export default GameContent;