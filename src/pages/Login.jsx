import "./login.css";
import { useState, useEffect } from "react";
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
  const [lockedUntil, setLockedUntil] = useState(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("loginLockedUntil");
    if (stored && Number(stored) > Date.now()) {
      setLockedUntil(Number(stored));
    }
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;

    const interval = setInterval(() => {
      const secondsLeft = Math.ceil((lockedUntil - Date.now()) / 1000);

      if (secondsLeft <= 0) {
        setLockedUntil(null);
        localStorage.removeItem("loginLockedUntil");
        localStorage.removeItem("failedAttempts");
        setRemaining(0);
      } else {
        setRemaining(secondsLeft);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  const registerFailedAttempt = () => {
    const attempts = Number(localStorage.getItem("failedAttempts") || 0) + 1;
    localStorage.setItem("failedAttempts", attempts);

    if (attempts >= 3) {
      const until = Date.now() + 15 * 60 * 1000;
      localStorage.setItem("loginLockedUntil", until);
      setLockedUntil(until);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (lockedUntil && lockedUntil > Date.now()) {
      setError("Too many failed attempts. Please try again later.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      const adminDoc = await getDoc(doc(db, "admins", user.uid));

      if (adminDoc.exists() && adminDoc.data().role === "admin") {
        localStorage.removeItem("failedAttempts");
        localStorage.removeItem("loginLockedUntil");
        navigate("/dashboard");
      } else {
        await signOut(auth);
        registerFailedAttempt();
        setError("Access denied. Not an admin account.");
      }
    } catch (err) {
      registerFailedAttempt();
      setError("Invalid email or password.");
    }
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isLocked = lockedUntil && lockedUntil > Date.now();

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">🌿</div>

        <h1>Eco Hero Adventure</h1>

        <p className="login-subtitle">Admin Dashboard</p>

        <p className="welcome-text">👋 Welcome back, Admin!</p>

        <p className="login-message">Please login to continue</p>

        {error && <p className="login-error">⚠️ {error}</p>}

        {isLocked && (
          <p className="login-error">
            🔒 Locked. Try again in {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>📧 Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLocked}
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
                disabled={isLocked}
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

          <button type="submit" className="login-button" disabled={isLocked}>
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