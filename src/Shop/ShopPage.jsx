import React, { useState, useEffect, useRef, useCallback } from "react";
import ShopCardTemp from "./ShopCardTemp";
import "./ShopPage.css";
import MealModal from "./MealModal/MealModal";
import axios from "axios";

export default function ShopPage() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchingFromAPI, setFetchingFromAPI] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  const [selectedMeal, setSelectedMeal] = useState(null);

  // ✅ Ref for infinite scroll observer
  const observerTarget = useRef(null);

  const BATCH_SIZE = 12;

  // ✅ Initial load
  useEffect(() => {
    fetchMeals(0, false);
  }, []);

  // ✅ Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // When the sentinel element is visible and we have more meals
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          console.log("📜 Scroll triggered - Auto-loading more meals...");
          handleLoadMore();
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: "200px", // Start loading 200px before reaching the element
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, offset]);

  // ✅ Fetch meals from database
  const fetchMeals = async (currentOffset, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await axios.get(
        `http://localhost/Laccrion/PHP/api/read/getMeals.php`,
        {
          params: {
            limit: BATCH_SIZE,
            offset: currentOffset,
          },
          withCredentials: true,
        }
      );

      const data = response.data;

      if (data.status === 200) {
        // ✅ Filter out owned meals (only show unowned)
        const filteredMeals = data.meals.filter((meal) => meal.is_owned !== 1);

        console.log(
          `📦 Loaded ${filteredMeals.length} available meals (${
            data.meals.length - filteredMeals.length
          } owned, hidden)`
        );

        if (append) {
          setMeals((prev) => [...prev, ...filteredMeals]);
        } else {
          setMeals(filteredMeals);
        }

        setTotal(data.total);
        setHasMore(data.has_more);
      } else {
        console.error("❌ Failed to load meals:", data);
        setError("Failed to load meals");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err.message);
      setError(err.message || "Failed to load meals");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // ✅ Remove purchased meal from shop immediately
  const handlePurchaseSuccess = (newBalance, purchasedMealId) => {
    console.log(
      `✅ Purchase successful! Meal ID: ${purchasedMealId}, New balance: ${newBalance} coins`
    );

    // Update coin balance in header
    window.dispatchEvent(
      new CustomEvent("coinsUpdated", { detail: { coins: newBalance } })
    );

    // Remove the purchased meal from the shop list
    setMeals((prevMeals) =>
      prevMeals.filter((meal) => meal.meal_id !== purchasedMealId)
    );

    // Update total count
    setTotal((prev) => Math.max(0, prev - 1));

    // Close modal after purchase
    setSelectedMeal(null);
  };

  // ✅ Fetch fresh meals from API
  const handleFetchFromAPI = async () => {
    const confirmed = window.confirm(
      `🔄 Fetch 10 new meals from CalorieNinjas API?\n\n` +
        `This will add fresh meals to the database.\n` +
        `Note: Uses API quota (1000/month limit).`
    );

    if (!confirmed) return;

    setFetchingFromAPI(true);
    setError(null);

    try {
      const response = await axios.get(
        `http://localhost/Laccrion/PHP/api/read/fetchMoreMeals.php`,
        {
          params: {
            count: 10,
          },
        }
      );

      const data = response.data;

      if (data.status === 200) {
        if (data.saved_count > 0) {
          console.log(`🔄 ${data.saved_count} new meals added from API`);
          alert(
            `✅ Success!\n\n` +
              `${data.saved_count} new meals added!\n` +
              `API calls used: ${data.api_calls_used}\n\n` +
              `Loading new meals...`
          );

          // ✅ Reset pagination and re-enable infinite scroll
          setOffset(0);
          setHasMore(true);
          fetchMeals(0, false);
        } else {
          alert(data.message || "No new meals could be added.");
        }
      } else if (data.status === 429) {
        console.warn("⚠️ API quota exhausted");
        setError("API quota exhausted. Try again next month.");
        alert("❌ API quota exhausted for this month.");
      } else {
        setError(data.message || "Failed to fetch new meals");
      }
    } catch (err) {
      console.error("❌ API fetch error:", err.message);
      setError(err.message || "Failed to fetch new meals");
      alert("❌ Failed to fetch meals from API. Check console for details.");
    } finally {
      setFetchingFromAPI(false);
    }
  };

  // ✅ Handle "Load More" (triggered by scroll OR manual button click)
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;

    const newOffset = offset + BATCH_SIZE;
    console.log(`⬇️ Loading more meals (offset: ${newOffset})`);
    setOffset(newOffset);
    fetchMeals(newOffset, true);
  }, [offset, loadingMore, hasMore, loading]);

  return (
    <div className="shop-page-container">
      {/* Header Section */}
      <div className="shop-header">
        <h1 className="shop-title">🍽️ Meal Shop</h1>
        <p className="shop-subtitle">
          {loading && meals.length === 0
            ? "Loading meals..."
            : `Showing ${meals.length} of ${total} meals`}
        </p>
      </div>

      {/* Content Section */}
      <div className="shop-content">
        {loading && meals.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading delicious meals...</p>
            <p className="loading-hint">
              First time loading may take 30-45 seconds as we fetch fresh data
            </p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>❌ {error}</p>
            <button onClick={() => fetchMeals(0, false)}>Retry</button>
          </div>
        ) : (
          <>
            {/* Meals Grid */}
            <div className="meals-grid">
              {meals.map((meal) => (
                <div
                  key={meal.meal_id}
                  onClick={() => setSelectedMeal(meal)}
                  style={{ cursor: "pointer" }}
                >
                  <ShopCardTemp
                    name={meal.name}
                    image={meal.image_url}
                    accent="red"
                    macros={{
                      calories: meal.calories
                        ? Math.round(meal.calories)
                        : "N/A",
                      protein: meal.protein
                        ? `${Math.round(meal.protein)}g`
                        : "N/A",
                      carbs: meal.carbs ? `${Math.round(meal.carbs)}g` : "N/A",
                      fat: meal.fat ? `${Math.round(meal.fat)}g` : "N/A",
                    }}
                    badges={[
                      `💰 ${meal.price_coins || meal.price || "N/A"} coins`,
                    ]}
                    isOwned={false}
                  />
                </div>
              ))}
            </div>

            {/* ✅ Infinite Scroll Sentinel - Invisible trigger element */}
            {hasMore && meals.length > 0 && !loadingMore && (
              <div ref={observerTarget} className="scroll-sentinel" />
            )}

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="loading-more">
                <div className="small-spinner"></div>
                <p>Loading more meals...</p>
              </div>
            )}

            {/* Fetching from API */}
            {fetchingFromAPI && (
              <div className="loading-more">
                <div className="small-spinner"></div>
                <p>🔄 Loading meals...</p>
                <p className="loading-hint">This may take 10-20 seconds</p>
              </div>
            )}

            {/* ✅ Manual Load More Button - Shows when auto-scroll pauses */}
            {hasMore &&
              !loadingMore &&
              !fetchingFromAPI &&
              meals.length > 0 && (
                <div className="load-buttons">
                  <button className="load-more-btn" onClick={handleLoadMore}>
                    ⬇️ Load {BATCH_SIZE} More
                  </button>
                </div>
              )}

            {/* All DB meals loaded - Show API Fetch Button */}
            {!hasMore && meals.length > 0 && !fetchingFromAPI && (
              <div className="end-section">
                {/* <div className="end-message">
                  ✅ All {total} available meals loaded!
                </div> */}

                <div className="api-fetch-section">
                  <p className="api-hint">🌟 Want more Meals?</p>
                  <button
                    className="fetch-api-btn"
                    onClick={handleFetchFromAPI}
                    disabled={fetchingFromAPI}
                  >
                    🔄 Click Here
                  </button>
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && meals.length === 0 && (
              <div className="no-results">
                <p>🍽️ No meals available yet.</p>
                <button className="fetch-api-btn" onClick={handleFetchFromAPI}>
                  🔄 Fetch Meals from API
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {selectedMeal && (
          <MealModal
            meal={selectedMeal}
            onClose={() => setSelectedMeal(null)}
            onPurchaseSuccess={handlePurchaseSuccess}
          />
        )}
      </div>
    </div>
  );
}
