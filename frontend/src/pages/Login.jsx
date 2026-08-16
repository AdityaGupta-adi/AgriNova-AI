import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // Login successful
      navigate("/dashboard");
    } catch (err) {
      console.log("LOGIN ERROR:", err);

      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.logo}>🌿</div>

        <h1 style={styles.title}>AgriNova AI</h1>

        <h2 style={styles.heading}>🔐 Login</h2>

        <p style={styles.subtitle}>
          Login to your AgriNova AI account
        </p>

        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            autoComplete="email"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "🔄 Logging in..." : "🔐 Login"}
          </button>

        </form>

        <p style={styles.registerText}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>
            Create Account
          </Link>
        </p>

        <Link to="/" style={styles.homeLink}>
          ← Back to Home
        </Link>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #eef9ed, #f8fff7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "380px",
    background: "#ffffff",
    padding: "32px",
    borderRadius: "20px",
    boxShadow:
      "0 10px 35px rgba(46, 125, 50, 0.15)",
    boxSizing: "border-box",
    textAlign: "center",
  },

  logo: {
    fontSize: "48px",
    marginBottom: "4px",
  },

  title: {
    margin: "0",
    color: "#245d2a",
    fontSize: "28px",
    fontWeight: "800",
  },

  heading: {
    margin: "8px 0 4px",
    color: "#2e7d32",
    fontSize: "20px",
  },

  subtitle: {
    margin: "0 0 22px",
    color: "#718071",
    fontSize: "13px",
  },

  error: {
    background: "#ffebee",
    color: "#c62828",
    border: "1px solid #ffcdd2",
    padding: "10px",
    borderRadius: "9px",
    marginBottom: "15px",
    fontSize: "13px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    marginBottom: "12px",
    border: "1px solid #cfd8cf",
    borderRadius: "9px",
    outline: "none",
    fontSize: "14px",
    background: "#ffffff",
  },

  button: {
    width: "100%",
    padding: "12px",
    marginTop: "5px",
    border: "none",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg, #2e7d32, #388e3c)",
    color: "white",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  registerText: {
    marginTop: "20px",
    marginBottom: "8px",
    color: "#687568",
    fontSize: "13px",
  },

  link: {
    color: "#2e7d32",
    fontWeight: "700",
    textDecoration: "none",
  },

  homeLink: {
    color: "#5d6d5f",
    fontSize: "12px",
    textDecoration: "none",
  },
};