import React, { useState, useEffect } from "react";
import InventoryCardTemp from "./InventoryCardsTemp";
import "./InventoryPage.css";
import axios from "axios";

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const BATCH_SIZE = 12;

  // ✅ Initial load
  useEffect(() => {
    fetchInventory(0, false);
  }, []);

  // ✅ Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0);
      fetchInventory(0, false, searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ✅ Fetch inventory from backend
  const fetchInventory = async (currentOffset, append = false, search = "") => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await axios.get(
        `http://localhost/Laccrion/PHP/api/create/getUserInventory.php`,
        {
          params: {
            limit: BATCH_SIZE,
            offset: currentOffset,
            search: search,
          },
          withCredentials: true,
        }
      );

      const data = response.data;

      if (data.status === 200) {
        if (append) {
          setInventory((prev) => [...prev, ...data.inventory]);
        } else {
          setInventory(data.inventory);
        }

        setTotal(data.total);
        setHasMore(data.has_more);
      } else if (data.status === 401) {
        setError("Please login to view your inventory");
      } else {
        setError("Failed to load inventory");
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError(err.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // ✅ Handle "Load More"
  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    const newOffset = offset + BATCH_SIZE;
    setOffset(newOffset);
    fetchInventory(newOffset, true, searchTerm);
  };

  // ✅ Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="inventory-page-container">
      {/* Header Section */}
      <div className="inventory-header">
        <h1 className="inventory-title">🎒 My Inventory</h1>
        <p className="inventory-subtitle">
          {loading && inventory.length === 0
            ? "Loading your meals..."
            : `You own ${total} meal${total !== 1 ? "s" : ""}`}
        </p>

        {/* Search Bar */}
        {!loading && total > 0 && (
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Search your meals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="inventory-content">
        {loading && inventory.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your inventory...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>❌ {error}</p>
            <button onClick={() => fetchInventory(0, false, searchTerm)}>
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Inventory Grid */}
            {inventory.length > 0 ? (
              <>
                <div className="inventory-grid">
                  {inventory.map((meal) => (
                    <InventoryCardTemp
                      key={meal.inventory_id}
                      name={meal.name}
                      image={meal.image_url}
                      macros={{
                        calories: meal.calories
                          ? Math.round(meal.calories)
                          : "N/A",
                        protein: meal.protein
                          ? `${Math.round(meal.protein)}g`
                          : "N/A",
                        carbs: meal.carbs
                          ? `${Math.round(meal.carbs)}g`
                          : "N/A",
                        fat: meal.fat ? `${Math.round(meal.fat)}g` : "N/A",
                      }}
                      acquiredDate={formatDate(meal.acquired_at)}
                      price={meal.price}
                    />
                  ))}
                </div>

                {/* Loading More */}
                {loadingMore && (
                  <div className="loading-more">
                    <div className="small-spinner"></div>
                    <p>Loading more meals...</p>
                  </div>
                )}

                {/* Load More Button */}
                {hasMore && !loadingMore && (
                  <div className="load-buttons">
                    <button className="load-more-btn" onClick={handleLoadMore}>
                      ⬇️ Load {BATCH_SIZE} More
                    </button>
                  </div>
                )}

                {/* End Message */}
                {!hasMore && inventory.length > 0 && (
                  <div className="end-message">
                    ✅ You've viewed all {total} meals in your inventory!
                  </div>
                )}
              </>
            ) : (
              <div className="empty-inventory">
                <div className="empty-icon">🍽️</div>
                <h2>Your inventory is empty</h2>
                <p>Visit the shop to purchase your first meal!</p>
                <button
                  className="go-shop-btn"
                  onClick={() => (window.location.href = "/Shop")}
                >
                  🛒 Go to Shop
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
