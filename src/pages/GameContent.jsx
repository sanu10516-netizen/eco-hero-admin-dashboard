import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { db } from "../firebase";
import "../styles/GameContent.css";

function GameContent() {
  const [levels, setLevels] = useState([]);
  const [objects, setObjects] = useState([]);

  const [levelName, setLevelName] = useState("");
  const [levelObjective, setLevelObjective] = useState("");
  const [levelReward, setLevelReward] = useState("");
  const [editingLevelId, setEditingLevelId] = useState(null);

  const [objectName, setObjectName] = useState("");
  const [objectType, setObjectType] = useState("");
  const [editingObjectId, setEditingObjectId] = useState(null);

  const [error, setError] = useState("");

  useEffect(() => {
    const unsubLevels = onSnapshot(collection(db, "Levels"), (snap) => {
      setLevels(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubObjects = onSnapshot(collection(db, "GameObjects"), (snap) => {
      setObjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubLevels();
      unsubObjects();
    };
  }, []);

  const saveLevel = async () => {
    if (!levelName.trim() || !levelObjective.trim() || !levelReward.trim()) {
      setError("Please fill in level name, objective and reward.");
      return;
    }
    setError("");

    const data = {
      name: levelName.trim(),
      objective: levelObjective.trim(),
      reward: levelReward.trim(),
    };

    if (editingLevelId) {
      await updateDoc(doc(db, "Levels", editingLevelId), data);
    } else {
      await addDoc(collection(db, "Levels"), data);
    }

    setLevelName("");
    setLevelObjective("");
    setLevelReward("");
    setEditingLevelId(null);
  };

  const editLevel = (level) => {
    setEditingLevelId(level.id);
    setLevelName(level.name);
    setLevelObjective(level.objective);
    setLevelReward(level.reward);
  };

  const deleteLevel = async (id) => {
    if (window.confirm("Delete this level?")) {
      await deleteDoc(doc(db, "Levels", id));
    }
  };

  const saveObject = async () => {
    if (!objectName.trim() || !objectType.trim()) {
      setError("Please fill in object name and type.");
      return;
    }
    setError("");

    const data = {
      name: objectName.trim(),
      type: objectType.trim(),
      status: "Active",
    };

    if (editingObjectId) {
      await updateDoc(doc(db, "GameObjects", editingObjectId), data);
    } else {
      await addDoc(collection(db, "GameObjects"), data);
    }

    setObjectName("");
    setObjectType("");
    setEditingObjectId(null);
  };

  const editObject = (object) => {
    setEditingObjectId(object.id);
    setObjectName(object.name);
    setObjectType(object.type);
  };

  const deleteObject = async (id) => {
    if (window.confirm("Delete this object?")) {
      await deleteDoc(doc(db, "GameObjects", id));
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <main className="page-content">
          <div className="page-heading">
            <h1>Game Content 🎮</h1>
            <p>Manage game levels and objects.</p>
          </div>

          {error && <p className="message">⚠️ {error}</p>}

          <div className="content-section">
            <div className="section-head">
              <h2>🎯 Game Levels</h2>
              <div className="add-area">
                <input
                  placeholder="Level name"
                  value={levelName}
                  onChange={(e) => setLevelName(e.target.value)}
                />
                <input
                  placeholder="Objective"
                  value={levelObjective}
                  onChange={(e) => setLevelObjective(e.target.value)}
                />
                <input
                  placeholder="Reward"
                  value={levelReward}
                  onChange={(e) => setLevelReward(e.target.value)}
                />
                <button onClick={saveLevel}>
                  {editingLevelId ? "Save" : "+ Add Level"}
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
                      <button className="edit-btn" onClick={() => editLevel(level)}>Edit</button>
                      <button className="delete-btn" onClick={() => deleteLevel(level.id)}>Delete</button>
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
                  placeholder="Object name"
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                />
                <input
                  placeholder="Type"
                  value={objectType}
                  onChange={(e) => setObjectType(e.target.value)}
                />
                <button onClick={saveObject}>
                  {editingObjectId ? "Save" : "+ Add Object"}
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
                      <span style={{ color: object.status === "Active" ? "#269653" : "#c33" }}>
                        ● {object.status}
                      </span>
                    </td>
                    <td>
                      <button className="edit-btn" onClick={() => editObject(object)}>Edit</button>
                      <button className="delete-btn" onClick={() => deleteObject(object.id)}>Delete</button>
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