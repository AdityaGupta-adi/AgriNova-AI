import { useEffect, useState } from "react";
import { auth, db } from "../firebase";

import {
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [history, setHistory] = useState([]);

  const [diseaseHistory, setDiseaseHistory] = useState([]);

  const [loading, setLoading] = useState(true);

  /* =====================================================
     LOAD USER + FIRESTORE DATA
     ===================================================== */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          navigate("/login");
          return;
        }

        setUser(currentUser);

        try {
          /* ---------------- CROP HISTORY ---------------- */

          const cropQuery = query(
            collection(db, "cropHistory"),
            where("uid", "==", currentUser.uid)
          );

          const cropSnapshot = await getDocs(cropQuery);

          const cropData = cropSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setHistory(cropData);

          /* ---------------- DISEASE HISTORY ---------------- */

          const diseaseQuery = query(
            collection(db, "diseaseHistory"),
            where("uid", "==", currentUser.uid)
          );

          const diseaseSnapshot =
            await getDocs(diseaseQuery);

          const diseaseData =
            diseaseSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

          setDiseaseHistory(diseaseData);

        } catch (error) {
          console.error(
            "Dashboard Firebase Error:",
            error
          );
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [navigate]);

  /* =====================================================
     LOGOUT
     ===================================================== */

  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  /* =====================================================
     LOADING
     ===================================================== */

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>🌾</div>

          <h2>Loading Dashboard...</h2>

          <p>
            Fetching your farming history
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     DASHBOARD
     ===================================================== */

  return (
    <div style={styles.page}>

      {/* =================================================
          HEADER
          ================================================= */}

      <header style={styles.header}>

        <div style={styles.brand}>
          <span style={styles.brandIcon}>
            🌿
          </span>

          <div>
            <h1 style={styles.brandTitle}>
              AgriNova AI
            </h1>

            <p style={styles.brandSubtitle}>
              Smart Agriculture Platform
            </p>
          </div>
        </div>

        <div style={styles.headerActions}>

          <button
            onClick={() => navigate("/")}
            style={styles.homeButton}
          >
            🏠 Home
          </button>

          <button
            onClick={logout}
            style={styles.logoutButton}
          >
            🚪 Logout
          </button>

        </div>

      </header>


      {/* =================================================
          MAIN
          ================================================= */}

      <main style={styles.container}>

        {/* WELCOME */}

        <section style={styles.welcomeCard}>

          <div>

            <p style={styles.welcomeSmall}>
              🌱 Farmer Dashboard
            </p>

            <h2 style={styles.welcomeTitle}>
              Welcome back!
            </h2>

            <p style={styles.email}>
              {user?.email}
            </p>

          </div>

          <div style={styles.welcomeEmoji}>
            👨‍🌾
          </div>

        </section>


        {/* =================================================
            STATISTICS
            ================================================= */}

        <section style={styles.statsGrid}>

          <div style={styles.statCard}>

            <div style={styles.statIcon}>
              🌾
            </div>

            <div>
              <p style={styles.statNumber}>
                {history.length}
              </p>

              <p style={styles.statLabel}>
                Crop Analyses
              </p>
            </div>

          </div>


          <div style={styles.statCard}>

            <div style={styles.statIcon}>
              🌿
            </div>

            <div>
              <p style={styles.statNumber}>
                {diseaseHistory.length}
              </p>

              <p style={styles.statLabel}>
                Disease Reports
              </p>
            </div>

          </div>


          <div style={styles.statCard}>

            <div style={styles.statIcon}>
              🤖
            </div>

            <div>
              <p style={styles.statNumber}>
                AI
              </p>

              <p style={styles.statLabel}>
                Smart Farming
              </p>
            </div>

          </div>

        </section>


        {/* =================================================
            CROP HISTORY
            ================================================= */}

        <section style={styles.section}>

          <div style={styles.sectionHeader}>

            <div>

              <h2 style={styles.sectionTitle}>
                🌾 Crop Recommendation History
              </h2>

              <p style={styles.sectionSubtitle}>
                Your previous AI crop recommendations
              </p>

            </div>

            <div style={styles.countBadge}>
              {history.length}
            </div>

          </div>


          {history.length === 0 ? (

            <div style={styles.emptyCard}>

              <div style={styles.emptyIcon}>
                🌱
              </div>

              <h3>
                No crop recommendations yet
              </h3>

              <p>
                Use AI Crop Recommendation from the
                home page to create your first report.
              </p>

              <button
                onClick={() => navigate("/")}
                style={styles.primaryButton}
              >
                🌾 Recommend a Crop
              </button>

            </div>

          ) : (

            <div style={styles.historyGrid}>

              {history.map((item, index) => (

                <div
                  key={item.id}
                  style={styles.cropCard}
                >

                  {/* CARD HEADER */}

                  <div style={styles.cardTop}>

                    <div>

                      <span style={styles.cardNumber}>
                        #{index + 1}
                      </span>

                      <h3 style={styles.cropTitle}>
                        🌱 Crop Analysis
                      </h3>

                    </div>

                    <span style={styles.dateBadge}>
                      {formatDate(item.createdAt)}
                    </span>

                  </div>


                  {/* INPUT VALUES */}

                  <div style={styles.valuesGrid}>

                    <Value
                      label="Nitrogen"
                      value={item.nitrogen}
                      icon="🧪"
                    />

                    <Value
                      label="Phosphorus"
                      value={item.phosphorus}
                      icon="⚗️"
                    />

                    <Value
                      label="Potassium"
                      value={item.potassium}
                      icon="🌾"
                    />

                    <Value
                      label="pH"
                      value={item.ph}
                      icon="🧫"
                    />

                    <Value
                      label="Temperature"
                      value={
                        item.temperature !== undefined
                          ? `${item.temperature}°C`
                          : "—"
                      }
                      icon="🌡️"
                    />

                    <Value
                      label="Humidity"
                      value={
                        item.humidity !== undefined
                          ? `${item.humidity}%`
                          : "—"
                      }
                      icon="💧"
                    />

                  </div>


                  {/* RECOMMENDATION */}

                  <div style={styles.recommendationBox}>

                    <p style={styles.recommendationTitle}>
                      🌾 Recommended Crop
                    </p>

                    <div style={styles.recommendationText}>
                      {item.recommendation ||
                        "No recommendation available."}
                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* =================================================
            DISEASE HISTORY
            ================================================= */}

        <section style={styles.section}>

          <div style={styles.sectionHeader}>

            <div>

              <h2 style={styles.sectionTitle}>
                🌿 Plant Disease History
              </h2>

              <p style={styles.sectionSubtitle}>
                Previous AI plant disease reports
              </p>

            </div>

            <div style={styles.countBadge}>
              {diseaseHistory.length}
            </div>

          </div>


          {diseaseHistory.length === 0 ? (

            <div style={styles.emptyCard}>

              <div style={styles.emptyIcon}>
                🌿
              </div>

              <h3>
                No disease reports yet
              </h3>

              <p>
                Upload a plant image to detect diseases
                using AI.
              </p>

              <button
                onClick={() => navigate("/")}
                style={styles.primaryButton}
              >
                🔬 Detect Disease
              </button>

            </div>

          ) : (

            <div style={styles.diseaseGrid}>

              {diseaseHistory.map(
                (item, index) => (

                  <div
                    key={item.id}
                    style={styles.diseaseCard}
                  >

                    {/* DISEASE HEADER */}

                    <div style={styles.diseaseHeader}>

                      <div>

                        <span style={styles.cardNumber}>
                          Report #{index + 1}
                        </span>

                        <h3 style={styles.diseaseTitle}>
                          🌿 Plant Disease Report
                        </h3>

                      </div>

                      <span style={styles.dateBadge}>
                        {formatDate(item.createdAt)}
                      </span>

                    </div>


                    {/* IMAGE NAME */}

                    <div style={styles.imageNameBox}>

                      <span style={styles.imageIcon}>
                        📷
                      </span>

                      <div>

                        <p style={styles.imageLabel}>
                          Plant Image
                        </p>

                        <p style={styles.imageName}>
                          {item.imageName ||
                            "Uploaded plant image"}
                        </p>

                      </div>

                    </div>


                    {/* DIAGNOSIS */}

                    <div style={styles.diagnosisBox}>

                      <p style={styles.diagnosisTitle}>
                        🤖 AI Diagnosis
                      </p>

                      <div style={styles.diagnosisText}>
                        {item.diagnosis ||
                          "No diagnosis available."}
                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* =================================================
            BACK HOME
            ================================================= */}

        <div style={styles.bottomAction}>

          <button
            onClick={() => navigate("/")}
            style={styles.primaryButton}
          >
            🌾 Go to AgriNova AI
          </button>

        </div>

      </main>

    </div>
  );
}


/* =========================================================
   VALUE COMPONENT
   ========================================================= */

function Value({ label, value, icon }) {
  return (
    <div style={styles.valueBox}>

      <span style={styles.valueIcon}>
        {icon}
      </span>

      <div>

        <p style={styles.valueLabel}>
          {label}
        </p>

        <p style={styles.value}>
          {value ?? "—"}
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   DATE FORMATTER
   ========================================================= */

function formatDate(value) {
  if (!value) return "Date unavailable";

  try {

    if (value?.seconds) {
      return new Date(
        value.seconds * 1000
      ).toLocaleString();
    }

    if (typeof value?.toDate === "function") {
      return value.toDate().toLocaleString();
    }

    return new Date(value).toLocaleString();

  } catch {
    return "Date unavailable";
  }
}


/* =========================================================
   STYLES
   ========================================================= */

const styles = {

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f1faef 0%, #ffffff 55%, #eef9ed 100%)",
    color: "#214b26",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },


  /* HEADER */

  header: {
    background:
      "linear-gradient(135deg, #2e7d32, #1b5e20)",
    color: "white",
    padding: "16px 6%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    boxShadow:
      "0 4px 18px rgba(0,0,0,0.12)",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  brandIcon: {
    fontSize: "34px",
  },

  brandTitle: {
    margin: 0,
    fontSize: "24px",
  },

  brandSubtitle: {
    margin: "3px 0 0",
    fontSize: "12px",
    opacity: 0.85,
  },

  headerActions: {
    display: "flex",
    gap: "10px",
  },

  homeButton: {
    border: "1px solid rgba(255,255,255,0.5)",
    background: "rgba(255,255,255,0.12)",
    color: "white",
    padding: "10px 16px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: 600,
  },

  logoutButton: {
    border: "none",
    background: "#c62828",
    color: "white",
    padding: "10px 16px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: 600,
  },


  /* MAIN */

  container: {
    width: "92%",
    maxWidth: "1150px",
    margin: "0 auto",
    padding: "35px 0 55px",
  },


  /* WELCOME */

  welcomeCard: {
    background: "white",
    borderRadius: "22px",
    padding: "28px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow:
      "0 10px 30px rgba(46,125,50,0.10)",
    border: "1px solid #e4f0e4",
    marginBottom: "25px",
  },

  welcomeSmall: {
    color: "#4d8a50",
    fontWeight: 700,
    margin: "0 0 6px",
    fontSize: "14px",
  },

  welcomeTitle: {
    margin: 0,
    color: "#1b5e20",
    fontSize: "30px",
  },

  email: {
    margin: "7px 0 0",
    color: "#777",
    fontSize: "14px",
  },

  welcomeEmoji: {
    fontSize: "58px",
  },


  /* STATS */

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "40px",
  },

  statCard: {
    background: "white",
    borderRadius: "18px",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    border:
      "1px solid #e3efe3",
    boxShadow:
      "0 8px 22px rgba(46,125,50,0.08)",
  },

  statIcon: {
    width: "55px",
    height: "55px",
    borderRadius: "15px",
    background: "#e8f5e9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
  },

  statNumber: {
    margin: 0,
    color: "#1b5e20",
    fontSize: "26px",
    fontWeight: 800,
  },

  statLabel: {
    margin: "3px 0 0",
    color: "#6d786d",
    fontSize: "13px",
  },


  /* SECTION */

  section: {
    marginBottom: "45px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  sectionTitle: {
    margin: 0,
    color: "#245d2a",
    fontSize: "25px",
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#718071",
    fontSize: "14px",
  },

  countBadge: {
    minWidth: "38px",
    height: "38px",
    padding: "0 10px",
    borderRadius: "20px",
    background: "#2e7d32",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
  },


  /* CROP CARDS */

  historyGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "22px",
  },

  cropCard: {
    background: "white",
    borderRadius: "20px",
    padding: "23px",
    borderTop:
      "4px solid #2e7d32",
    boxShadow:
      "0 8px 25px rgba(46,125,50,0.09)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "18px",
  },

  cardNumber: {
    display: "inline-block",
    color: "#558b59",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "4px",
  },

  cropTitle: {
    margin: 0,
    color: "#285d2d",
    fontSize: "18px",
  },

  dateBadge: {
    color: "#607660",
    background: "#f0f8f0",
    borderRadius: "8px",
    padding: "7px 9px",
    fontSize: "11px",
    height: "fit-content",
    whiteSpace: "nowrap",
  },

  valuesGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "18px",
  },

  valueBox: {
    background: "#f5fbf5",
    borderRadius: "11px",
    padding: "10px",
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },

  valueIcon: {
    fontSize: "17px",
  },

  valueLabel: {
    margin: 0,
    color: "#758075",
    fontSize: "10px",
  },

  value: {
    margin: "3px 0 0",
    color: "#245d2a",
    fontSize: "14px",
    fontWeight: 700,
  },

  /* =========================================================
     RECOMMENDATION
     ========================================================= */

  recommendationBox: {
    background:
      "linear-gradient(135deg, #eef9ed, #f8fff7)",
    borderRadius: "13px",
    padding: "15px",
    border: "1px solid #d9ecd9",
  },

  recommendationTitle: {
    margin: "0 0 8px",
    color: "#2e7d32",
    fontWeight: 800,
    fontSize: "14px",
  },

  recommendationText: {
    color: "#435243",
    fontSize: "13px",
    lineHeight: 1.65,
    whiteSpace: "pre-wrap",
  },

  /* =========================================================
     DISEASE HISTORY
     ========================================================= */

  diseaseGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "22px",
  },

  diseaseCard: {
    background: "white",
    borderRadius: "20px",
    padding: "23px",
    borderTop: "4px solid #66bb6a",
    boxShadow:
      "0 8px 25px rgba(46,125,50,0.09)",
  },

  diseaseHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "18px",
  },

  diseaseTitle: {
    margin: 0,
    color: "#285d2d",
    fontSize: "18px",
  },

  imageNameBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#f5fbf5",
    padding: "13px",
    borderRadius: "12px",
    marginBottom: "15px",
  },

  imageIcon: {
    fontSize: "25px",
  },

  imageLabel: {
    margin: 0,
    color: "#788278",
    fontSize: "11px",
  },

  imageName: {
    margin: "3px 0 0",
    color: "#315f35",
    fontWeight: 700,
    fontSize: "13px",
    wordBreak: "break-word",
  },

  diagnosisBox: {
    background: "#f7fff7",
    border: "1px solid #dceede",
    borderRadius: "13px",
    padding: "15px",
  },

  diagnosisTitle: {
    margin: "0 0 9px",
    color: "#2e7d32",
    fontWeight: 800,
    fontSize: "14px",
  },

  diagnosisText: {
    color: "#435243",
    fontSize: "13px",
    lineHeight: 1.65,
    whiteSpace: "pre-wrap",
  },
    /* =========================================================
     EMPTY STATE
     ========================================================= */

  emptyBox: {
    background: "white",
    borderRadius: "18px",
    padding: "35px 20px",
    textAlign: "center",
    border: "1px dashed #b9d8bb",
    color: "#6b786c",
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "10px",
  },

  emptyTitle: {
    margin: "0 0 6px",
    color: "#37633b",
    fontSize: "17px",
    fontWeight: 700,
  },

  emptyText: {
    margin: 0,
    fontSize: "13px",
    color: "#7b877c",
  },

  /* =========================================================
     LOADING
     ========================================================= */

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #eef9ed, #f8fff7)",
  },

  loadingCard: {
    background: "white",
    padding: "40px",
    borderRadius: "22px",
    textAlign: "center",
    boxShadow:
      "0 10px 35px rgba(46,125,50,0.12)",
  },

  loadingIcon: {
    fontSize: "45px",
    marginBottom: "12px",
  },

  loadingTitle: {
    margin: 0,
    color: "#2e7d32",
    fontSize: "20px",
  },

  loadingText: {
    marginTop: "7px",
    color: "#7b877c",
    fontSize: "13px",
  },

  /* =========================================================
     BUTTONS
     ========================================================= */

  primaryButton: {
    background:
      "linear-gradient(135deg, #2e7d32, #388e3c)",
    color: "white",
    border: "none",
    padding: "11px 22px",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  logoutButton: {
    background: "#d32f2f",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "9px",
    fontWeight: 700,
    cursor: "pointer",
  },

  viewButton: {
    background: "#edf8ed",
    color: "#2e7d32",
    border: "1px solid #cce5cd",
    padding: "9px 15px",
    borderRadius: "9px",
    fontWeight: 700,
    cursor: "pointer",
  },

  deleteButton: {
    background: "#fff1f1",
    color: "#c62828",
    border: "1px solid #ffcdd2",
    padding: "9px 15px",
    borderRadius: "9px",
    fontWeight: 700,
    cursor: "pointer",
  },

  /* =========================================================
     FOOTER
     ========================================================= */

  footer: {
    marginTop: "50px",
    padding: "25px",
    background: "#1b5e20",
    color: "white",
    textAlign: "center",
    fontSize: "13px",
  },

  footerTitle: {
    margin: "0 0 5px",
    fontWeight: 800,
    fontSize: "15px",
  },

  footerText: {
    margin: 0,
    opacity: 0.85,
  },

  /* =========================================================
     RESPONSIVE
     ========================================================= */

  "@media (max-width: 768px)": {
    dashboardContainer: {
      padding: "18px",
    },

    statsGrid: {
      gridTemplateColumns: "repeat(2, 1fr)",
    },

    diseaseGrid: {
      gridTemplateColumns: "1fr",
    },

    header: {
      flexDirection: "column",
      alignItems: "flex-start",
    },
  },

  "@media (max-width: 480px)": {
    dashboardContainer: {
      padding: "12px",
    },

    statsGrid: {
      gridTemplateColumns: "1fr",
    },

    statCard: {
      padding: "18px",
    },

    sectionTitle: {
      fontSize: "20px",
    },

    diseaseCard: {
      padding: "17px",
    },
  },
};