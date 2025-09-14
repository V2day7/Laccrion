import React from "react";
import "./Shop.css";
import saladMealImage from "./assets/SaladMeal.jpg";  // <<-- ayusin path dito

// Sample data for shop items - matching the image design
const shopData = [
  {
    id: 1,
    name: "Power Protein Bowl",
    image: saladMealImage,
    accent: "red",
    macros: { calories: "570", protein: "60g", carbs: "32g", fat: "25g" },
    badges: ["Energy Boost", "Post-Workout", "Heavy Meal"],
    ingredients: [
      ["Ingredients:", "Lettuce", "Tomatoes"],
      ["Beef", "Lemon"]
    ]
  },
  {
    id: 2,
    name: "Power Protein Bowl",
    image: saladMealImage,
    accent: "blue",
    macros: { calories: "570", protein: "60g", carbs: "32g", fat: "25g" },
    badges: ["Energy Boost", "Post-Workout", "Heavy Meal"],
    ingredients: [
      ["Ingredients:", "Lettuce", "Tomatoes"],
      ["Beef", "Lemon"]
    ]
  },
  {
    id: 3,
    name: "Power Protein Bowl",
    image: saladMealImage,
    accent: "pink",
    macros: { calories: "570", protein: "60g", carbs: "32g", fat: "25g" },
    badges: ["Energy Boost", "Post-Workout", "Heavy Meal"],
    ingredients: [
      ["Ingredients:", "Lettuce", "Tomatoes"],
      ["Beef", "Lemon"]
    ]
  },
  {
    id: 4,
    name: "Power Protein Bowl",
    image: saladMealImage,
    accent: "blue",
    macros: { calories: "570", protein: "60g", carbs: "32g", fat: "25g" },
    badges: ["Energy Boost", "Post-Workout", "Heavy Meal"],
    ingredients: [
      ["Ingredients:", "Lettuce", "Tomatoes"],
      ["Beef", "Lemon"]
    ]
  },
  {
    id: 5,
    name: "Power Protein Bowl",
    image: saladMealImage,
    accent: "orange",
    macros: { calories: "570", protein: "60g", carbs: "32g", fat: "25g" },
    badges: ["Energy Boost", "Post-Workout", "Heavy Meal"],
    ingredients: [
      ["Ingredients:", "Lettuce", "Tomatoes"],
      ["Beef", "Lemon"]
    ]
  },
  {
    id: 6,
    name: "Power Protein Bowl",
    image: saladMealImage,
    accent: "teal",
    macros: { calories: "570", protein: "60g", carbs: "32g", fat: "25g" },
    badges: ["Energy Boost", "Post-Workout", "Heavy Meal"],
    ingredients: [
      ["Ingredients:", "Lettuce", "Tomatoes"],
      ["Beef", "Lemon"]
    ]
  }
];

function StatBadge({ text }) {
  return <span className="badge">{text}</span>;
}

function Macro({ label, value }) {
  return (
    <div className="macro">
      <div className="macro__value">{value}</div>
      <div className="macro__label">{label}</div>
    </div>
  );
}

function Card({ item }) {
  return (
    <article className={`card card--${item.accent}`}>
      <div className="card__media">
        <img src={item.image} alt={item.name} />
      </div>
      <div className="card__macros">
        <Macro label="Calories" value={item.macros.calories} />
        <Macro label="Protein" value={item.macros.protein} />
        <Macro label="Carbs" value={item.macros.carbs} />
        <Macro label="Fat" value={item.macros.fat} />
      </div>
      <div className="card__badges">
        {item.badges.map((badge, index) => (
          <StatBadge key={index} text={badge} />
        ))}
      </div>
      <div className="card__ingredients">
        {item.ingredients.map((row, rowIndex) => (
          <div key={rowIndex} className="ingredients__row">
            {row.map((ingredient, ingredientIndex) => (
              <span key={ingredientIndex}>{ingredient}</span>
            ))}
          </div>
        ))}
      </div>
    </article>
  );
}

export default function Shop() {
  return (
    <div className="shop-layout">
      {/* Main Content */}
      <main className="shop">
        <h2 className="shop__title">Shop</h2>

        <section className="shop__grid" aria-label="Meals">
          {shopData[0] && <Card item={shopData[0]} />}
        </section>
      </main>
    </div>
  );
}
