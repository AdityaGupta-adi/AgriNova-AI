import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { jsPDF } from "jspdf";
import { motion } from "framer-motion";

const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY
);

export default function PlantDiseaseDetection() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult("");
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () =>
        resolve(reader.result.split(",")[1]);

      reader.onerror = reject;
    });
    const detectDisease = async () => {
  if (!image) {
    alert("Please upload a plant image.");
    return;
  }

  setLoading(true);
  setResult("");

  try {
    const base64 = await fileToBase64(image);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
    });

    const prompt = `
You are an agriculture expert.

Analyze this plant image carefully.

Reply ONLY in simple English.

Return ONLY valid JSON. No markdown, no code fences.

Use exactly this structure:
{
  "disease": "disease name",
  "confidence": "confidence percentage",
  "cause": "main cause",
  "symptoms": "main symptoms",
  "treatment": "recommended treatment",
  "prevention": "prevention steps",
  "farmerTips": "practical farmer tips"
}

If the image is unclear or not a plant, clearly say so in the disease field and keep the other fields useful and safe.
`;

    const response = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: image.type,
          data: base64,
        },
      },
    ]);

    const text = response.response.text();

      let parsed;
      try {
        parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);

        parsed = {
          disease: "Analysis Result",
          confidence: "N/A",
          cause: text,
          symptoms: "See analysis above.",
          treatment: "Follow the recommended treatment carefully.",
          prevention: "Maintain proper plant care and monitoring.",
          farmerTips: "Consult a local agriculture expert if symptoms persist."
        };
      }

      setResult(JSON.stringify(parsed, null, 2));

    if (auth.currentUser) {
      await addDoc(collection(db, "diseaseHistory"), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        imageName: image.name,
        diagnosis: text,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("Gemini Error:", err);

    alert(err.message);

    setResult("❌ Failed to analyze image.");
  } finally {
    setLoading(false);
  }
};

const downloadPDF = () => {
  if (!result) return;

  const pdf = new jsPDF();

  pdf.setFontSize(18);
  pdf.text("AgriNova AI Plant Disease Report", 20, 20);

  pdf.setFontSize(11);

  const lines = pdf.splitTextToSize(result, 170);

  pdf.text(lines, 20, 35);

  pdf.save("Plant_Disease_Report.pdf");
};
return (
  <motion.section
    className="crop-section"
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: true }}
  >
    <h2>🌿 AI Plant Disease Detection</h2>

    <div
      style={{
        maxWidth: "900px",
        margin: "30px auto",
        background: "#ffffff",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      }}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleImage}
      />

      {preview && (
        <div
          style={{
            marginTop: "25px",
            textAlign: "center",
          }}
        >
          <img
            src={preview}
            alt="Plant"
            style={{
              width: "320px",
              maxWidth: "100%",
              borderRadius: "15px",
              border: "4px solid #2e7d32",
              boxShadow: "0 10px 25px rgba(0,0,0,.15)",
            }}
          />
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <button
          onClick={detectDisease}
          disabled={loading}
          style={{
            marginTop: "25px",
            padding: "15px 28px",
            border: "none",
            borderRadius: "12px",
            background: "#2e7d32",
            color: "#fff",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          {loading
            ? "🤖 AI is Analyzing..."
            : "🔍 Detect Disease"}
        </button>
      </div>

      {result && (() => {
  let data;

  try {
    data = JSON.parse(result);
  } catch {
    data = {
      disease: "Analysis Result",
      confidence: "N/A",
      cause: result,
      symptoms: "Please review the analysis.",
      treatment: "Follow recommended agricultural practices.",
      prevention: "Maintain proper plant care and monitoring.",
      farmerTips: "Consult a local agriculture expert if symptoms persist."
    };
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginTop: "30px",
        background: "#f8fff8",
        padding: "25px",
        borderRadius: "18px",
        lineHeight: "1.7",
        border: "1px solid #d9f0dc"
      }}
    >
      <h3 style={{
        color: "#2e7d32",
        marginBottom: "22px",
        textAlign: "center"
      }}>
        🌿 AI Plant Health Diagnosis
      </h3>

      <div style={{
        background: "#eaf7ec",
        padding: "18px",
        borderRadius: "14px",
        marginBottom: "15px"
      }}>
        <strong>🦠 Disease</strong>
        <div style={{ fontSize: "20px", fontWeight: "700", color: "#2e7d32" }}>
          {data.disease}
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "14px"
      }}>
        <div style={{ background: "#fff", padding: "15px", borderRadius: "12px" }}>
          <strong>📊 Confidence</strong>
          <p>{data.confidence}</p>
        </div>

        <div style={{ background: "#fff", padding: "15px", borderRadius: "12px" }}>
          <strong>🔬 Cause</strong>
          <p>{data.cause}</p>
        </div>

        <div style={{ background: "#fff", padding: "15px", borderRadius: "12px" }}>
          <strong>🌱 Symptoms</strong>
          <p>{data.symptoms}</p>
        </div>

        <div style={{ background: "#fff", padding: "15px", borderRadius: "12px" }}>
          <strong>💊 Treatment</strong>
          <p>{data.treatment}</p>
        </div>

        <div style={{ background: "#fff", padding: "15px", borderRadius: "12px" }}>
          <strong>🛡️ Prevention</strong>
          <p>{data.prevention}</p>
        </div>

        <div style={{ background: "#fff", padding: "15px", borderRadius: "12px" }}>
          <strong>👨‍🌾 Farmer Tips</strong>
          <p>{data.farmerTips}</p>
        </div>
      </div>

      <button
        onClick={downloadPDF}
        style={{
          marginTop: "22px",
          width: "100%",
          padding: "15px",
          background: "#1565c0",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "600"
        }}
      >
        📄 Download PDF Report
      </button>
    </motion.div>
  );
})()}
    </div>
  </motion.section>
);
}