import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaTemperatureHigh,
  FaTint,
  FaWind,
  FaMapMarkerAlt,
  FaCloudRain
} from "react-icons/fa";

export default function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState("Fetching location...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeather();
  }, []);

  const getWeather = () => {
    setLoading(true);

    if (!navigator.geolocation) {
      setCity("Location not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const weatherRes = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&daily=precipitation_probability_max&timezone=auto&forecast_days=1`
          );

          const geoRes = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );

          const current = weatherRes.data.current;
          const daily = weatherRes.data.daily;

          const weatherData = {
            temperature: current.temperature_2m,
            humidity: current.relative_humidity_2m,
            wind: current.wind_speed_10m,
            precipitation: current.precipitation,
            rainProbability: daily.precipitation_probability_max?.[0] ?? 0
          };

          setWeather(weatherData);

          const address = geoRes.data.address || {};

          const locationName =
            address.city ||
            address.town ||
            address.village ||
            address.state ||
            "Unknown Location";

          setCity(locationName);

          // Save weather data for Smart Irrigation
          localStorage.setItem(
            "agrinova_weather",
            JSON.stringify({
              ...weatherData,
              city: locationName,
              latitude,
              longitude,
              updatedAt: Date.now()
            })
          );

          // Tell Smart Irrigation that new weather data is available
          window.dispatchEvent(new Event("agrinova-weather-updated"));
        } catch (err) {
          console.error(err);
          setCity("Weather unavailable");
        }

        setLoading(false);
      },
      () => {
        setCity("Permission denied");
        setLoading(false);
      }
    );
  };

  if (loading) {
    return (
      <section className="weather-card">
        <div className="loading">
          <h2 style={{ marginTop: "20px" }}>Loading Weather...</h2>
        </div>
      </section>
    );
  }

  if (!weather) {
    return (
      <section className="weather-card">
        <h2>Weather unavailable</h2>
        <button onClick={getWeather}>Retry Weather</button>
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
        <h2>🌦️ Live Weather</h2>

        <h3>
          <FaMapMarkerAlt /> {city}
        </h3>
      </div>

      <h1 className="weather-temp">
        <FaTemperatureHigh /> {weather.temperature}°C
      </h1>

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
