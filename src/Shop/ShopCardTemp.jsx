import React, { useState } from "react";
import "./ShopCardTemp.css";

export default function ShopCardTemp({
  name,
  image,
  accent,
  macros,
  badges = [],
  isOwned = false,
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // ✅ LAYER 3: Generate unique gradient based on meal name
  const generateGradient = (name) => {
    const colors = [
      ["#FF6B6B", "#4ECDC4"],
      ["#A8E6CF", "#FFD3B6"],
      ["#FFA07A", "#98D8C8"],
      ["#F7DC6F", "#85C1E2"],
      ["#BB8FCE", "#F8B4D9"],
      ["#FF8B94", "#A8D8EA"],
      ["#FFD93D", "#6BCF7F"],
    ];

    const hash = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const [color1, color2] = colors[hash % colors.length];

    return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
  };

  // ✅ Check if image is a gradient placeholder
  const isGradientPlaceholder = image && image.startsWith("gradient://");

  // ✅ Decode meal name from gradient marker
  const getMealNameFromGradient = () => {
    if (isGradientPlaceholder) {
      try {
        return atob(image.replace("gradient://", ""));
      } catch {
        return name;
      }
    }
    return name;
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <article className={`card card--${accent} ${isOwned ? "card--owned" : ""}`}>
      {isOwned && <div className="owned-badge">✅ Owned</div>}

      {/* Image Container */}
      <div className="card__media">
        {/* Loading skeleton */}
        {imageLoading && !imageError && !isGradientPlaceholder && (
          <div
            className="image-skeleton"
            style={{ background: generateGradient(name) }}
          >
            <div className="skeleton-pulse"></div>
          </div>
        )}

        {/* LAYER 3: Gradient placeholder OR error fallback */}
        {imageError || isGradientPlaceholder ? (
          <div
            className="image-placeholder"
            style={{ background: generateGradient(getMealNameFromGradient()) }}
          >
            <div className="placeholder-content">
              <span className="placeholder-icon">🍽️</span>
              <span className="placeholder-text">{name}</span>
            </div>
          </div>
        ) : (
          /* LAYER 1 & 2: Unsplash or Foodish images */
          <img
            src={image || "https://via.placeholder.com/300x200?text=No+Image"}
            alt={name || "Meal"}
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{ display: imageLoading ? "none" : "block" }}
          />
        )}
      </div>

      {/* Meal Name */}
      <div className="card__title">{name || "No Food Name Available"}</div>

      {/* Macros */}
      <div className="card__macros">
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

      {/* Badges */}
      <div className="card__badges">
        {(badges.length > 0 ? badges : ["No Tags"]).map((badge, index) => (
          <span key={index} className="badge">
            {badge}
          </span>
        ))}
      </div>
    </article>
  );
}
