from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "AgriNova AI Backend Running 🚀"


@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json() or {}

    nitrogen = float(data.get("nitrogen", 0))
    phosphorus = float(data.get("phosphorus", 0))
    potassium = float(data.get("potassium", 0))
    ph = float(data.get("ph", 0))
    temperature = float(data.get("temperature", 0))
    humidity = float(data.get("humidity", 0))

    crops = [
        {
            "name": "🌾 Rice",
            "score": 0,
            "reason": "Needs warm temperature, good humidity and nutrient-rich soil."
        },
        {
            "name": "🌾 Wheat",
            "score": 0,
            "reason": "Performs well in moderate temperature and balanced soil conditions."
        },
        {
            "name": "🌽 Maize",
            "score": 0,
            "reason": "Suitable for warm weather with balanced nutrients."
        },
        {
            "name": "🥔 Potato",
            "score": 0,
            "reason": "Prefers slightly acidic to neutral soil and moderate temperature."
        },
        {
            "name": "🌱 Cotton",
            "score": 0,
            "reason": "Prefers warm weather and moderate humidity."
        }
    ]

    def score(value, ideal_min, ideal_max, weight):
        if ideal_min <= value <= ideal_max:
            return weight

        distance = min(
            abs(value - ideal_min),
            abs(value - ideal_max)
        )

        return max(0, weight - (distance / max(weight, 1)))


    # Rice
    crops[0]["score"] = (
        score(nitrogen, 80, 120, 20) +
        score(phosphorus, 30, 50, 15) +
        score(potassium, 30, 50, 15) +
        score(ph, 6.0, 7.2, 15) +
        score(temperature, 22, 32, 20) +
        score(humidity, 65, 90, 15)
    )

    # Wheat
    crops[1]["score"] = (
        score(nitrogen, 50, 100, 20) +
        score(phosphorus, 25, 50, 15) +
        score(potassium, 20, 40, 15) +
        score(ph, 6.0, 7.5, 15) +
        score(temperature, 15, 25, 20) +
        score(humidity, 40, 70, 15)
    )

    # Maize
    crops[2]["score"] = (
        score(nitrogen, 40, 80, 20) +
        score(phosphorus, 25, 45, 15) +
        score(potassium, 20, 40, 15) +
        score(ph, 5.8, 7.0, 15) +
        score(temperature, 20, 30, 20) +
        score(humidity, 50, 80, 15)
    )

    # Potato
    crops[3]["score"] = (
        score(nitrogen, 40, 80, 20) +
        score(phosphorus, 20, 40, 15) +
        score(potassium, 20, 50, 15) +
        score(ph, 5.5, 7.0, 15) +
        score(temperature, 15, 25, 20) +
        score(humidity, 50, 80, 15)
    )

    # Cotton
    crops[4]["score"] = (
        score(nitrogen, 40, 80, 20) +
        score(phosphorus, 20, 40, 15) +
        score(potassium, 20, 40, 15) +
        score(ph, 5.5, 7.0, 15) +
        score(temperature, 20, 30, 20) +
        score(humidity, 40, 70, 15)
    )

    # Convert to percentage
    for crop in crops:
        crop["score"] = round(
            min(crop["score"], 100),
            2
        )

    crops.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    return jsonify({
        "success": True,
        "recommendations": crops[:3],
        "message": "Crop recommendations generated successfully."
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
