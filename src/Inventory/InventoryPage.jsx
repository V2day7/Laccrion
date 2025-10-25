import React, { useState, useEffect } from "react";
import InventoryCardTemp from "./InventoryCardsTemp";
import MealModal from "../Shop/MealModal/MealModal"; // ✅ Import MealModal
import "./InventoryPage.css";
import axios from "axios";

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalInInventory, setTotalInInventory] = useState(0); // ✅ NEW: Track total meals without search
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMeal, setSelectedMeal] = useState(null); // ✅ NEW: Modal state

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
    console.log("🔵 [FETCH START] Fetching inventory...", {
      currentOffset,
      append,
      search,
      BATCH_SIZE,
    });

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = `http://localhost/Laccrion/PHP/api/create/getUserInventory.php`;
      const params = {
        limit: BATCH_SIZE,
        offset: currentOffset,
        search: search,
      };

      console.log("🟡 [FETCH] Sending request to:", url);
      console.log("🟡 [FETCH] With params:", params);

      const response = await axios.get(url, {
        params: params,
        withCredentials: true,
      });

      console.log("🟢 [FETCH SUCCESS] Response received:", response);
      console.log("🟢 [FETCH SUCCESS] Response data:", response.data);

      const data = response.data;

      if (data.status === 200) {
        console.log("✅ [SUCCESS] Inventory data:", data.inventory);
        console.log("✅ [SUCCESS] Total items:", data.total);
        console.log("✅ [SUCCESS] Has more:", data.has_more);

        if (append) {
          setInventory((prev) => {
            console.log(
              "📝 Appending to existing inventory:",
              prev.length,
              "items"
            );
            return [...prev, ...data.inventory];
          });
        } else {
          console.log(
            "📝 Setting new inventory:",
            data.inventory.length,
            "items"
          );
          setInventory(data.inventory);
        }

        setTotal(data.total);
        setHasMore(data.has_more);

        // ✅ NEW: Track total inventory without search filter
        if (!search) {
          setTotalInInventory(data.total);
        }
      } else if (data.status === 401) {
        console.error("❌ [AUTH ERROR] Unauthorized:", data);
        setError("Please login to view your inventory");
      } else {
        console.error("❌ [ERROR] Unexpected status:", data);
        setError("Failed to load inventory");
      }
    } catch (err) {
      console.error("🔴 [FETCH ERROR] Request failed:", err);
      console.error("🔴 [FETCH ERROR] Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || "Failed to load inventory");
    } finally {
      console.log("🔵 [FETCH END] Loading complete");
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

  // ✅ Clear search
  const clearSearch = () => {
    setSearchTerm("");
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

  // ✅ NEW: Determine if inventory is truly empty or just no search results
  const isTrulyEmpty = totalInInventory === 0;
  const isSearchActive = searchTerm.trim() !== "";
  const hasNoSearchResults =
    isSearchActive && inventory.length === 0 && !loading;

  return (
    <div className="inventory-page-container">
      {/* Header Section */}
      <div className="inventory-header">
        <h1 className="inventory-title">🎒 My Inventory</h1>
        <p className="inventory-subtitle">
          {loading && inventory.length === 0
            ? "Loading your meals..."
            : isSearchActive
            ? `Found ${total} meal${
                total !== 1 ? "s" : ""
              } matching "${searchTerm}"`
            : `You own ${totalInInventory} meal${
                totalInInventory !== 1 ? "s" : ""
              }`}
        </p>

        {/* Search Bar */}
        {!loading && totalInInventory > 0 && (
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Search your meals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {isSearchActive && (
              <button className="clear-search-btn" onClick={clearSearch}>
                ✖️ Clear
              </button>
            )}
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
                      onClick={() => setSelectedMeal(meal)} // ✅ NEW: Open modal on click
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
                    {isSearchActive
                      ? `✅ Showing all ${total} matching meals`
                      : `✅ You've viewed all ${total} meals in your inventory!`}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* ✅ NEW: No Search Results (User has inventory but search didn't match) */}
                {hasNoSearchResults ? (
                  <div className="no-results">
                    {/* <div className="empty-icon">🔍</div> */}
                    <h2>No meals found matching "{searchTerm}"</h2>
                    <p>Try a different search term or clear the search.</p>
                    <button
                      className="clear-search-btn-large"
                      onClick={clearSearch}
                    >
                      ✖️ Clear Search
                    </button>
                  </div>
                ) : (
                  /* ✅ Truly Empty Inventory (User has no meals at all) */
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
          </>
        )}
      </div>

      {/* ✅ NEW: Modal for meal details (no purchase button) */}
      {selectedMeal && (
        <MealModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          showPurchaseButton={false}
          isInventoryView={true}
        />
      )}
    </div>
  );
}
