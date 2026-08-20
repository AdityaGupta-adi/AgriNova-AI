import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { jsPDF } from "jspdf";
import { motion } from "framer-motion";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function PlantDiseaseDetection() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const cleanJSON = (text) => {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Invalid AI response.");
    return JSON.parse(cleaned.slice(start, end + 1));
  };

  const analyzeWithModel = async (modelName, base64, mimeType) => {
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
You are AgriNova AI, an agricultural plant-health vision assistant.

Analyze the uploaded plant image carefully. Identify the visible crop/plant and the most likely disease or say "Healthy / No obvious disease" when appropriate.

Return ONLY valid JSON with exactly these fields:
{
  "crop": "crop name",
  "disease": "disease name",
  "confidence": 0,
  "severity": "Low | Moderate | High | Unknown",
  "healthScore": 0,
  "imageQuality": "Excellent | Good | Fair | Poor",
  "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
  "cause": "likely cause",
  "treatment": ["step 1", "step 2", "step 3"],
  "prevention": ["step 1", "step 2", "step 3"],
  "farmerTips": ["tip 1", "tip 2", "tip 3"],
  "immediateAction": "most important immediate action",
  "irrigationAdvice": "safe irrigation guidance",
  "recoveryGuidance": "recovery and monitoring guidance"
}

Rules:
- Use simple English.
- Do not invent certainty from an unclear image.
- Confidence must be a number from 0 to 100.
- healthScore must be a number from 0 to 100.
- If the image is not a plant, set crop to "Not a plant" and explain that clearly.
- Treatment must be cautious; do not recommend dangerous chemical doses.
`;

    const response = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ]);

    return cleanJSON(response.response.text());
  };

  const detectDisease = async () => {
    if (!image) {
      alert("Please upload a plant image first.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const base64 = await fileToBase64(image);

      let parsed;
      try {
        parsed = await analyzeWithModel("gemini-3.6-flash", base64, image.type);
      } catch (firstError) {
        parsed = await analyzeWithModel("gemini-3.6-flash", base64, image.type);
      }

      setResult(parsed);

      if (auth?.currentUser) {
        try {
          await addDoc(collection(db, "diseaseHistory"), {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email || "",
            imageName: image.name,
            diagnosis: JSON.stringify(parsed),
            createdAt: serverTimestamp(),
          });
        } catch (firebaseError) {
          console.warn("History save skipped:", firebaseError);
        }
      }
    } catch (error) {
      console.error("Disease detection error:", error);
      setResult({
        crop: "Analysis unavailable",
        disease: "Unable to complete diagnosis",
        confidence: 0,
        severity: "Unknown",
        healthScore: 0,
        imageQuality: "Unknown",
        symptoms: ["AI analysis could not be completed."],
        cause: error?.message || "Temporary AI service error.",
        treatment: ["Please try again with a clear close-up plant image."],
        prevention: ["Use a well-lit image showing the affected area clearly."],
        farmerTips: ["Avoid acting on an uncertain diagnosis."],
        immediateAction: "Upload a clear image and run the analysis again.",
        irrigationAdvice: "Avoid drastic irrigation changes until the diagnosis is confirmed.",
        recoveryGuidance: "Consult a local agricultural expert if symptoms continue.",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!result) return;

    const pdf = new jsPDF();
    let y = 20;

    pdf.setFontSize(20);
    pdf.text("AgriNova AI - Plant Disease Report", 20, y);
    y += 14;

    pdf.setFontSize(12);
    const fields = [
      ["Crop", result.crop],
      ["Disease", result.disease],
      ["Confidence", `${result.confidence}%`],
      ["Severity", result.severity],
      ["Health Score", `${result.healthScore}/100`],
      ["Image Quality", result.imageQuality],
      ["Cause", result.cause],
      ["Symptoms", (result.symptoms || []).join(" • ")],
      ["Treatment", (result.treatment || []).join(" • ")],
      ["Prevention", (result.prevention || []).join(" • ")],
      ["Farmer Tips", (result.farmerTips || []).join(" • ")],
      ["Immediate Action", result.immediateAction],
      ["Irrigation Advice", result.irrigationAdvice],
      ["Recovery Guidance", result.recoveryGuidance],
    ];

    for (const [label, value] of fields) {
      pdf.setFont("helvetica", "bold");
      pdf.text(`${label}:`, 20, y);
      pdf.setFont("helvetica", "normal");

      const lines = pdf.splitTextToSize(String(value || "N/A"), 155);
      pdf.text(lines, 20, y + 7);
      y += 7 + lines.length * 6 + 5;

      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
    }

    pdf.setFontSize(9);
    pdf.text(
      "AI-generated agricultural guidance is for decision support only. Verify diagnosis with a qualified agricultural expert before applying chemical treatments.",
      20,
      285
    );

    pdf.save("AgriNova_Plant_Disease_Report.pdf");
  };

  const reset = () => {
    setImage(null);
    setPreview("");
    setResult(null);
  };

  const severityClass =
    result?.severity === "High"
      ? "#dc2626"
      : result?.severity === "Moderate"
      ? "#d97706"
      : "#16803c";

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        minHeight: "100vh",
        padding: "30px 14px 50px",
        background: "linear-gradient(180deg,#f2fff6 0%,#f8fffa 100%)",
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 42 }}>🌿</div>
          <h1 style={{ color: "#176b35", margin: "4px 0", fontSize: 28 }}>
            AI Plant Disease Detection
          </h1>
          <p style={{ color: "#66806e", margin: 0 }}>
            Advanced visual plant-health analysis powered by AgriNova AI
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #d9efdf",
            borderRadius: 22,
            padding: 22,
            boxShadow: "0 12px 35px rgba(20,90,45,.08)",
          }}
        >
          <label
            htmlFor="plant-image"
            style={{
              display: "block",
              border: "2px dashed #72c58a",
              borderRadius: 18,
              padding: 24,
              textAlign: "center",
              cursor: "pointer",
              background: "#f8fffa",
            }}
          >
            <div style={{ fontSize: 34 }}>📷</div>
            <strong style={{ color: "#176b35", fontSize: 18 }}>
              Upload Plant Image
            </strong>
            <p style={{ color: "#78907e", margin: "7px 0 0" }}>
              Use a clear, well-lit close-up of the affected leaf or plant.
            </p>
            <input
              id="plant-image"
              type="file"
              accept="image/*"
              onChange={handleImage}
              style={{ display: "none" }}
            />
          </label>

          {preview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", marginTop: 20 }}
            >
              <img
                src={preview}
                alt="Selected plant"
                style={{
                  width: "100%",
                  maxWidth: 480,
                  maxHeight: 360,
                  objectFit: "contain",
                  borderRadius: 18,
                  border: "4px solid #e0f5e6",
                  boxShadow: "0 10px 28px rgba(0,0,0,.12)",
                }}
              />
              <div style={{ color: "#4b7658", marginTop: 8 }}>
                🌱 Image Ready — {image?.name}
              </div>
            </motion.div>
          )}

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 20,
            }}
          >
            <button
              onClick={detectDisease}
              disabled={!image || loading}
              style={{
                flex: "1 1 260px",
                padding: "15px 18px",
                border: 0,
                borderRadius: 13,
                background: !image || loading ? "#9bbda5" : "#176b35",
                color: "#fff",
                fontWeight: 800,
                cursor: !image || loading ? "not-allowed" : "pointer",
                fontSize: 16,
              }}
            >
              {loading ? "🔬 AI is Analyzing..." : "🔍 Detect Plant Disease"}
            </button>

            <button
              onClick={reset}
              style={{
                flex: "1 1 150px",
                padding: "15px 18px",
                border: "1px solid #237b3d",
                borderRadius: 13,
                background: "#fff",
                color: "#176b35",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              🔄 New Analysis
            </button>
          </div>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 22,
              background: "#fff",
              border: "1px solid #d9efdf",
              borderRadius: 22,
              padding: 22,
              boxShadow: "0 12px 35px rgba(20,90,45,.08)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ color: "#176b35", fontWeight: 800 }}>
                🧠 PLANT HEALTH INTELLIGENCE
              </div>
              <h2 style={{ color: "#176b35", margin: "5px 0" }}>
                Smart Disease Analysis
              </h2>
              <p style={{ color: "#78907e", margin: 0 }}>
                AI-generated visual assessment of the uploaded plant
              </p>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg,#e8fff0,#f7fff9)",
                border: "1px solid #c8ead2",
                borderRadius: 18,
                padding: 18,
                display: "flex",
                justifyContent: "space-between",
                gap: 15,
                flexWrap: "wrap",
              }}
            >
              <div>
                <small style={{ color: "#6b8571" }}>DETECTED CROP</small>
                <h2 style={{ margin: "5px 0", color: "#176b35" }}>
                  🌱 {result.crop}
                </h2>
                <div style={{ fontWeight: 800, color: "#244c30" }}>
                  {result.disease}
                </div>
              </div>

              <div
                style={{
                  minWidth: 110,
                  textAlign: "center",
                  background: "#fff",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <small>AI CONFIDENCE</small>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#176b35" }}>
                  {result.confidence}%
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                gap: 12,
                marginTop: 14,
              }}
            >
              {[
                ["❤️", "Health Score", `${result.healthScore}/100`],
                ["⚠️", "Severity", result.severity],
                ["🎯", "Confidence", `${result.confidence}%`],
                ["📷", "Image Quality", result.imageQuality],
              ].map(([icon, label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: 15,
                    background: "#f7fbf8",
                    borderRadius: 14,
                    textAlign: "center",
                  }}
                >
                  <div>{icon}</div>
                  <small style={{ color: "#6d8273" }}>{label}</small>
                  <strong
                    style={{
                      display: "block",
                      marginTop: 4,
                      color: label === "Severity" ? severityClass : "#176b35",
                    }}
                  >
                    {value}
                  </strong>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "#607568",
                }}
              >
                <span>PLANT HEALTH</span>
                <span>{result.healthScore}%</span>
              </div>
              <div
                style={{
                  height: 10,
                  background: "#e5eee8",
                  borderRadius: 20,
                  overflow: "hidden",
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, result.healthScore))}%`,
                    height: "100%",
                    background: "#238542",
                    borderRadius: 20,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: 12,
                marginTop: 18,
              }}
            >
              {[
                ["🔎 Symptoms", result.symptoms],
                ["🧪 Possible Cause", result.cause],
                ["💊 Recommended Treatment", result.treatment],
                ["🛡️ Prevention", result.prevention],
                ["👨‍🌾 Farmer Tips", result.farmerTips],
              ].map(([title, content]) => (
                <div
                  key={title}
                  style={{
                    padding: 16,
                    background: "#fbfffc",
                    border: "1px solid #e1eee4",
                    borderRadius: 14,
                  }}
                >
                  <strong style={{ color: "#176b35" }}>{title}</strong>
                  {Array.isArray(content) ? (
                    <ul style={{ margin: "9px 0 0", paddingLeft: 20 }}>
                      {content.map((item, index) => (
                        <li key={index} style={{ marginBottom: 5 }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: "9px 0 0", lineHeight: 1.55 }}>
                      {content}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 14,
                padding: 17,
                borderRadius: 15,
                background: "#fff9e8",
                border: "1px solid #f0dfaa",
              }}
            >
              <strong>🚨 IMMEDIATE ACTION</strong>
              <p style={{ marginBottom: 0 }}>{result.immediateAction}</p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
                gap: 12,
                marginTop: 12,
              }}
            >
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: "#eef8ff",
                  border: "1px solid #cfe8fb",
                }}
              >
                <strong>💧 Irrigation Advice</strong>
                <p>{result.irrigationAdvice}</p>
              </div>

              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: "#f4efff",
                  border: "1px solid #e0d3ff",
                }}
              >
                <strong>🌱 Recovery Guidance</strong>
                <p>{result.recoveryGuidance}</p>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 14,
                background: "#f7fff8",
                border: "1px solid #cce8d2",
                color: "#55705c",
                fontSize: 13,
              }}
            >
              ⚠️ <strong>AI Safety Note:</strong> This diagnosis is decision
              support only. Verify disease identification with a qualified
              agricultural expert before applying chemical treatments.
            </div>

            <button
              onClick={downloadPDF}
              style={{
                width: "100%",
                marginTop: 18,
                padding: "15px",
                border: 0,
                borderRadius: 13,
                background: "#176b35",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              📄 Download AI Disease Report
            </button>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
