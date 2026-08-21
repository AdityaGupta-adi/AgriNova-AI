import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaTemperatureHigh,
  FaTint,
  FaWind,
  FaMapMarkerAlt,
  FaCloudRain,
} from "react-icons/fa";

export default function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState("Roorkee");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getWeather = async () => {
    try {
      setLoading(true);
      setError("");

      const latitude = 29.8543;
      const longitude = 77.8880;
      const locationName = "Roorkee";

      const weatherRes = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&daily=precipitation_probability_max&timezone=auto`
      );

      const current = weatherRes.data.current;
      const daily = weatherRes.data.daily;

      const weatherData = {
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        wind: current.wind_speed_10m,
        precipitation: current.precipitation,
        rainProbability: daily.precipitation_probability_max?.[0] ?? 0,
        location: locationName,
      };

      setWeather(weatherData);
      setCity(locationName);

      localStorage.setItem(
        "agrinova-weather",
        JSON.stringify({
          ...weatherData,
          city: locationName,
          latitude,
          longitude,
          updatedAt: Date.now(),
        })
      );

      window.dispatchEvent(
        new CustomEvent("agrinova-weather-updated", {
          detail: weatherData,
        })
      );
    } catch (err) {
      console.error("Weather API error:", err);
      setError("Unable to fetch weather data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getWeather();
  }, []);

  if (loading) {
    return (
      <section className="weather-card">
        <div className="loading">
          <h2>Loading Weather...</h2>
          <p>Detecting Roorkee weather conditions</p>
        </div>
      </section>
    );
  }

  if (error || !weather) {
    return (
      <section className="weather-card">
        <h2>Weather temporarily unavailable</h2>
        <p>{error || "Please try again."}</p>

        <button onClick={getWeather}>
          🔄 Retry Weather
        </button>
      </section>
    );
  }

  return (
    <motion.section
      className="weather-card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="weather-top">
        <div>
          <h2>🌤️ Live Weather</h2>

          <h3>
            <FaMapMarkerAlt /> {city}
          </h3>
        </div>

        <h1 className="weather-temp">
          <FaTemperatureHigh /> {weather.temperature}°C
        </h1>
      </div>

      <div className="weather-info">
        <div className="weather-box">
          <FaTint size={28} />
          <span>Humidity</span>
          <strong>{weather.humidity}%</strong>
        </div>

        <div className="weather-box">
          <FaWind size={28} />
          <span>Wind Speed</span>
          <strong>{weather.wind} km/h</strong>
        </div>

        <div className="weather-box">
          <FaCloudRain size={28} />
          <span>Rain Probability</span>
          <strong>{weather.rainProbability}%</strong>
        </div>
      </div>

      <div className="weather-rain-status">
        {weather.rainProbability >= 60
          ? "🌧️ High chance of rain — irrigation may be postponed."
          : weather.rainProbability >= 30
          ? "🌦️ Moderate chance of rain — monitor irrigation."
          : "☀️ Low chance of rain — irrigation can be considered."}
      </div>

      <button onClick={getWeather}>
        🔄 Refresh Weather
      </button>
    </motion.section>
  );
}
