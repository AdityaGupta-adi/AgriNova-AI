import { useState, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FaMicrophone, FaRobot, FaTrash, FaCopy } from "react-icons/fa";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function AIChatbot() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [typingText, setTypingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [followUps, setFollowUps] = useState([]);

  const recognitionRef = useRef(null);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (e) => {
      setQuestion(e.results[0][0].transcript);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const speakAnswer = (text) => {
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  };

  const copyAnswer = async () => {
    if (!typingText) return;

    await navigator.clipboard.writeText(typingText);

    alert("Answer copied.");
  };

  const clearChat = () => {
    setQuestion("");
    setAnswer("");
    setTypingText("");
    setChatHistory([]);
  };

  const typeWriter = (text) => {
    setTypingText("");

    let i = 0;

    const interval = setInterval(() => {
      i++;

      setTypingText(text.slice(0, i));

      if (i >= text.length) {
        clearInterval(interval);
      }
    }, 10);
  };

  const askAI = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3.6-flash",
      });

      const result = await model.generateContent(`
You are AgriNova AI, a professional farmer-friendly agricultural assistant.

Your goal is to give practical, safe and easy-to-understand farming guidance.

Answer the farmer in SIMPLE ENGLISH.

IMPORTANT RESPONSE FORMAT:

🌱 Problem:
Give the main problem in one short sentence.

🔍 Possible Causes:
- Give 2 to 4 likely causes.
- Do not claim certainty without enough information.

🛠️ What To Do:
1. Give the most useful action first.
2. Give simple practical steps.
3. Mention watering, soil, pests, nutrients or weather only when relevant.

🛡️ Prevention:
- Give 2 or 3 simple prevention tips.

⚠️ Warning:
Mention when the farmer should stop treatment or contact a local agriculture expert.

📌 Farmer Tip:
Give one highly practical final tip.

RULES:
- Keep the answer concise.
- Use short bullet points.
- Never invent sensor readings, weather data or scientific facts.
- For disease questions, clearly distinguish possible disease from confirmed diagnosis.
- For pesticide or fertilizer advice, tell the farmer to follow the product label and local agricultural guidance.
- Never recommend dangerous chemical mixtures.
- If important information is missing, ask one short follow-up question.
- If the question is unrelated to farming/agriculture, politely say that AgriNova AI is designed primarily for agriculture.

Question:
${question}
`)

      const response = await result.response;

      const cleanText = response
        .text()
        .replace(/\*\*/g, "")
        .replace(/###/g, "")
        .replace(/##/g, "")
        .replace(/#/g, "");

      let finalText = cleanText;
    let extractedFollowUps = [];

    const followUpMatch = cleanText.match(
        /FOLLOW_UPS:\s*\[([\s\S]*?)\]/i
      );

      const simpleFollowUpMatch = cleanText.match(
        /(?:\*?Follow-up question:?\*?|Follow-up Question:?)[\s]*(.+?)(?:\n|$)/i
      );

      if (followUpMatch) {
        const optionMatches =
          followUpMatch[1].match(/["']([^"']+)["']/g) || [];

        extractedFollowUps = optionMatches
          .map((item) => item.slice(1, -1).trim())
          .filter(Boolean)
          .slice(0, 3);

        finalText = cleanText
          .replace(/FOLLOW_UPS:\s*\[[\s\S]*?\]/i, "")
          .trim();

      } else if (simpleFollowUpMatch) {
        extractedFollowUps = [simpleFollowUpMatch[1].trim()]
          .filter(Boolean)
          .slice(0, 3);

        finalText = cleanText
          .replace(
            /(?:\*?Follow-up question:?\*?|Follow-up Question:?)[\s]*(.+?)(?:\n|$)/i,
            ""
          )
          .trim();
      }

      setFollowUps(extractedFollowUps);
    setAnswer(finalText);

      typeWriter(cleanText);

      setChatHistory((prev) => [
        ...prev,
        {
          question,
          answer: cleanText,
        },
      ]);

      speakAnswer(cleanText);

    } catch (err) {
      console.error(err);
      setAnswer("Failed to connect to Gemini AI.");
    }

    setLoading(false);
  };
  return (
  <section className="ai-chat">

    <h2>
      <FaRobot /> AI Farming Assistant
    </h2>

    <div className="quick-questions">
  <button onClick={() => setQuestion("What is the best irrigation method for my crop?")}>
    💧 Irrigation
  </button>

  <button onClick={() => setQuestion("Which fertilizer should I use for better crop growth?")}>
    🧪 Fertilizer
  </button>

  <button onClick={() => setQuestion("How can I identify and control common crop pests?")}>
    🐛 Pest Control
  </button>

  <button onClick={() => setQuestion("How can I identify plant diseases from symptoms?")}>
    🌱 Disease
  </button>

  <button onClick={() => setQuestion("Which crop is suitable for my soil and weather conditions?")}>
    🌾 Crop Advice
  </button>
</div>

<div className="chat-box">

      <input
        type="text"
        placeholder="Ask any farming question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <button onClick={startListening}>
        <FaMicrophone />
      </button>

      <button onClick={askAI}>
        {loading ? "Thinking..." : "Ask AI"}
      </button>

      <button onClick={clearChat}>
        <FaTrash />
      </button>

    </div>

    {chatHistory.length > 0 && (
      <div className="chat-history">

        {chatHistory.map((chat, index) => (

          <div key={index} className="chat-item">

            <div className="user-message">
              <strong>🧑 You</strong>
              <p>{chat.question}</p>
            </div>

            <div className="ai-message">
              <strong>🤖 AgriNova AI</strong>
              <p style={{ whiteSpace: "pre-line" }}>
                {index === chatHistory.length - 1 ? typingText : chat.answer}
              </p>

              <button
                className="copy-btn"
                onClick={copyAnswer}
              >
                <FaCopy /> Copy
              </button>

            </div>

          </div>

        ))}

      </div>
    )}

  
      {followUps.length > 0 && (
        <div className="follow-ups">
          <strong>💡 Continue with:</strong>
          <div className="follow-up-buttons">
            {followUps.map((option, index) => (
              <button
                key={index}
                onClick={() => setQuestion(option)}
                className="follow-up-btn"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

</section>
);
}