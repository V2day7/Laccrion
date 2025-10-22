import React from "react";
import "./InventoryCardsTemp.css";
import defaultImage from "../assets/SaladMeal.jpg";

export default function InventoryCardTemp({
  name,
  image,
  macros,
  acquiredDate,
  price,
}) {
  return (
    <article className="inv-card">
      {/* Owned Badge */}
      <div className="owned-badge">✅ Owned</div>

      {/* Image */}
      <div className="inv-card__media">
        <img src={image || defaultImage} alt={name} />
      </div>

      {/* Meal Name */}
      <div className="inv-card__title">{name}</div>

      {/* Macros Grid */}
      <div className="inv-card__macros">
        <div className="macro">
          <div className="macro__value">{macros.calories || "-"}</div>
          <div className="macro__label">Calories</div>
        </div>
        <div className="macro">
          <div className="macro__value">{macros.protein || "-"}</div>
          <div className="macro__label">Protein</div>
        </div>
        <div className="macro">
          <div className="macro__value">{macros.carbs || "-"}</div>
          <div className="macro__label">Carbs</div>
        </div>
        <div className="macro">
          <div className="macro__value">{macros.fat || "-"}</div>
          <div className="macro__label">Fat</div>
        </div>
      </div>

      {/* Acquisition Info */}
      <div className="inv-card__info">
        <div className="info-row">
          <span className="info-label">Purchased:</span>
          <span className="info-value">{acquiredDate}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Value:</span>
          <span className="info-value">💰 {price} coins</span>
        </div>
      </div>

      {/* Use Button */}
      <button className="use-btn">🍽️ Use Meal</button>
    </article>
  );
}
