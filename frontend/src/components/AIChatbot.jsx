import { useEffect, useRef, useState } from "react";
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
  FaBug,
  FaHeartbeat,
  FaTint,
  FaCloudSun,
  FaLightbulb,
  FaCheckCircle,
  FaShieldAlt,
  FaChevronRight,
} from "react-icons/fa";

import "./AIChatbot.css";

const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY
);

const quickQuestions = [
  {
    icon: <FaLeaf />,
    label: "Crop Advice",
    question: "Which crop is suitable for my soil and weather conditions?",
  },
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
];

const smartTopics = [
  {
    icon: <FaLeaf />,
    title: "Crop Planning",
    text: "Choose suitable crops according to soil, season and climate.",
  },
  {
    icon: <FaTint />,
    title: "Smart Irrigation",
    text: "Get practical watering guidance for healthier crops.",
  },
  {
    icon: <FaSeedling />,
    title: "Soil & Fertilizer",
    text: "Improve nutrients and soil management with simple steps.",
  },
  {
    icon: <FaBug />,
    title: "Pest & Disease",
    text: "Understand symptoms and safer prevention methods.",
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

  const [farmContext, setFarmContext] = useState({
    crop: "",
    temperature: "",
    humidity: "",
    weather: "",
    soil: "",
  });

  const [contextEnabled, setContextEnabled] = useState(true);

  const getFarmContextText = () => {
    if (!contextEnabled) return "";

    const context = [];

    if (farmContext.crop) {
      context.push(`Crop: ${farmContext.crop}`);
    }

    if (farmContext.temperature) {
      context.push(`Temperature: ${farmContext.temperature}°C`);
    }

    if (farmContext.humidity) {
      context.push(`Humidity: ${farmContext.humidity}%`);
    }

    if (farmContext.weather) {
      context.push(`Weather: ${farmContext.weather}`);
    }

    if (farmContext.soil) {
      context.push(`Soil: ${farmContext.soil}`);
    }

    return context.length
      ? `\n\nCURRENT FARM CONTEXT:\n${context.join("\n")}`
      : "";
  };

  const [showTopics, setShowTopics] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const handleWeatherUpdate = (event) => {
      const weather = event.detail;

      if (!weather) return;

      setFarmContext((previous) => ({
        ...previous,
        temperature:
          weather.temperature ?? previous.temperature,
        humidity:
          weather.humidity ?? previous.humidity,
        weather:
          weather.rainProbability !== undefined
            ? `Rain probability ${weather.rainProbability}%`
            : previous.weather,
      }));
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



  const getInsightData = () => {
    const insights = [];

    if (farmContext.temperature) {
      insights.push({
        icon: "🌡️",
        label: "Temperature",
        value: `${farmContext.temperature}°C`,
      });
    }

    if (farmContext.humidity) {
      insights.push({
        icon: "💧",
        label: "Humidity",
        value: `${farmContext.humidity}%`,
      });
    }

    if (farmContext.weather) {
      insights.push({
        icon: "🌦️",
        label: "Weather",
        value: farmContext.weather,
      });
    }

    if (farmContext.crop) {
      insights.push({
        icon: "🌱",
        label: "Crop",
        value: farmContext.crop,
      });
    }

    if (farmContext.soil) {
      insights.push({
        icon: "🌍",
        label: "Soil",
        value: farmContext.soil,
      });
    }

    return insights.slice(0, 4);
  };

  const getWeatherType = (weather) => {
  if (!weather) return "";

  const value = weather.toLowerCase();

  if (value.includes("storm")) return "Stormy";
  if (value.includes("fog")) return "Foggy";
  if (value.includes("wind")) return "Windy";

  const match = value.match(/(\\d+)\\s*%/);
  if (match) {
    const probability = Number(match[1]);
    if (probability >= 70) return "Rainy";
    if (probability >= 40) return "Cloudy";
    return "Sunny";
  }

  if (value.includes("rain")) return "Rainy";
  if (value.includes("cloud")) return "Cloudy";
  if (value.includes("sun")) return "Sunny";

  return "";
};

const getRecommendationType = (text) => {
    const value = text.toLowerCase();

    if (
      value.includes("irrigat") ||
      value.includes("water")
    ) {
      return "💧 Irrigation";
    }

    if (
      value.includes("crop") ||
      value.includes("sowing") ||
      value.includes("harvest")
    ) {
      return "🌱 Crop Advice";
    }

    if (
      value.includes("fertilizer") ||
      value.includes("nutrient") ||
      value.includes("nitrogen")
    ) {
      return "🌿 Soil & Fertilizer";
    }

    if (
      value.includes("pest") ||
      value.includes("insect") ||
      value.includes("fungus") ||
      value.includes("disease")
    ) {
      return "🦠 Plant Health";
    }

    return "🤖 Farming Guidance";
  };

  const copyAnswer = async (text) => {
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
    }, 12);
  };

  const extractFollowUps = (text) => {
    const matches = text.match(
      /(?:FOLLOW[- ]?UP|FOLLOW[- ]?UP QUESTIONS?)\s*:?\s*((?:\n|.)*)/i
    );

    if (!matches) return [];

    return matches[1]
      .split("\n")
      .map((item) =>
        item
          .replace(/^[\s\d\-•*.)]+/, "")
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
You are AgriNova AI, a professional farmer-friendly agricultural assistant.Your goal is to provide practical, safe and easy-to-understand farming guidance.

Answer in SIMPLE ENGLISH.

IMPORTANT RESPONSE FORMAT:

🌱 Problem:
Give the main problem in one short sentence.

🔎 Possible Causes:
- Give 2 to 4 likely causes.
- Do not claim certainty without enough information.
🛠️ What To Do:
1. Give the most useful action first.
2. Give simple practical steps.
3. Mention watering, soil, pests, nutrients or weather only when relevant.

🌿 Prevention:
- Give 2 or 3 simple prevention tips.

⚠️ Warning:
Mention when the farmer should stop treatment or contact a local agriculture expert.
👨‍🌾 Farmer Tip:
Give one highly practical final tip.

RULES:
- Keep the answer concise and farmer-friendly.
- Use short bullet points.
- Use simple English that is easy to understand.
- Never invent sensor readings, weather data or scientific facts.
- For disease questions, clearly say that symptoms alone cannot confirm a diagnosis.
- For pesticides or fertilizers, advise following the product label and local agricultural guidance.
- Never recommend dangerous chemical mixtures.
- If important information is missing, ask ONE short follow-up question.
- If the question is unrelated to agriculture, politely say that AgriNova AI is mainly designed for farming assistance.

Farmer Question:
${currentQuestion}

${getFarmContextText()}
      `);

      const response = await result.response;
      const text = response.text().trim();

      setAnswer(text);

      setChatHistory((previous) => [
        ...previous,
        {
          question: currentQuestion,
          answer: text,
        },
      ]);

      speakAnswer(text);
      
    } catch (error) {
      console.error("Gemini Error:", error);

      const errorMessage =
        "I could not connect to Gemini AI right now. Please check your internet connection and Gemini API key.";

      setAnswer(errorMessage);
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

      <div className="farm-context-panel">

        <div className="farm-context-header">

          <div>
            <strong>🌱 Farm Context</strong>
            <small>Give AI more information about your farm</small>
          </div>

          <button
            className={`context-toggle ${
              contextEnabled ? "active" : ""
            }`}
            onClick={() =>
              setContextEnabled(!contextEnabled)
            }
          >
            {contextEnabled ? "ON" : "OFF"}
          </button>

        </div>

        {contextEnabled && (
          <div className="farm-context-grid">

            <select
                  value={farmContext.crop}
                  onChange={(e) =>
                    setFarmContext({
                      ...farmContext,
                      crop: e.target.value,
                    })
                  }
                >
                  <option value="">🌱 Select Crop</option>
                  <option value="Wheat">🌾 Wheat</option>
                  <option value="Rice">🌾 Rice</option>
                  <option value="Maize">🌽 Maize</option>
                  <option value="Sugarcane">🎋 Sugarcane</option>
                  <option value="Cotton">🌿 Cotton</option>
                  <option value="Potato">🥔 Potato</option>
                  <option value="Tomato">🍅 Tomato</option>
                  <option value="Mustard">🌼 Mustard</option>
                  <option value="Pulses">🌱 Pulses</option>
                  <option value="Other">🌿 Other</option>
                </select>

            <input
                  type="number"
                  placeholder="🌡️ Temperature °C"
                  min="-10"
                  max="60"
                  step="0.1"
                  value={farmContext.temperature}
                  onChange={(e) =>
                    setFarmContext({
                      ...farmContext,
                      temperature: e.target.value,
                    })
                  }
                />

            <input
                  type="number"
                  placeholder="💧 Humidity %"
                  min="0"
                  max="100"
                  step="1"
                  value={farmContext.humidity}
                  onChange={(e) =>
                    setFarmContext({
                      ...farmContext,
                      humidity: e.target.value,
                    })
                  }
                />

            <select
                  value={getWeatherType(farmContext.weather)}
                  onChange={(e) =>
                    setFarmContext({
                      ...farmContext,
                      weather: e.target.value,
                    })
                  }
                >
                  <option value="">🌦️ Select Weather</option>
                  <option value="Sunny">☀️ Sunny</option>
                  <option value="Cloudy">☁️ Cloudy</option>
                  <option value="Rainy">🌧️ Rainy</option>
                  <option value="Partly Cloudy">⛅ Partly Cloudy</option>
                  <option value="Stormy">⛈️ Stormy</option>
                  <option value="Foggy">🌫️ Foggy</option>
                  <option value="Windy">💨 Windy</option>
                </select>

            <select
                  value={farmContext.soil}
                  onChange={(e) =>
                    setFarmContext({
                      ...farmContext,
                      soil: e.target.value,
                    })
                  }
                >
                  <option value="">🌍 Select Soil Type</option>
                  <option value="Loamy Soil">🌱 Loamy Soil</option>
                  <option value="Clay Soil">🟤 Clay Soil</option>
                  <option value="Sandy Soil">🏜️ Sandy Soil</option>
                  <option value="Silty Soil">🌾 Silty Soil</option>
                  <option value="Peaty Soil">🌿 Peaty Soil</option>
                  <option value="Black Soil">⚫ Black Soil</option>
                  <option value="Red Soil">🔴 Red Soil</option>
                  <option value="Alluvial Soil">🌱 Alluvial Soil</option>
                </select>

          </div>
        )}

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
              <span>🌱 Crop Advice</span>
              <span>💧 Irrigation</span>
              <span>🐛 Pest Control</span>
              <span>🌿 Plant Health</span>
            </div>

          </div>

        ) : (

          chatHistory.map((chat, index) => (

            <div
              className="chat-item"
              key={index}
            >

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

                  <div className="ai-recommendation-badge">
                    {getRecommendationType(chat.answer)}
                  </div>

                  {getInsightData().length > 0 && (
                    <div className="ai-insight-card">

                      <div className="ai-insight-header">
                        <div>
                          <strong>
                            ✨ Smart Farm Insight
                          </strong>

                          <small>
                            Based on your current farm context
                          </small>
                        </div>

                        <span>
                          {getRecommendationType(chat.answer)}
                        </span>
                      </div>

                      <div className="ai-insight-grid">

                        {getInsightData().map(
                          (item, insightIndex) => (
                            <div
                              className="ai-insight-item"
                              key={insightIndex}
                            >
                              <span className="ai-insight-icon">
                                {item.icon}
                              </span>

                              <div>
                                <small>
                                  {item.label}
                                </small>

                                <strong>
                                  {item.value}
                                </strong>
                              </div>
                            </div>
                          )
                        )}

                      </div>

                    </div>
                  )}

                  <p>{chat.answer}</p>

                  <div className="message-actions">

                    <button
                      onClick={() =>
                        copyAnswer(chat.answer)
                      }
                    >
                      <FaCopy />
                      <span>Copy</span>
                    </button>

                    <button
                      onClick={() =>
                        speakAnswer(chat.answer)
                      }
                    >
                      <FaVolumeUp />
                      <span>Listen</span>
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
            onChange={(e) =>
              setQuestion(e.target.value)
            }
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
              disabled={
                !question.trim() || loading
              }
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
            <FaMicrophone />
            Voice supported
          </span>

        </div>

      </div>


      {chatHistory.length > 0 && (

        <div className="chat-footer-actions">

          <button onClick={clearChat}>

            <FaTrash />

            <span>
              Clear Conversation
            </span>

          </button>

        </div>

      )}

    </section>
  );
}
