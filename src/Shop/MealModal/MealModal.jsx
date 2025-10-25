import React, { useState } from "react";
import "./MealModal.css";
import axios from "axios";
import SuccessAnimation from "../../SuccessAnimation/SuccessAnimation";

export default function MealModal({
  meal,
  onClose,
  onPurchaseSuccess,
  showPurchaseButton = true, // ✅ NEW: Toggle purchase button
  isInventoryView = false, // ✅ NEW: Different styling for inventory
}) {
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [purchaseData, setPurchaseData] = useState(null);
  const [imageError, setImageError] = useState(false);

  // ✅ Generate unique gradient based on meal name (same as ShopCardTemp)
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
  const isGradientPlaceholder =
    meal.image_url && meal.image_url.startsWith("gradient://");

  // ✅ Decode meal name from gradient marker
  const getMealNameFromGradient = () => {
    if (isGradientPlaceholder) {
      try {
        return atob(meal.image_url.replace("gradient://", ""));
      } catch {
        return meal.name;
      }
    }
    return meal.name;
  };

  const handlePurchase = async () => {
    if (purchasing) return;

    const confirmed = window.confirm(
      `🛒 Purchase "${meal.name}" for ${meal.price_coins || meal.price} coins?`
    );

    if (!confirmed) return;

    setPurchasing(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost/Laccrion/PHP/api/create/purchaseMeal.php",
        { meal_id: meal.meal_id },
        { withCredentials: true }
      );

      const data = response.data;

      if (data.status === 200) {
        setSuccessMessage(
          `${meal.name} added to inventory!\nNew Balance: ${data.new_balance} coins`
        );

        setPurchaseData({
          newBalance: data.new_balance,
          mealId: meal.meal_id,
        });

        setShowSuccess(true);
      } else {
        setError(data.message || "Purchase failed");
        alert(`❌ ${data.message}`);
      }
    } catch (err) {
      console.error("Purchase error:", err);
      const errorMsg = err.response?.data?.message || "Purchase failed";
      setError(errorMsg);
      alert(`❌ ${errorMsg}`);
    } finally {
      setPurchasing(false);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);

    if (purchaseData) {
      onPurchaseSuccess(purchaseData.newBalance, purchaseData.mealId);
    }

    onClose();
  };

  if (showSuccess) {
    return (
      <SuccessAnimation
        message={successMessage}
        onComplete={handleSuccessComplete}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <h2 className="modal-title">{meal.name}</h2>

        {/* ✅ Image Section with Gradient Support */}
        {meal.image_url && (
          <div className="modal-image-container">
            {imageError || isGradientPlaceholder ? (
              /* Show gradient placeholder */
              <div
                className="modal-image-placeholder"
                style={{
                  background: generateGradient(getMealNameFromGradient()),
                }}
              >
                <div className="modal-placeholder-content">
                  <span className="modal-placeholder-icon">🍽️</span>
                  <span className="modal-placeholder-text">{meal.name}</span>
                </div>
              </div>
            ) : (
              /* Show real image */
              <img
                src={meal.image_url}
                alt={meal.name}
                className="modal-image"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        )}

        <div className="modal-macros">
          <div className="macro-item">
            <span className="macro-label">Calories:</span>
            <span className="macro-value">{Math.round(meal.calories)}</span>
          </div>
          <div className="macro-item">
            <span className="macro-label">Protein:</span>
            <span className="macro-value">{Math.round(meal.protein)}g</span>
          </div>
          <div className="macro-item">
            <span className="macro-label">Carbs:</span>
            <span className="macro-value">{Math.round(meal.carbs)}g</span>
          </div>
          <div className="macro-item">
            <span className="macro-label">Fat:</span>
            <span className="macro-value">{Math.round(meal.fat)}g</span>
          </div>
        </div>

        <div className="modal-price">
          <span className="price-label">Price:</span>
          <span className="price-value">
            💰 {meal.price_coins || meal.price} coins
          </span>
        </div>

        {error && <div className="modal-error">{error}</div>}

        {/* ✅ Conditionally show purchase button */}
        {showPurchaseButton && (
          <button
            className="purchase-btn"
            onClick={handlePurchase}
            disabled={purchasing}
          >
            {purchasing
              ? "Processing..."
              : `🛒 Purchase for ${meal.price_coins || meal.price} coins`}
          </button>
        )}

        {/* ✅ Show acquired date for inventory view */}
        {isInventoryView && meal.acquired_at && (
          <div className="modal-acquired-date">
            📅 Acquired:{" "}
            {new Date(meal.acquired_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
