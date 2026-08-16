import { useState } from "react";
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
      const response = await fetch("http://127.0.0.1:5000/recommend", {
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

          {auth.currentUser && (
            <small>✅ Saved to your farming history</small>
          )}
        </motion.div>
      )}
    </motion.section>
  );
}