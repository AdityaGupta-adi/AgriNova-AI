import { useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  FaRobot,
  FaMicrophone,
  FaStop,
  FaPaperPlane,
  FaTrash,
  FaCopy,
  FaVolumeUp,
  FaLeaf,
  FaSeedling,
  FaTint,
  FaBug,
  FaHeartbeat,
  FaCheckCircle,
} from "react-icons/fa";
import "./AIChatbot.css";

const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY
);

const quickQuestions = [
  {
    icon: <FaTint />,
    label: "Irrigation",
    question: "What is the best irrigation method for my crop?",
  },
  {
    icon: <FaSeedling />,
    label: "Fertilizer",
    question: "Which fertilizer should I use for better crop growth?",
  },
  {
    icon: <FaBug />,
    label: "Pest Control",
    question: "How can I identify and control common crop pests?",
  },
  {
    icon: <FaHeartbeat />,
    label: "Disease",
    question: "How can I identify plant diseases from symptoms?",
  },
  {
    icon: <FaLeaf />,
    label: "Crop Advice",
    question: "Which crop is suitable for my soil and weather conditions?",
  },
];

export default function AIChatbot() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [typingText, setTypingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [followUps, setFollowUps] = useState([]);

  const recognitionRef = useRef(null);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setQuestion(text);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setListening(false);
  };

  const speakAnswer = (text) => {
    if (!window.speechSynthesis || !text) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    speech.rate = 0.95;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  };

  const copyAnswer = async (text = answer) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      alert("AI answer copied.");
    } catch {
      alert("Unable to copy answer.");
    }
  };

  const clearChat = () => {
    setQuestion("");
    setAnswer("");
    setTypingText("");
    setFollowUps([]);
    setChatHistory([]);
  };

  const typeWriter = (text) => {
    setTypingText("");

    let index = 0;

    const interval = setInterval(() => {
      index++;

      setTypingText(text.slice(0, index));

      if (index >= text.length) {
        clearInterval(interval);
      }
    }, 8);
  };

  const extractFollowUps = (text) => {
    const matches = text.match(
      /(?:FOLLOW[- ]?UPS?|Follow[- ]up questions?)\s*:?\s*((?:\n|.)*)/i
    );

    if (!matches) return [];

    return matches[1]
      .split("\n")
      .map((item) =>
        item
          .replace(/^[\s\d\-\*\•\)\.]+/, "")
          .trim()
      )
      .filter(Boolean)
      .slice(0, 3);
  };

  const askAI = async (customQuestion = null) => {
    const currentQuestion = (
      customQuestion || question
    ).trim();

    if (!currentQuestion || loading) return;

    setQuestion(currentQuestion);
    setLoading(true);
    setAnswer("");
    setTypingText("");
    setFollowUps([]);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3.6-flash",
      });

      const result = await model.generateContent(`
You are AgriNova AI, a professional farmer-friendly agricultural assistant.

Your goal is to provide practical, safe and easy-to-understand farming guidance.

Answer in SIMPLE ENGLISH.

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

👨‍🌾 Farmer Tip:
Give one highly practical final tip.
RULES:
- Keep the answer concise.
- Use short bullet points.
- Never invent sensor readings, weather data or scientific facts.
- For disease questions, clearly say that visual symptoms alone cannot confirm a diagnosis.
- For pesticide or fertilizer advice, tell the farmer to follow the product label and local agricultural guidance.
- Never recommend dangerous chemical mixtures.
- If important information is missing, ask ONE short follow-up question.
- If unrelated to agriculture, politely say that AgriNova AI is primarily designed for farming assistance.

Do NOT include a separate FOLLOW-UPS heading.

Farmer Question:
${currentQuestion}
      `);

      const response = await result.response;
      const cleanText = response.text().trim();

      const extracted = extractFollowUps(cleanText);

      const finalText = cleanText
        .replace(
          /(?:FOLLOW[- ]?UPS?|Follow[- ]up questions?)\s*:?\s*((?:\n|.)*)/i,
          ""
        )
        .trim();

      setAnswer(finalText);
      setFollowUps(extracted);

      typeWriter(finalText);

      setChatHistory((previous) => [
        ...previous,
        {
          question: currentQuestion,
          answer: finalText,
        },
      ]);

      speakAnswer(finalText);

    } catch (error) {
      console.error(error);

      const errorMessage =
        "I could not connect to Gemini AI right now. Please check your internet connection and Gemini API key.";

      setAnswer(errorMessage);
      typeWriter(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-chat">

      <div className="ai-chat-header">

        <div className="ai-brand">

          <div className="ai-logo">
            <FaRobot />
          </div>

          <div>
            <div className="ai-title-row">
              <h2>AgriNova AI</h2>
              <span className="ai-live-dot"></span>
            </div>

            <p>Smart Farming Assistant</p>
          </div>

        </div>

        <div className="ai-status">
          <FaCheckCircle />
          <span>AI Online</span>
        </div>

      </div>

      <div className="ai-intro">

        <div className="ai-intro-icon">
          <FaLeaf />
        </div>

        <div>
          <h3>Your intelligent farming companion</h3>

          <p>
            Ask about crops, irrigation, soil, fertilizers,
            pests, diseases and smart farming.
          </p>
        </div>

      </div>

      <div className="quick-section">

        <div className="quick-title">
          <span>⚡ Quick Questions</span>
          <small>Tap to ask</small>
        </div>

        <div className="quick-questions">

          {quickQuestions.map((item, index) => (

            <button
              key={index}
              className="quick-chip"
              onClick={() => {
                setQuestion(item.question);
                askAI(item.question);
              }}
              disabled={loading}
            >

              <span className="quick-chip-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>

            </button>

          ))}

        </div>

      </div>

      <div className="chat-area">

        {chatHistory.length === 0 && !loading ? (

          <div className="empty-ai-state">

            <div className="empty-ai-icon">
              <FaSeedling />
            </div>

            <h3>How can I help your farm?</h3>

            <p>
              Ask your farming question below and
              AgriNova AI will guide you.
            </p>

            <div className="empty-suggestions">
              <span>🌱 Crop advice</span>
              <span>💧 Irrigation</span>
              <span>🪲 Pest control</span>
              <span>🌿 Plant health</span>
            </div>

          </div>

        ) : (

          chatHistory.map((chat, index) => (

            <div className="chat-item" key={index}>

              <div className="message-row user-row">

                <div className="message-avatar user-avatar">
                  👨‍🌾
                </div>

                <div className="message user-message">
     <div className="message-label">
                    You
                  </div>

                  <p>{chat.question}</p>

                </div>

              </div>

              <div className="message-row ai-row">

                <div className="message-avatar ai-avatar">
                  <FaRobot />
                </div>

                <div className="message ai-message">

                  <div className="message-top">

                    <div className="message-label">
                      AgriNova AI
                    </div>

                    <span className="ai-mini-badge">
                      AI
                    </span>

                  </div>

                  <p>
                    {index === chatHistory.length - 1
                      ? typingText || chat.answer
                      : chat.answer}
                  </p>

                  <div className="message-actions">

                    <button
                      onClick={() => copyAnswer(chat.answer)}
                      title="Copy answer"
                    >
                      <FaCopy />
                      Copy
                    </button>

                    <button
                      onClick={() => speakAnswer(chat.answer)}
                      title="Read answer"
                    >
                      <FaVolumeUp />
                      Listen
                    </button>

                  </div>

                </div>

              </div>

            </div>

          ))

        )}

        {loading && (

          <div className="message-row ai-row">

            <div className="message-avatar ai-avatar thinking-avatar">
              <FaRobot />
            </div>

            <div className="message ai-message thinking-message">

              <div className="message-label">
                AgriNova AI
              </div>

              <div className="thinking-content">

                <span>Thinking</span>

                <div className="thinking-dots">
                  <i></i>
                  <i></i>
                  <i></i>
                </div>

              </div>

            </div>

          </div>

        )}

      </div>

      {!loading && followUps.length > 0 && (

        <div className="follow-up-section">

          <div className="follow-up-title">
            🌱 Continue the conversation
          </div>

          <div className="follow-up-buttons">

            {followUps.map((item, index) => (
<button
                key={index}
                onClick={() => askAI(item)}
              >
                {item}
              </button>

            ))}

          </div>

        </div>

      )}

      <div className="ai-input-wrapper">

        <div className="input-top">

          <span>Ask AgriNova AI</span>

          <span className="secure-text">
            🔒 Smart & Farmer-Friendly
          </span>

        </div>

        <div className="chat-input-box">

          <textarea
            rows="1"
            value={question}
            placeholder="Ask anything about farming..."
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {

              if (
                e.key === "Enter" &&
                !e.shiftKey
              ) {

                e.preventDefault();
                askAI();

              }

            }}
          />

          <div className="input-actions">

            <button
              className={`voice-button ${
                listening ? "listening" : ""
              }`}
              onClick={
                listening
                  ? stopListening
                  : startListening
              }
            >

              {listening ? (
                <FaStop />
              ) : (
                <FaMicrophone />
              )}

            </button>

            <button
              className="send-button"
              onClick={() => askAI()}
              disabled={!question.trim() || loading}
            >

              {loading ? (
                <span className="send-spinner"></span>
              ) : (
                <FaPaperPlane />
              )}

            </button>

          </div>

        </div>

        <div className="input-hint">

          <span>
            Press <b>Enter</b> to ask
          </span>

          <span>
            <FaMicrophone /> Voice supported
          </span>

        </div>

      </div>

      {chatHistory.length > 0 && (

        <div className="chat-footer-actions">

          <button onClick={clearChat}>
            <FaTrash />
            Clear Conversation
          </button>

        </div>

      )}

    </section>
  );
}

