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
  const [city, setCity] = useState("Detecting location...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getWeather();
  }, []);

  const fetchWeather = async (latitude, longitude, locationName = "") => {
    try {
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
        rainProbability: daily?.precipitation_probability_max?.[0] ?? 0,
      };

      setWeather(weatherData);

      if (locationName) {
        setCity(locationName);
      }

      localStorage.setItem(
        "agrinova-weather",
        JSON.stringify({
          weatherData,
          city: locationName || "Current Location",
          latitude,
          longitude,
          updatedAt: Date.now(),
        })
      );

      window.dispatchEvent(new Event("agrinova-weather-updated"));
      setError("");
    } catch (err) {
      console.error("Weather API error:", err);
      setError("Unable to fetch weather data.");
    }
  };

  const getWeather = async () => {
    setLoading(true);
    setError("");

    // 1️⃣ Try browser GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const geoRes = await axios.get(
              `https://geocoding-api.open-meteo.com/v1/search?name=India&count=1&language=en&format=json`
            );

            const locationName =
              geoRes.data?.results?.[0]?.name || "Current Location";

            await fetchWeather(latitude, longitude, locationName);
          } catch {
            await fetchWeather(latitude, longitude, "Current Location");
          }

          setLoading(false);
        },
        async () => {
          // 2️⃣ GPS failed → IP location fallback
          try {
            const ipRes = await axios.get("https://ipwho.is/");

            if (ipRes.data?.success && ipRes.data.latitude) {
              const latitude = ipRes.data.latitude;
              const longitude = ipRes.data.longitude;

              const locationName =
                ipRes.data.city ||
                ipRes.data.region ||
                ipRes.data.country ||
                "Nearby Location";

              await fetchWeather(latitude, longitude, locationName);
              setLoading(false);
              return;
            }

            throw new Error("IP location unavailable");
          } catch (err) {
            console.error("IP location error:", err);

            // 3️⃣ Final fallback
            await fetchWeather(28.6139, 77.209, "India");
            setLoading(false);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000,
        }
      );
    } else {
      // Browser does not support GPS
      try {
        const ipRes = await axios.get("https://ipwho.is/");

        if (ipRes.data?.success && ipRes.data.latitude) {
          await fetchWeather(
            ipRes.data.latitude,
            ipRes.data.longitude,
            ipRes.data.city || "Nearby Location"
          );
        } else {
          await fetchWeather(28.6139, 77.209, "India");
        }
      } catch {
        await fetchWeather(28.6139, 77.209, "India");
      }

      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="weather-card">
        <div className="loading">
          <h2>🌤️ Loading Weather...</h2>
          <p>Detecting your location and weather conditions</p>
        </div>
      </section>
    );
  }

  if (!weather) {
    return (
      <section className="weather-card">
        <h2>🌦️ Weather temporarily unavailable</h2>
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
