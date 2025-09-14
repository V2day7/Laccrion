import React from "react";
import "./Inventory.css";
import saladMealImage from "./assets/SaladMeal.jpg";

// Sample data for inventory items - matching the image design
const inventoryData = [
  {
    id: 1,
    name: "Insert Food Name Here",
    image: saladMealImage,
    description: "Insert how many calories, fats, carbs blah blah blah lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum"
  },
  {
    id: 2,
    name: "Insert Food Name Here",
    image: saladMealImage,
    description: "Insert how many calories, fats, carbs blah blah blah lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum"
  },
  {
    id: 3,
    name: "Insert Food Name Here",
    image: saladMealImage,
    description: "Insert how many calories, fats, carbs blah blah blah lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum"
  },
  {
    id: 4,
    name: "Insert Food Name Here",
    image: saladMealImage,
    description: "Insert how many calories, fats, carbs blah blah blah lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum"
  },
  {
    id: 5,
    name: "Insert Food Name Here",
    image: saladMealImage,
    description: "Insert how many calories, fats, carbs blah blah blah lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum"
  },
  {
    id: 6,
    name: "Insert Food Name Here",
    image: saladMealImage,
    description: "Insert how many calories, fats, carbs blah blah blah lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum upsim lerum"
  }
];

function Card({ item }) {
  return (
    <article className="inv-card">
      <button className="fav" aria-label="Favorite">❤</button>
      <div className="inv-card__media">
        <img src={item.image} alt={item.name} />
      </div>
      <div className="inv-card__name">{item.name}</div>
      <div className="inv-card__desc">
        <div className="desc__label">Description:</div>
        <p>{item.description}</p>
      </div>
    </article>
  );
}


export default function Inventory() {
  return (
    <div className="inventory-layout">
      {/* Main Content */}
      <main className="inventory">
        <h2 className="inventory__title">Inventory</h2>

        <section className="inventory__grid">
          {inventoryData[0] && <Card item={inventoryData[0]} />}
        </section>
      </main>
    </div>
  );
}


