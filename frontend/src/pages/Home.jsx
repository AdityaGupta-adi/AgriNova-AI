import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import WeatherCard from "../components/WeatherCard";
import FeatureSection from "../components/FeatureSection";
import SoilCard from "../components/SoilCard";
import CropRecommendation from "../components/CropRecommendation";
import PlantDiseaseDetection from "../components/PlantDiseaseDetection";
import AIChatbot from "../components/AIChatbot";
import SmartIrrigation from "../components/SmartIrrigation";

export default function Home() {
  return (
    <>
      <Navbar />

      <Hero />

      <FeatureSection />

      <WeatherCard />

      <SoilCard />

      <CropRecommendation />
      <SmartIrrigation />

      <PlantDiseaseDetection />

      <AIChatbot />

      <Footer />
    </>
  );
}