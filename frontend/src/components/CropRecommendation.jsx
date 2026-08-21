import { useEffect, useState } from "react";
import "./CropRecommendation.css";
import { FaSeedling } from "react-icons/fa";
import { motion } from "framer-motion";

import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function CropRecommendation() {
  const [formData, setFormData] = useState({
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    ph: "",
    temperature: "",
    humidity: "",
  });

  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const [liveWeather, setLiveWeather] = useState({
    temperature: "",
    humidity: "",
    rainProbability: ""
  });

  // ================================
  // PHASE 2.1 - FARM RISK ENGINE
  // ================================
  const calculateFarmRisk = () => {
    const temp = Number(formData.temperature);
    const humidity = Number(formData.humidity);
    const rain = Number(liveWeather.rainProbability || 0);
    const n = Number(formData.nitrogen);
    const pValue = Number(formData.phosphorus);
    const k = Number(formData.potassium);
    const phValue = Number(formData.ph);

    let rainRisk = rain >= 70 ? "HIGH" : rain >= 40 ? "MEDIUM" : "LOW";

    let moistureRisk =
      rain >= 70 || humidity >= 90
        ? "HIGH"
        : rain >= 40 || humidity >= 75
        ? "MEDIUM"
        : "LOW";

    let temperatureRisk =
      temp < 10 || temp > 38
        ? "HIGH"
        : temp < 15 || temp > 32
        ? "MEDIUM"
        : "LOW";

    let nutrientRisk =
      n < 30 || n > 150 ||
      pValue < 15 || pValue > 100 ||
      k < 30 || k > 150
        ? "HIGH"
        : n < 50 || pValue < 25 || k < 50
        ? "MEDIUM"
        : "LOW";

    let phRisk =
      phValue < 5.5 || phValue > 8.5
        ? "HIGH"
        : phValue < 6 || phValue > 8
        ? "MEDIUM"
        : "LOW";

    const risks = [rainRisk, moistureRisk, temperatureRisk, nutrientRisk, phRisk];

    const highCount = risks.filter((r) => r === "HIGH").length;
    const mediumCount = risks.filter((r) => r === "MEDIUM").length;

    const overallRisk =
      highCount >= 2
        ? "HIGH"
        : highCount === 1 || mediumCount >= 2
        ? "MEDIUM"
        : "LOW";

    let action = "🌱 Conditions look stable. Continue normal crop monitoring.";

    if (rainRisk === "HIGH") {
      action =
        "🌧️ High rainfall probability detected. Avoid unnecessary irrigation and monitor field drainage.";
    } else if (temperatureRisk === "HIGH") {
      action =
        "🌡️ Temperature stress detected. Monitor crop closely and adjust irrigation according to field conditions.";
    } else if (nutrientRisk === "HIGH") {
      action =
        "🧪 Nutrient imbalance detected. Consider soil testing before applying fertilizer.";
    } else if (phRisk === "HIGH") {
      action =
        "⚗️ Soil pH is outside the preferred range. Soil amendment may be required after proper soil testing.";
    } else if (moistureRisk === "HIGH") {
      action =
        "💧 High atmospheric moisture detected. Avoid over-irrigation and monitor the field for excess moisture.";
    }

    return {
      rainRisk,
      moistureRisk,
      temperatureRisk,
      nutrientRisk,
      phRisk,
      overallRisk,
      action,
    };
  };

  const farmRisk = calculateFarmRisk();

const calculateCropIntelligence = (crop) => {
  if (!crop) return null;

  const n = Number(formData.nitrogen);
  const ph = Number(formData.ph);
  const temp = Number(formData.temperature);
  const humidity = Number(formData.humidity);
  const rain = Number(liveWeather.rainProbability) || 0;

  const baseScore = Number(crop.score) || 0;

  let soilScore = 0;
  if (n >= 20 && n <= 140) soilScore++;
  if (Number(formData.phosphorus) >= 10 && Number(formData.phosphorus) <= 100) soilScore++;
  if (Number(formData.potassium) >= 10 && Number(formData.potassium) <= 150) soilScore++;
  if (ph >= 5.5 && ph <= 8) soilScore++;

  const soilCompatibility = Math.round((soilScore / 4) * 100);

  let climateScore = 0;
  if (temp >= 15 && temp <= 35) climateScore++;
  if (humidity >= 40 && humidity <= 85) climateScore++;

  const climateCompatibility = Math.round((climateScore / 2) * 100);

  let waterStatus = "Moderate";

  if (rain >= 70 || humidity >= 85) {
    waterStatus = "High";
  } else if (rain <= 30 && humidity < 50) {
    waterStatus = "Low";
  }

  const risks = [
    farmRisk.rainRisk,
    farmRisk.moistureRisk,
    farmRisk.temperatureRisk,
    farmRisk.nutrientRisk,
    farmRisk.phRisk
  ];

  const highRisks = risks.filter(r => r === "HIGH").length;
  const mediumRisks = risks.filter(r => r === "MEDIUM").length;

  const riskPenalty = Math.min(
    15,
    highRisks * 5 + mediumRisks * 2
  );

  const weightedScore =
    baseScore * 0.60 +
    soilCompatibility * 0.20 +
    climateCompatibility * 0.20;

  const finalScore = Math.max(
    0,
    Math.min(100, weightedScore - riskPenalty)
  );

  const reasons = [];

  if (soilCompatibility >= 75) {
    reasons.push("strong soil compatibility");
  } else if (soilCompatibility >= 50) {
    reasons.push("acceptable soil conditions");
  } else {
    reasons.push("soil conditions need improvement");
  }

  if (climateCompatibility >= 75) {
    reasons.push("favorable climate");
  } else if (climateCompatibility >= 50) {
    reasons.push("moderate climate suitability");
  } else {
    reasons.push("climate may limit growth");
  }

  if (waterStatus === "High") {
    reasons.push("high moisture/rain conditions");
  } else if (waterStatus === "Low") {
    reasons.push("limited water availability");
  } else {
    reasons.push("balanced water conditions");
  }

  let action = "Continue normal crop monitoring.";

  if (farmRisk.overallRisk === "HIGH") {
    action = "High-risk conditions detected. Monitor the field closely before irrigation or fertilizer application.";
  } else if (farmRisk.overallRisk === "MEDIUM") {
    action = "Moderate risk detected. Adjust irrigation and nutrient management according to field conditions.";
  } else if (waterStatus === "High") {
    action = "Avoid unnecessary irrigation and monitor the field for excess moisture.";
  } else if (waterStatus === "Low") {
    action = "Monitor soil moisture and provide irrigation when required.";
  }

  return {
    baseScore: Math.round(baseScore),
    soilCompatibility,
    climateCompatibility,
    waterStatus,
    riskPenalty,
    finalScore: Math.round(finalScore),
    confidence: Math.round(finalScore),
    explanation: crop.name + " is recommended because of " + reasons.join(", ") + ".",
    action
  };
};

const cropIntelligence =
  result && result.length
    ? calculateCropIntelligence(result[0])
    : null;


  useEffect(() => {
    const handleWeatherUpdate = (event) => {
      const weather = event.detail;

      if (!weather) return;

      setLiveWeather({
        temperature: weather.temperature ?? "",
        humidity: weather.humidity ?? "",
        rainProbability: weather.rainProbability ?? ""
      });
    };

    window.addEventListener(
      "agrinova-weather-updated",
      handleWeatherUpdate
    );

    return () => {
      window.removeEventListener(
        "agrinova-weather-updated",
        handleWeatherUpdate
      );
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

const recommendCrop = async () => {
    const {
      nitrogen,
      phosphorus,
      potassium,
      ph,
      temperature,
      humidity
    } = formData;

    if (
      nitrogen === "" ||
      phosphorus === "" ||
      potassium === "" ||
      ph === "" ||
      temperature === "" ||
      humidity === ""
    ) {
      alert("Please enter all soil and weather values.");
      return;
    }

    if (Number(nitrogen) < 0 || Number(nitrogen) > 200) {
      alert("Nitrogen must be between 0 and 200.");
      return;
    }

    if (Number(phosphorus) < 0 || Number(phosphorus) > 150) {
      alert("Phosphorus must be between 0 and 150.");
      return;
    }

    if (Number(potassium) < 0 || Number(potassium) > 200) {
      alert("Potassium must be between 0 and 200.");
      return;
    }

    if (Number(ph) < 0 || Number(ph) > 14) {
      alert("Soil pH must be between 0 and 14.");
      return;
    }

    if (Number(temperature) < -20 || Number(temperature) > 60) {
      alert("Temperature must be between -20°C and 60°C.");
      return;
    }

    if (Number(humidity) < 0 || Number(humidity) > 100) {
      alert("Humidity must be between 0% and 100%.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://agrinova-ai-backend.onrender.com/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nitrogen: Number(nitrogen),
          phosphorus: Number(phosphorus),
          potassium: Number(potassium),
          ph: Number(ph),
          temperature: Number(temperature),
          humidity: Number(humidity)
        })
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.recommendations) {
        throw new Error("Invalid backend response");
      }

      setResult(data.recommendations);

      if (auth.currentUser) {
        const recommendationText = data.recommendations
          .map(
            (crop, index) =>
              `${index + 1}. ${crop.name} - ${crop.score}% suitability - ${crop.reason}`
          )
          .join("\n");

        try {
          await addDoc(collection(db, "cropHistory"), {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            nitrogen: Number(nitrogen),
            phosphorus: Number(phosphorus),
            potassium: Number(potassium),
            ph: Number(ph),
            temperature: Number(temperature),
            humidity: Number(humidity),
            recommendation: recommendationText,
            createdAt: serverTimestamp()
          });
        } catch (historyError) {
          console.error("History save error:", historyError);
        }
      }
    } catch (error) {
      console.error("Crop recommendation error:", error);
      alert(
        "Unable to connect to AgriNova AI Backend. Make sure the Flask backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      className="crop-section"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <h2>
        <FaSeedling /> AI Crop Recommendation
      </h2>

      <div
          style={{
            marginBottom: "22px",
            padding: "18px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #e8fff0, #f7fff9)",
            border: "1px solid #ccefd7",
            boxShadow: "0 8px 24px rgba(25, 110, 55, 0.08)"
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap"
          }}>
            <div>
              <h3 style={{ margin: 0, color: "#176b35" }}>
                🌦️ Live Farm Weather
              </h3>
              <p style={{
                margin: "5px 0 0",
                fontSize: "13px",
                color: "#5f7666"
              }}>
                Real-time weather data can improve crop recommendations
              </p>
            </div>

            <span style={{
              padding: "6px 12px",
              borderRadius: "20px",
              background: liveWeather.temperature ? "#dff7e7" : "#fff3cd",
              color: liveWeather.temperature ? "#18753b" : "#856404",
              fontSize: "12px",
              fontWeight: "700"
            }}>
              {liveWeather.temperature ? "● LIVE DATA" : "○ WAITING"}
            </span>
          </div>

          {liveWeather.temperature ? (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
                marginTop: "16px"
              }}>
                <div style={{
                  padding: "13px",
                  background: "#fff",
                  borderRadius: "14px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "20px" }}>🌡️</div>
                  <small>Temperature</small>
                  <strong style={{ display: "block", color: "#176b35" }}>
                    {liveWeather.temperature}°C
                  </strong>
                </div>

                <div style={{
                  padding: "13px",
                  background: "#fff",
                  borderRadius: "14px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "20px" }}>💧</div>
                  <small>Humidity</small>
                  <strong style={{ display: "block", color: "#176b35" }}>
                    {liveWeather.humidity}%
                  </strong>
                </div>

                <div style={{
                  padding: "13px",
                  background: "#fff",
                  borderRadius: "14px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "20px" }}>🌧️</div>
                  <small>Rain Probability</small>
                  <strong style={{ display: "block", color: "#176b35" }}>
                    {liveWeather.rainProbability || "N/A"}%
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    temperature: liveWeather.temperature ?? prev.temperature,
                    humidity: liveWeather.humidity ?? prev.humidity
                  }))
                }
                style={{
                  width: "100%",
                  marginTop: "14px",
                  padding: "11px",
                  border: "none",
                  borderRadius: "12px",
                  background: "#237a3b",
                  color: "#fff",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                ⚡ Use Live Weather for Recommendation
              </button>
            </>
          ) : (
            <p style={{
              marginTop: "15px",
              padding: "12px",
              borderRadius: "12px",
              background: "#fff",
              color: "#68756c",
              textAlign: "center"
            }}>
              🌐 Waiting for live weather data...
            </p>
          )}
        </div>

        <div className="crop-form">

        <input
          type="number"
          name="nitrogen"
          placeholder="Nitrogen (N)"
          value={formData.nitrogen}
          onChange={handleChange}
        />

        <input
          type="number"
          name="phosphorus"
          placeholder="Phosphorus (P)"
          value={formData.phosphorus}
          onChange={handleChange}
        />

        <input
          type="number"
          name="potassium"
          placeholder="Potassium (K)"
          value={formData.potassium}
          onChange={handleChange}
        />

        <input
          type="number"
          name="ph"
          placeholder="pH"
          value={formData.ph}
          onChange={handleChange}
        />

        <input
          type="number"
          name="temperature"
          placeholder="Temperature (°C)"
          value={formData.temperature}
          onChange={handleChange}
        />

        <input
          type="number"
          name="humidity"
          placeholder="Humidity (%)"
          value={formData.humidity}
          onChange={handleChange}
        />

      </div>

      <button
        className="crop-button"
        onClick={recommendCrop}
        disabled={loading}
      >
        {loading
          ? "🤖 Processing..."
          : "🌾 Recommend Crop"}
      </button>

      {result && (
        <motion.div
          className="crop-result"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>🌱 AI Crop Recommendations</h3>

          <div className="crop-recommendation-grid">
            {result.map((crop, index) => (
              <div
                className="crop-recommendation-card"
                key={crop.name}
              >
                <div className="crop-rank">
                  {index === 0
                    ? "🥇 Best Match"
                    : index === 1
                    ? "🥈 Second Choice"
                    : "🥉 Third Choice"}
                </div>

                <h4>{crop.name}</h4>

                <div className="crop-score">
                  <span>{crop.score}%</span>
                  <small> Suitability</small>
                </div>

                <div className="crop-progress">
                  <div
                    className="crop-progress-fill"
                    style={{ width: `${crop.score}%` }}
                  />
                </div>

                <p>{crop.reason}</p>

                <span className="crop-badge">
              {crop.score >= 90
                ? "Excellent Match"
                : crop.score >= 75
                ? "Highly Suitable"
                : crop.score >= 60
                ? "Suitable"
                : "Low Match"}
            </span>
              </div>
            ))}
          </div>

          {result.length > 0 && (
            <div className="crop-intelligence-panel">

              <div className="crop-intelligence-header">
                <div>
                  <span className="crop-ai-label">🧠 AI CROP INTELLIGENCE</span>
                  <h3>Smart Farming Analysis</h3>
                  <p>Recommendation generated from your soil and environmental conditions.</p>
                </div>
                <div className="crop-confidence">
                  <span>Confidence</span>
                  <strong>{Math.round(Number(result[0]?.score || 0))}%</strong>
                </div>
              </div>

              <div className="crop-best-spotlight">
                <div className="crop-best-icon">🏆</div>

                <div className="crop-best-info">
                  <span>BEST CROP FOR YOUR CONDITIONS</span>
                  <h2>{result[0]?.name || "Recommended Crop"}</h2>
                  <p>{result[0]?.reason || "Best match based on the supplied farm conditions."}</p>
                </div>

                <div className="crop-best-score">
                  <strong>{Number(result[0]?.score || 0)}%</strong>
                  <span>Suitability</span>
                </div>
              </div>

              <div className="crop-analysis-grid">

                <div className="crop-analysis-card">
                  <div className="analysis-icon">🧪</div>
                  <div>
                    <span>SOIL ANALYSIS</span>
                    <strong>pH {formData.ph}</strong>
                    <small>
                      N {formData.nitrogen} · P {formData.phosphorus} · K {formData.potassium}
                    </small>
                  </div>
                </div>

                <div className="crop-analysis-card">
                  <div className="analysis-icon">🌡️</div>
                  <div>
                    <span>CLIMATE</span>
                    <strong>{formData.temperature}°C</strong>
                    <small>Humidity {formData.humidity}%</small>
                  </div>
                </div>

                <div className="crop-analysis-card">
                  <div className="analysis-icon">💧</div>
                  <div>
                    <span>WATER STATUS</span>
                    <strong>
                      {Number(formData.humidity) >= 80 ? "High" : "Moderate"}
                    </strong>
                    <small>
                      {Number(formData.humidity) >= 80
                        ? "Monitor excess moisture"
                        : "Regular irrigation may be needed"}
                    </small>
                  </div>
                </div>

                <div className="crop-analysis-card">
                  <div className="analysis-icon">⚠️</div>
                  <div>
                    <span>RISK LEVEL</span>
                    <strong>
                      {Number(formData.humidity) >= 90 ? "Medium" : "Low"}
                    </strong>
                    <small>
                      {Number(formData.humidity) >= 90
                        ? "High humidity detected"
                        : "Conditions look stable"}
                    </small>
                  </div>
                </div>

              </div>

              
<div style={{
  marginTop: "18px",
  padding: "18px",
  borderRadius: "18px",
  background: "linear-gradient(135deg,#f8fff9,#eefbf1)",
  border: "1px solid #d7f0dc",
  boxShadow: "0 8px 24px rgba(25,100,45,0.08)"
}}>
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "14px"
  }}>
    <div>
      <span style={{
        fontSize: "11px",
        fontWeight: "800",
        color: "#23823b",
        letterSpacing: "0.8px"
      }}>
        🚦 FARM SAFETY INTELLIGENCE
      </span>
      <h3 style={{margin:"4px 0", color:"#176b35"}}>
        Farm Risk Assessment
      </h3>
      <small style={{color:"#65756a"}}>
        AI-based analysis of current field conditions
      </small>
    </div>

    <div style={{
      padding:"9px 16px",
      borderRadius:"30px",
      fontWeight:"800",
      fontSize:"13px",
      background:
        farmRisk.overallRisk === "HIGH"
          ? "#ffe5e5"
          : farmRisk.overallRisk === "MEDIUM"
          ? "#fff1d6"
          : "#e3f7e8",
      color:
        farmRisk.overallRisk === "HIGH"
          ? "#c62828"
          : farmRisk.overallRisk === "MEDIUM"
          ? "#b26a00"
          : "#237a3b"
    }}>
      {farmRisk.overallRisk === "HIGH" ? "🔴" :
       farmRisk.overallRisk === "MEDIUM" ? "🟠" : "🟢"}
      {" "}{farmRisk.overallRisk} RISK
    </div>
  </div>

  <div style={{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit,minmax(135px,1fr))",
    gap:"10px"
  }}>
    {[
      ["🌧️","Rain","rainRisk"],
      ["💧","Moisture","moistureRisk"],
      ["🌡️","Temperature","temperatureRisk"],
      ["🧪","Nutrients","nutrientRisk"],
      ["⚗️","Soil pH","phRisk"]
    ].map(([icon,label,key]) => {
      const risk = farmRisk[key];

      return (
        <div key={key} style={{
          padding:"13px",
          borderRadius:"14px",
          background:"#fff",
          border:"1px solid #e1eee4",
          textAlign:"center"
        }}>
          <div style={{fontSize:"20px"}}>{icon}</div>
          <small style={{
            display:"block",
            marginTop:"4px",
            color:"#66756a"
          }}>
            {label}
          </small>

          <strong style={{
            display:"block",
            marginTop:"5px",
            color:
              risk === "HIGH"
                ? "#d32f2f"
                : risk === "MEDIUM"
                ? "#c47a00"
                : "#2e7d32"
          }}>
            {risk}
          </strong>
        </div>
      );
    })}
  </div>

  <div style={{
    marginTop:"14px",
    padding:"14px",
    borderRadius:"14px",
    background:"#ffffff",
    borderLeft:"5px solid #2e7d32"
  }}>
    <small style={{
      display:"block",
      color:"#6a776d",
      marginBottom:"5px"
    }}>
      🤖 AI RECOMMENDED ACTION
    </small>

    <strong style={{
      color:"#176b35",
      lineHeight:"1.5"
    }}>
      {farmRisk.action}
    </strong>
  </div>
</div>

<div className="crop-why-section">
                <div className="why-title">
                  <span>🌱</span>
                  <div>
                    <strong>Why {result[0]?.name || "this crop"}?</strong>
                    <small>Key factors considered by the recommendation engine</small>
                  </div>
                </div>

                <div className="why-points">
                  <div>✓ Soil nutrient compatibility</div>
                  <div>✓ pH compatibility</div>
                  <div>✓ Temperature suitability</div>
                  <div>✓ Humidity compatibility</div>
                </div>
              </div>

            </div>
          )}

          {auth.currentUser && (
            <small>✅ Saved to your farming history</small>
          )}
        </motion.div>
      )}
    </motion.section>
  );
}