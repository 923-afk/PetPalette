import base64
import os
from io import BytesIO
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import requests
from pydantic import BaseModel, Field


# Load environment variables from .env if present
load_dotenv()

APP_VERSION = os.getenv("APP_VERSION", "0.1.0")

CLARIFAI_API_KEY = os.getenv("CLARIFAI_API_KEY", "")
CLARIFAI_MODEL_ID = os.getenv("CLARIFAI_MODEL_ID", "food-item-recognition")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

ALLOWED_ORIGINS = [o.strip() for o in os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",") if o.strip()]

app = FastAPI(title="AI Food Analysis & Meal Planner", version=APP_VERSION)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple calories per 100g mapping (fallback)
FOOD_CAL_PER_100G: Dict[str, float] = {
    "pizza": 266,
    "apple": 52,
    "burger": 295,
    "salad": 150,
    "rice": 130,
    "pasta": 131,
    "chicken_breast": 165,
    "banana": 89,
    "fried_rice": 163,
}


def clarifai_recognize(image_bytes: bytes) -> List[Dict[str, Any]]:
    """Recognize food items using Clarifai Food model when API key is available.
    Falls back to a simple static prediction if not configured or on error.
    Returns list of {name, confidence}.
    """
    if not CLARIFAI_API_KEY:
        return [{"name": "pizza", "confidence": 0.90}]

    try:
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        url = f"https://api.clarifai.com/v2/models/{CLARIFAI_MODEL_ID}/outputs"
        headers = {
            "Authorization": f"Key {CLARIFAI_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "inputs": [
                {
                    "data": {
                        "image": {"base64": base64_image}
                    }
                }
            ]
        }
        res = requests.post(url, headers=headers, json=payload, timeout=15)
        res.raise_for_status()
        data = res.json()
        outputs = data.get("outputs", [])
        if not outputs:
            return [{"name": "pizza", "confidence": 0.90}]
        concepts = outputs[0].get("data", {}).get("concepts", [])
        results: List[Dict[str, Any]] = []
        for c in concepts[:5]:
            name = c.get("name")
            value = float(c.get("value", 0.0))
            if name:
                results.append({"name": name.lower(), "confidence": value})
        return results or [{"name": "pizza", "confidence": 0.90}]
    except Exception:
        return [{"name": "pizza", "confidence": 0.90}]


def estimate_portion_weight(image: Image.Image, label: str) -> float:
    """Very rough heuristic per-item weight in grams based on label.
    In real scenarios, use object detection + scale estimation.
    """
    label = label.lower()
    defaults: Dict[str, float] = {
        "pizza": 180.0,  # per slice
        "burger": 250.0,
        "apple": 182.0,
        "salad": 200.0,
        "banana": 118.0,
        "rice": 150.0,
        "pasta": 180.0,
        "chicken_breast": 160.0,
        "fried_rice": 300.0,
    }
    return float(defaults.get(label, 150.0))


@app.get("/health")
async def health() -> Dict[str, Any]:
    return {"status": "ok", "version": APP_VERSION}


@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)) -> Dict[str, Any]:
    try:
        image_bytes = await file.read()
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image: {exc}")

    predictions = clarifai_recognize(image_bytes)
    items: List[Dict[str, Any]] = []
    for pred in predictions:
        label = pred.get("name", "unknown").lower()
        confidence = float(pred.get("confidence", 0.0))
        weight_g = estimate_portion_weight(image, label)
        cal_per_100g = float(FOOD_CAL_PER_100G.get(label, 200.0))
        kcal = (weight_g / 100.0) * cal_per_100g
        items.append({
            "label": label,
            "confidence": round(confidence, 3),
            "estimated_weight_g": round(weight_g, 1),
            "estimated_kcal": round(kcal, 1),
        })

    return {
        "items": items,
        "image": {"width": image.width, "height": image.height},
    }


class GoalRequest(BaseModel):
    sex: str = Field(description="male or female")
    age: int
    height_cm: float
    weight_kg: float
    activity_factor: float = Field(1.2, description="1.2 sedentary .. 1.9 very active")
    target: str = Field("maintain", description="lose | maintain | gain")
    preferences: List[str] = Field(default_factory=list)
    exclusions: List[str] = Field(default_factory=list)
    location: str = Field("", description="lat,lng for nearby restaurants")


def mifflin_bmr(sex: str, weight_kg: float, height_cm: float, age: int) -> float:
    if sex.lower() == "male":
        return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161


