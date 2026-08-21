import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { exportCsv } from "../utils/exportCsv";
import { db } from "../firebase";

import "../styles/Questionnaire.css";

function Questionnaire() {
  const [responses, setResponses] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "QuestionnaireResponses"),
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setResponses(data);
      },
      (error) => {
        console.log("Error fetching questionnaire responses:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const filtered = responses.filter((response) => {
    const player = response.player || "";
    const mission = response.mission || "";
    const date = response.date || "";

    const matchesSearch =
      player.toLowerCase().includes(search.toLowerCase()) ||
      mission.toLowerCase().includes(search.toLowerCase());

    const matchesDate = dateFilter === "" || date.includes(dateFilter);

    return matchesSearch && matchesDate;
  });

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <main className="page-content">
          <div className="page-heading">
            <div>
              <h1>Questionnaire Responses 📝</h1>
              <p>View player environmental behavior responses.</p>
            </div>

            <button
              className="green-btn"
              onClick={() => exportCsv("responses.csv", filtered)}
            >
              📥 Export CSV
            </button>
          </div>

          <div className="filter-box">
            <input
              type="text"
              placeholder="🔍 Search player or mission..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <input
              type="text"
              placeholder="📅 Filter by date..."
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div className="table-box">
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Mission</th>
                  <th>Date</th>
                  <th>Answer</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((response) => (
                  <tr key={response.id}>
                    <td>{response.player || "Unknown"}</td>
                    <td>{response.mission || "-"}</td>
                    <td>{response.date || "-"}</td>
                    <td>{response.answer || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <p className="message">
                No questionnaire responses found.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Questionnaire;