import React, { useState, useEffect } from "react";
import "./WorkoutProgramModal.css";
import axios from "axios";
import { useCookies } from "react-cookie";

export default function WorkoutProgramModal({ isOpen, onClose, onSubmit }) {
  const [cookies] = useCookies(["logged_user"]);
  const [userId, setUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [workoutPrograms, setWorkoutPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCartPopup, setShowCartPopup] = useState(false); // ✅ Cart popup state

  // Pagination states
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalEstimate, setTotalEstimate] = useState(null);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const BATCH_SIZE = 20;
  const MAX_WORKOUTS = 200;

  // Filter states
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("");

  // Decode JWT
  useEffect(() => {
    const token = cookies.logged_user;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.user_id);
      } catch (error) {
        console.error("Invalid JWT:", error);
      }
    }
  }, [cookies]);

  // Auto-fetch workouts when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      resetAndFetch();
      setSelectedPrograms([]);
      setShowCartPopup(false); // ✅ Close cart popup when modal opens
    }
  }, [isOpen, userId]);

  // Fetch workouts when filters change
  useEffect(() => {
    if (isOpen && userId && (selectedDifficulty || selectedMuscle)) {
      resetAndFetch();
    }
  }, [selectedDifficulty, selectedMuscle]);

  const resetAndFetch = () => {
    setOffset(0);
    setHasMore(true);
    setWorkoutPrograms([]);
    setTotalEstimate(null);
    setIsLoadingAll(false);
    fetchWorkouts(0, false);
  };

  const fetchWorkouts = async (currentOffset = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        user_id: userId,
        limit: BATCH_SIZE,
        offset: currentOffset,
      });

      if (selectedDifficulty) params.append("difficulty", selectedDifficulty);
      if (selectedMuscle) params.append("muscle", selectedMuscle);
      if (searchTerm) params.append("search", searchTerm);

      const response = await axios.get(
        `http://localhost/Laccrion/PHP/api/read/getWorkouts.php?${params}`,
        { withCredentials: true }
      );

      if (response.data.status === 200) {
        const newWorkouts = response.data.data || [];

        if (!append && response.data.total_count) {
          setTotalEstimate(response.data.total_count);
        }

        if (append) {
          setWorkoutPrograms((prev) => [...prev, ...newWorkouts]);
        } else {
          setWorkoutPrograms(newWorkouts);
        }

        if (newWorkouts.length < BATCH_SIZE) {
          setHasMore(false);
        }

        if (workoutPrograms.length + newWorkouts.length >= MAX_WORKOUTS) {
          setHasMore(false);
        }
      } else {
        if (!append) setWorkoutPrograms([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching workouts:", error);
      if (!append) setWorkoutPrograms([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const newOffset = offset + BATCH_SIZE;
    setOffset(newOffset);
    fetchWorkouts(newOffset, true);
  };

  const handleLoadAll = async () => {
    if (!hasMore || isLoadingAll) return;

    const confirmed = window.confirm(
      `This will load all remaining workouts. Continue?\n\nNote: Loading many workouts may slow down the page.`
    );

    if (!confirmed) return;

    setIsLoadingAll(true);
    let currentOffset = offset + BATCH_SIZE;
    let keepLoading = true;

    while (keepLoading && workoutPrograms.length < MAX_WORKOUTS) {
      try {
        const params = new URLSearchParams({
          user_id: userId,
          limit: BATCH_SIZE,
          offset: currentOffset,
        });

        if (selectedDifficulty) params.append("difficulty", selectedDifficulty);
        if (selectedMuscle) params.append("muscle", selectedMuscle);

        const response = await axios.get(
          `http://localhost/Laccrion/PHP/api/read/getWorkouts.php?${params}`,
          { withCredentials: true }
        );

        if (response.data.status === 200) {
          const newWorkouts = response.data.data || [];

          if (newWorkouts.length === 0) {
            keepLoading = false;
            break;
          }

          setWorkoutPrograms((prev) => [...prev, ...newWorkouts]);
          currentOffset += BATCH_SIZE;

          if (newWorkouts.length < BATCH_SIZE) {
            keepLoading = false;
          }
        } else {
          keepLoading = false;
        }
      } catch (error) {
        console.error("Error loading all workouts:", error);
        keepLoading = false;
      }
    }

    setOffset(currentOffset);
    setHasMore(false);
    setIsLoadingAll(false);
  };

  const handleSearch = () => {
    if (userId) {
      resetAndFetch();
    }
  };

  const toggleWorkoutSelection = (program) => {
    setSelectedPrograms((prev) => {
      const exists = prev.find((p) => p.workout_id === program.workout_id);
      if (exists) {
        return prev.filter((p) => p.workout_id !== program.workout_id);
      }
      return [...prev, program];
    });
  };

  const isSelected = (workout_id) => {
    return selectedPrograms.some((p) => p.workout_id === workout_id);
  };

  const removeFromCart = (workout_id) => {
    setSelectedPrograms((prev) =>
      prev.filter((p) => p.workout_id !== workout_id)
    );
  };

  const getRewardRange = (difficulty) => {
    const ranges = {
      beginner: { xp: "20-40", coins: "10-20" },
      intermediate: { xp: "50-80", coins: "25-40" },
      expert: { xp: "90-130", coins: "45-65" },
    };
    return ranges[difficulty?.toLowerCase()] || { xp: "?", coins: "?" };
  };

  const handleSubmit = () => {
    if (selectedPrograms.length === 0) {
      alert("Please select at least one workout!");
      return;
    }

    const confirmMessage = `You are about to add ${
      selectedPrograms.length
    } workout(s):\n\n${selectedPrograms
      .map((p) => `• ${p.workout_name}`)
      .join(
        "\n"
      )}\n\n⚠️ You cannot add more workouts until these are completed.\n\nContinue?`;

    if (window.confirm(confirmMessage)) {
      onSubmit(selectedPrograms);
      setSelectedPrograms([]);
      setSearchTerm("");
      setSelectedDifficulty("");
      setSelectedMuscle("");
      setOffset(0);
      setHasMore(true);
      setShowCartPopup(false);
      onClose();
    }
  };

  const filteredPrograms = workoutPrograms.filter((program) =>
    program.workout_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "🟢";
      case "intermediate":
        return "🟡";
      case "expert":
        return "🔴";
      default:
        return "⚪";
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* ✅ Floating Cart Badge */}
        {selectedPrograms.length > 0 && (
          <>
            <div
              className="workout-cart-badge"
              onClick={() => setShowCartPopup(!showCartPopup)}
              title="View selected workouts"
            >
              <span className="cart-badge-icon">🛒</span>
              <span className="cart-badge-count">
                {selectedPrograms.length}
              </span>
            </div>

            {/* ✅ Cart Popup */}
            {showCartPopup && (
              <div
                className="workout-cart-popup"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="cart-popup-header">
                  <span>Selected Workouts ({selectedPrograms.length})</span>
                  <button
                    className="cart-popup-close"
                    onClick={() => setShowCartPopup(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="cart-popup-items">
                  {selectedPrograms.map((program) => {
                    const range = getRewardRange(program.difficulty);
                    return (
                      <div key={program.workout_id} className="cart-item">
                        <span className="cart-item-icon">
                          {getDifficultyIcon(program.difficulty)}
                        </span>
                        <div className="cart-item-details">
                          <span className="cart-item-name">
                            {program.workout_name}
                          </span>
                          <span className="cart-item-rewards">
                            {range.xp} XP • {range.coins} Coins
                          </span>
                        </div>
                        <button
                          className="cart-remove-btn"
                          onClick={() => removeFromCart(program.workout_id)}
                          title="Remove from cart"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <div className="modal-header">
          <h2>Add Workout Programs</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-filter-row">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button className="filter-button" onClick={handleSearch}>
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="filter-section">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="filter-select"
          >
            <option value="">All Difficulties</option>
            <option value="beginner">
              🟢 Beginner (20-40 XP, 10-20 Coins)
            </option>
            <option value="intermediate">
              🟡 Intermediate (50-80 XP, 25-40 Coins)
            </option>
            <option value="expert">🔴 Expert (90-130 XP, 45-65 Coins)</option>
          </select>

          <select
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="filter-select"
          >
            <option value="">All Muscles</option>
            <option value="abdominals">Abdominals</option>
            <option value="biceps">Biceps</option>
            <option value="calves">Calves</option>
            <option value="chest">Chest</option>
            <option value="forearms">Forearms</option>
            <option value="glutes">Glutes</option>
            <option value="hamstrings">Hamstrings</option>
            <option value="lats">Lats</option>
            <option value="lower_back">Lower Back</option>
            <option value="middle_back">Middle Back</option>
            <option value="neck">Neck</option>
            <option value="quadriceps">Quadriceps</option>
            <option value="traps">Traps</option>
            <option value="triceps">Triceps</option>
          </select>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              Loading workouts...
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="no-results">
              No workouts found. Try different filters.
            </div>
          ) : (
            <>
              {workoutPrograms.length > 0 && (
                <div className="workout-count">
                  Showing {workoutPrograms.length} workout
                  {workoutPrograms.length !== 1 ? "s" : ""}
                  {totalEstimate && ` of ~${totalEstimate}`}
                </div>
              )}

              <div className="program-list">
                {filteredPrograms.map((program, index) => {
                  const range = getRewardRange(program.difficulty);
                  const selected = isSelected(program.workout_id);

                  return (
                    <div
                      key={program.workout_id || index}
                      className={`program-item ${selected ? "selected" : ""}`}
                      onClick={() => toggleWorkoutSelection(program)}
                    >
                      <div className="program-icon">
                        {getDifficultyIcon(program.difficulty)}
                      </div>
                      <div className="program-details">
                        <h3>{program.workout_name}</h3>
                        <p className="program-type">
                          {program.workoutType} • {program.muscle}
                          {program.equipment && ` • ${program.equipment}`}
                        </p>
                        <div className="program-rewards">
                          <span className="xp">⚡ {range.xp} XP</span>
                          <span className="coins">🪙 {range.coins}</span>
                        </div>
                      </div>
                      <div className="program-checkbox">{selected && "✓"}</div>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="load-more-container">
                  <button
                    className="load-more-button"
                    onClick={handleLoadMore}
                    disabled={loadingMore || isLoadingAll}
                  >
                    {loadingMore ? (
                      <>
                        <div className="small-spinner"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <span>⬇️</span> Load 20 More
                      </>
                    )}
                  </button>

                  <button
                    className="load-all-button"
                    onClick={handleLoadAll}
                    disabled={loadingMore || isLoadingAll}
                  >
                    {isLoadingAll ? (
                      <>
                        <div className="small-spinner"></div>
                        Loading all...
                      </>
                    ) : (
                      <>
                        <span>⚡</span> Load All
                      </>
                    )}
                  </button>
                </div>
              )}

              {!hasMore && workoutPrograms.length > 0 && (
                <div className="end-message">
                  ✅ All available workouts loaded ({workoutPrograms.length}{" "}
                  total)
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={selectedPrograms.length === 0}
          >
            {selectedPrograms.length === 0
              ? "Select Workouts"
              : `Confirm & Start ${selectedPrograms.length} Workout${
                  selectedPrograms.length > 1 ? "s" : ""
                }`}
          </button>
        </div>
      </div>
    </div>
  );
}