def split_calories(total_kcal: float) -> Dict[str, float]:
    parts = {
        "breakfast": 0.25,
        "lunch": 0.35,
        "dinner": 0.30,
        "snacks": 0.10,
    }
    return {k: round(total_kcal * v) for k, v in parts.items()}


def filter_items(items: List[str], preferences: List[str], exclusions: List[str]) -> List[str]:
    if not preferences and not exclusions:
        return items
    lowered_prefs = {p.lower() for p in preferences}
    lowered_excl = {e.lower() for e in exclusions}
    filtered: List[str] = []
    for it in items:
        it_l = it.lower()
        if any(ex in it_l for ex in lowered_excl):
            continue
        if lowered_prefs and not any(pr in it_l for pr in lowered_prefs):
            continue
        filtered.append(it)
    return filtered or items


def generate_simple_meal_plan(target_kcal: float, preferences: List[str], exclusions: List[str]) -> Dict[str, Any]:
    calories = split_calories(target_kcal)
    breakfast_opts = [
        "oatmeal with banana",
        "greek yogurt with berries",
        "scrambled eggs and toast",
        "smoothie (spinach, banana, milk)",
    ]
    lunch_opts = [
        "chicken salad with olive oil",
        "tuna sandwich and salad",
        "rice bowl with tofu and veggies",
        "pasta with tomato sauce",
    ]
    dinner_opts = [
        "grilled chicken with rice",
        "baked salmon and vegetables",
        "stir-fry tofu with noodles",
        "vegetable curry with rice",
    ]
    snack_opts = [
        "apple",
        "banana",
        "nuts (small handful)",
        "yogurt",
        "rice cakes",
    ]

    breakfast_opts = filter_items(breakfast_opts, preferences, exclusions)
    lunch_opts = filter_items(lunch_opts, preferences, exclusions)
    dinner_opts = filter_items(dinner_opts, preferences, exclusions)
    snack_opts = filter_items(snack_opts, preferences, exclusions)

    plan = {
        "breakfast": {"kcal": calories["breakfast"], "suggestions": breakfast_opts[:3]},
        "lunch": {"kcal": calories["lunch"], "suggestions": lunch_opts[:3]},
        "dinner": {"kcal": calories["dinner"], "suggestions": dinner_opts[:3]},
        "snacks": {"kcal": calories["snacks"], "suggestions": snack_opts[:3]},
    }
    return plan


def find_nearby_restaurants(location: str, keyword: Optional[str] = None, radius_m: int = 1000, max_results: int = 5) -> List[Dict[str, Any]]:
    if not location or not GOOGLE_MAPS_API_KEY:
        return []

    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params: Dict[str, Any] = {
        "location": location,
        "radius": radius_m,
        "type": "restaurant",
        "key": GOOGLE_MAPS_API_KEY,
    }
    if keyword:
        params["keyword"] = keyword

    try:
        res = requests.get(url, params=params, timeout=15)
        res.raise_for_status()
        data = res.json()
        restaurants: List[Dict[str, Any]] = []
        for r in data.get("results", [])[:max_results]:
            restaurants.append({
                "name": r.get("name"),
                "address": r.get("vicinity", ""),
                "rating": r.get("rating"),
                "place_id": r.get("place_id"),
                "open_now": r.get("opening_hours", {}).get("open_now"),
            })
        return restaurants
    except Exception:
        return []


@app.post("/plan-meals")
async def plan_meals(req: GoalRequest) -> Dict[str, Any]:
    bmr = mifflin_bmr(req.sex, req.weight_kg, req.height_cm, req.age)
    tdee = bmr * (req.activity_factor if req.activity_factor > 0 else 1.2)

    if req.target == "lose":
        target_kcal = tdee - 500
    elif req.target == "gain":
        target_kcal = tdee + 500
    else:
        target_kcal = tdee

    target_kcal = max(1000.0, target_kcal)  # clamp to a reasonable minimum

    restaurants = find_nearby_restaurants(req.location, keyword=(req.preferences[0] if req.preferences else None)) if req.location else []

    meal_plan = generate_simple_meal_plan(target_kcal, req.preferences, req.exclusions)

    return {
        "bmr": round(bmr),
        "tdee": round(tdee),
        "target_kcal": round(target_kcal),
        "meal_plan": meal_plan,
        "restaurants": restaurants,
    }


@app.get("/nearby-restaurants")
async def nearby_restaurants(location: str, radius: int = 1000, keyword: Optional[str] = None, max_results: int = 5) -> Dict[str, Any]:
    restaurants = find_nearby_restaurants(location, keyword=keyword, radius_m=radius, max_results=max_results)
    return {"restaurants": restaurants}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
