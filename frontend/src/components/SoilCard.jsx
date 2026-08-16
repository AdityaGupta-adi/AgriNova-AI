import { motion } from "framer-motion";

export default function SoilCard() {
  const soil = [
    {
      title: "Soil Moisture",
      value: "68%",
      icon: "💧",
      status: "Optimal",
    },
    {
      title: "Soil pH",
      value: "6.8",
      icon: "⚗️",
      status: "Healthy",
    },
    {
      title: "Nitrogen",
      value: "Good",
      icon: "🧪",
      status: "High",
    },
    {
      title: "Potassium",
      value: "Normal",
      icon: "🌾",
      status: "Balanced",
    },
  ];

  return (
    <section className="soil-section">

      <motion.h2
        initial={{ opacity: 0, y: -25 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        🌱 Soil Health Analysis
      </motion.h2>

      <div className="soil-grid">

        {soil.map((item, index) => (

          <motion.div
            key={index}
            className="soil-card"
            initial={{ opacity: 0, y: 35 }}
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

            <div className="soil-icon">
              {item.icon}
            </div>

            <h3>{item.title}</h3>

            <h1>{item.value}</h1>

            <span className="soil-status">
              {item.status}
            </span>

          </motion.div>

        ))}

      </div>

    </section>
  );
}