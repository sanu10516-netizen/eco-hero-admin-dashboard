import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Community from "./pages/Community";
import GameContent from "./pages/GameContent";
import Questionnaire from "./pages/Questionnaire";

function App() {
  return (
    <Routes>

      <Route path="/" element={<Login />} />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/players" element={<Players />} />

      <Route path="/community" element={<Community />} />

      <Route path="/game-content" element={<GameContent />} />

      <Route path="/questionnaire" element={<Questionnaire />} />

    </Routes>
  );
}

export default App;