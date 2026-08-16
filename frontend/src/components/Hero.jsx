import { TypeAnimation } from "react-type-animation";
import { FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="hero premium-hero">

      <div className="hero-orb hero-orb-one"></div>
      <div className="hero-orb hero-orb-two"></div>
      <div className="hero-orb hero-orb-three"></div>

      <motion.div
        className="hero-badge"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        🌱 AI POWERED SMART FARMING
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        AgriNova <span>AI</span>
      </motion.h1>

      <motion.div
        className="hero-typing"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.8 }}
      >
        <span className="typing-icon">🚜</span>

        <TypeAnimation
          sequence={[
            "Smart Agriculture Platform",
            2000,
            "🤖 AI Powered Farming",
            2000,
            "🌾 Future of Agriculture",
            2000,
            "💧 Intelligent Irrigation",
            2000
          ]}
          wrapper="span"
          speed={50}
          repeat={Infinity}
        />
      </motion.div>

      <motion.p
        className="hero-description"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        Monitor weather, analyze soil, detect plant diseases, receive
        AI-powered crop recommendations, and improve farming productivity
        using the power of Artificial Intelligence.
      </motion.p>

      <motion.div
        className="hero-buttons"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      >
        <button className="primary hero-main-btn">
          🚀 Get Started <FaArrowRight />
        </button>

        <button className="secondary hero-ai-btn">
          🤖 Try AI
        </button>
      </motion.div>

      <motion.div
        className="hero-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <div>
          <strong>6+</strong>
          <span>Smart Features</span>
        </div>

        <div>
          <strong>AI</strong>
          <span>Powered Analysis</span>
        </div>

        <div>
          <strong>24/7</strong>
          <span>Smart Monitoring</span>
        </div>
      </motion.div>

    </section>
  );
}
