import "./login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      const adminDoc = await getDoc(doc(db, "admins", user.uid));

      if (adminDoc.exists()) {
        navigate("/dashboard");
      } else {
        await signOut(auth);
        setError("Access denied. Only admin can login.");
      }
    } catch (err) {
      setError("Login failed: " + err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">🌿</div>

        <h1>Eco Hero Adventure</h1>

        <p className="login-subtitle">Admin Dashboard</p>

        <p className="welcome-text">👋 Welcome back, Admin!</p>

        <p className="login-message">Please login to continue</p>

        {error && <p className="login-error">⚠️ {error}</p>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>📧 Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>🔒 Password</label>

            <div className="password-box">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "🔒"}
              </button>
            </div>
          </div>

          <button type="submit" className="login-button">
            🔐 Login
          </button>
        </form>

        <div className="login-footer">
          <span>🌱</span>
          <p>Manage your Eco Hero Adventure system</p>
        </div>
      </div>
    </div>
  );
}

export default Login;