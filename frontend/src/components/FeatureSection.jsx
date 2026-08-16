import { motion } from "framer-motion";

export default function FeatureSection() {
  const cards = [
    {
      icon: "🌦️",
      title: "Live Weather",
      desc: "Get real-time weather forecasts including temperature, humidity, rainfall and wind speed.",
    },
    {
      icon: "🌱",
      title: "Soil Health",
      desc: "Monitor soil nutrients and pH to improve crop productivity and soil quality.",
    },
    {
      icon: "🌾",
      title: "AI Crop Recommendation",
      desc: "Receive intelligent crop recommendations using AI based on soil and weather conditions.",
    },
    {
      icon: "🦠",
      title: "Plant Disease Detection",
      desc: "Upload plant leaf images and instantly identify diseases with AI-powered analysis.",
    },
    {
      icon: "🤖",
      title: "AI Farming Assistant",
      desc: "Ask agriculture-related questions anytime and receive smart AI guidance.",
    },
    {
      icon: "📊",
      title: "History Dashboard",
      desc: "View all crop recommendations and disease detection reports in one place.",
    },
  ];

  return (
    <section className="features">

      <motion.h2
        initial={{ opacity: 0, y: -25 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        🌿 Smart Features of AgriNova AI
      </motion.h2>

      <div className="feature-grid">

        {cards.map((card, index) => (

          <motion.div
            key={index}
            className="feature-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: index * 0.1,
            }}
            viewport={{ once: true }}
            whileHover={{
              scale: 1.05,
            }}
          >

            <h1>{card.icon}</h1>

            <h3>{card.title}</h3>

            <p>{card.desc}</p>

          </motion.div>

        ))}

      </div>

    </section>
  );
}