import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function SmartIrrigation() {
  const [moisture, setMoisture] = useState(68);
  const [crop, setCrop] = useState("Wheat");
  const [mode, setMode] = useState("Automatic");
  const [duration, setDuration] = useState("10");
  const [pump, setPump] = useState(false);
  const [weather, setWeather] = useState(null);

  const loadWeather = () => {
    const savedWeather = localStorage.getItem("agrinova_weather");

    if (savedWeather) {
      try {
        setWeather(JSON.parse(savedWeather));
      } catch {
        setWeather(null);
      }
    }
  };

  useEffect(() => {
    loadWeather();

    const handleUpdate = () => loadWeather();

    window.addEventListener(
      "agrinova-weather-updated",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "agrinova-weather-updated",
        handleUpdate
      );
    };
  }, []);

  const rainProbability = weather?.rainProbability ?? 0;
  const temperature = weather?.temperature ?? 0;

  const getDecision = () => {
  // Critical dry soil has highest priority.
  if (moisture < 30) {
    return {
      type: "dry",
      title: "Critical Soil Moisture",
      message: "Soil moisture is very low. Irrigation is required."
    };
  }

  // Rain can postpone irrigation when soil is not critically dry.
  if (rainProbability >= 60) {
    return {
      type: "rain",
      title: "Rain Expected",
      message: "Irrigation should be postponed because rain is likely."
    };
  }

  if (moisture < 40) {
    return {
      type: "moderate",
      title: "Irrigation Recommended",
      message: "Soil is becoming dry. Consider irrigation soon."
    };
  }

  return {
    type: "optimal",
    title: "Optimal Soil Moisture",
    message: "Current soil moisture is sufficient."
  };
};

const decision = getDecision();

  const handleAutoIrrigation = () => {
  if (mode !== "Automatic") return;

  // Very dry soil has highest priority.
  // Even if rain is expected, protect the plant when moisture is critically low.
  if (moisture < 30) {
    setPump(true);

    const wateringTime = Number(duration) * 60 * 1000;

    setTimeout(() => {
      setPump(false);
    }, wateringTime);

    return;
  }

  // If rain is expected and soil is not critically dry, postpone irrigation.
  if (rainProbability >= 60) {
    setPump(false);
    return;
  }

  // Soil is becoming dry.
  if (moisture < 40) {
    setPump(true);

    const wateringTime = Number(duration) * 60 * 1000;

    setTimeout(() => {
      setPump(false);
    }, wateringTime);

    return;
  }

  // Soil moisture is sufficient.
  setPump(false);
};

const getStatusClass = () => {
    if (decision.type === "rain") return "rain";
    if (decision.type === "dry") return "dry";
    if (decision.type === "moderate") return "moderate";
    return "optimal";
  };

  const handlePumpToggle = () => {
  // Manual pump control
  // Rain condition only affects automatic irrigation.
  setPump(prev => !prev);
};

return (
    <section className="irrigation-section">

      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        💧 Smart Irrigation System
      </motion.h2>

      <div className="irrigation-container">

        {/* SOIL MOISTURE */}
        <motion.div
          className="irrigation-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="irrigation-icon">💧</div>

          <h3>Soil Moisture</h3>

          <div className="moisture-value">
            {moisture}%
          </div>

          <div className="moisture-bar">
            <div
              className="moisture-fill"
              style={{ width: `${moisture}%` }}
            />
          </div>

          <p>
            Status:{" "}
            <strong>
              {moisture < 30
                ? "Dry"
                : moisture < 40
                ? "Low"
                : moisture < 70
                ? "Moderate"
                : "Optimal"}
            </strong>
          </p>

          <label>Test Soil Moisture</label>

          <input
            type="range"
            min="0"
            max="100"
            value={moisture}
            onChange={(e) =>
              setMoisture(Number(e.target.value))
            }
          />

          <small>
            Slider simulates sensor readings.
          </small>
        </motion.div>


        {/* IRRIGATION DECISION */}
<motion.div
          className="irrigation-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="irrigation-icon">🧠</div>

          <h3>AI Irrigation Decision</h3>

          <div className={`irrigation-decision ${getStatusClass()}`}>
            <strong>{decision.title}</strong>
            <p>{decision.message}</p>
          </div>

          <button
            className="irrigation-button"
            onClick={handlePumpToggle}
                  >
            {decision.type === "rain"
              ? "🚫 Irrigation Blocked"
              : pump
                ? "Turn Pump OFF"
                : "Turn Pump ON"}
          </button>

          <button
            className="irrigation-button auto-button"
            onClick={handleAutoIrrigation}
          >
            🤖 Auto Irrigation
          </button>

          <div className={`pump-status ${pump ? "pump-on" : "pump-off"}`}>
            {pump ? "🟢 PUMP ON" : "🔴 PUMP OFF"}
          </div>
        </motion.div>
{/* WEATHER + SETTINGS */}
        <motion.div
          className="irrigation-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="irrigation-icon">🌦️</div>

          <h3>Smart Settings</h3>

          <label>Crop</label>

          <select
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
          >
            <option>Wheat</option>
            <option>Rice</option>
            <option>Maize</option>
            <option>Sugarcane</option>
            <option>Tomato</option>
            <option>Potato</option>
          </select>

          <label>Mode</label>

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option>Automatic</option>
            <option>Manual</option>
          </select>

          <label>Watering Duration</label>

          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="5">5 Minutes</option>
            <option value="10">10 Minutes</option>
            <option value="15">15 Minutes</option>
            <option value="20">20 Minutes</option>
            <option value="30">30 Minutes</option>
          </select>

          <div className="irrigation-weather">
            <strong>🌧️ Rain Probability:</strong>
            <span>{rainProbability}%</span>

            <strong>🌡️ Temperature:</strong>
            <span>
              {weather ? `${temperature}°C` : "Weather unavailable"}
            </span>

            <strong>🌾 Crop:</strong>
            <span>{crop}</span>
          </div>
        </motion.div>

      </div>
     {/* FINAL RECOMMENDATION */}
      <motion.div
        className={`irrigation-alert ${getStatusClass()}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {decision.type === "rain" && "🌧️ "}
        {decision.type === "dry" && "🚨 "}
        {decision.type === "moderate" && "💧 "}
        {decision.type === "optimal" && "✅ "}

        <strong>{decision.title}</strong>

        <br />

        {decision.message}
      </motion.div>

    </section>
  );
}
