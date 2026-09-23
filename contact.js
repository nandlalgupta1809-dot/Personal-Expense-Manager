
/*
 * TARGET 27 — CONTACT US + REVIEW / FEEDBACK PAGE
 * Manages user authentication verification, local storage review data persistence,
 * star rating selection, user-scoped review CRUD operations, form validation, and responsiveness.
 */

document.addEventListener("DOMContentLoaded", () => {
  const REVIEWS_STORAGE_KEY = "expense_calculator_reviews_v1";

  let currentUser = null;
  let allReviews = [];
  let currentSelectedRating = 0;
  let editingReviewId = null;
  let pendingDeleteId = null;
  let isSubmitting = false;

  // DOM Elements - Review Form
  const reviewFormCard = document.getElementById("review-form-card");
  const reviewFormTitle = document.getElementById("review-form-title");
  const reviewForm = document.getElementById("review-form");
  const reviewIdInput = document.getElementById("review-id");
  const starButtons = document.querySelectorAll(".star-btn");
  const reviewTitleInput = document.getElementById("review-title");
  const reviewTextInput = document.getElementById("review-text");
  const charCountDisplay = document.getElementById("char-count-display");
  const submitReviewBtn = document.getElementById("submit-review-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");

  const ratingError = document.getElementById("rating-error");
  const titleError = document.getElementById("title-error");
  const textError = document.getElementById("text-error");

  // DOM Elements - Reviews Display
  const myReviewsContainer = document.getElementById("my-reviews-container");
  const reviewsEmptyState = document.getElementById("reviews-empty-state");

  // DOM Elements - Confirmation Modal
  const confirmModal = document.getElementById("confirm-modal");
  const modalCancelBtn = document.getElementById("modal-cancel-btn");
  const modalConfirmBtn = document.getElementById("modal-confirm-btn");

  function init() {
    currentUser = getCurrentUserSession();
    if (!currentUser) {
      window.location.href = "index.html";
      return;
    }

    loadReviews();
    setupEventListeners();
    renderMyReviews();
  }

  function loadReviews() {
    try {
      const stored = localStorage.getItem(REVIEWS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      allReviews = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      allReviews = [];
    }
  }

  function saveReviews() {
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(allReviews));
    } catch (e) {
      if (typeof showToast === "function") {
        showToast("Failed to save review data locally.", "danger");
      }
    }
  }

  function getCurrentUserReviews() {
    if (!currentUser || !currentUser.id) return [];
    return allReviews.filter((r) => r.userId === currentUser.id);
  }

  function setupEventListeners() {
    // Star rating picker
    starButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = parseInt(btn.getAttribute("data-value"), 10);
        setSelectedRating(val);
      });
    });

    // Character counter for textarea
    if (reviewTextInput) {
      reviewTextInput.addEventListener("input", () => {
        const currentLen = reviewTextInput.value.length;
        if (charCountDisplay) {
          charCountDisplay.textContent = `${currentLen} / 1000`;
        }
      });
    }

    // Form submission
    if (reviewForm) {
      reviewForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleFormSubmit();
      });
    }

    // Cancel Edit action
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener("click", () => {
        resetForm();
      });
    }

    // Modal Confirmation Controls
    if (modalCancelBtn) {
      modalCancelBtn.addEventListener("click", closeModal);
    }

    if (modalConfirmBtn) {
      modalConfirmBtn.addEventListener("click", executePendingDelete);
    }
  }

  function setSelectedRating(rating) {
    currentSelectedRating = rating;
    if (ratingError) ratingError.textContent = "";

    starButtons.forEach((btn) => {
      const val = parseInt(btn.getAttribute("data-value"), 10);
      if (val <= rating) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  function validateForm() {
    let isValid = true;

    if (ratingError) ratingError.textContent = "";
    if (titleError) titleError.textContent = "";
    if (textError) textError.textContent = "";

    if (!currentSelectedRating || currentSelectedRating < 1 || currentSelectedRating > 5) {
      if (ratingError) ratingError.textContent = "Please select a rating.";
      isValid = false;
    }

    const textVal = reviewTextInput.value.trim();
    if (!textVal) {
      if (textError) textError.textContent = "Please enter your feedback.";
      isValid = false;
    } else if (textVal.length > 1000) {
      if (textError) textError.textContent = "Feedback cannot exceed 1000 characters.";
      isValid = false;
    }

    const titleVal = reviewTitleInput.value.trim();
    if (titleVal.length > 100) {
      if (titleError) titleError.textContent = "Title cannot exceed 100 characters.";
      isValid = false;
    }

    return isValid;
  }

  function handleFormSubmit() {
    if (isSubmitting) return;

    if (!validateForm()) return;

    isSubmitting = true;
    if (submitReviewBtn) submitReviewBtn.disabled = true;

    const rating = currentSelectedRating;
    const title = reviewTitleInput.value.trim();
    const text = reviewTextInput.value.trim();
    const nowIso = new Date().toISOString();

    if (editingReviewId) {
      // Update existing review
      const targetIndex = allReviews.findIndex((r) => r.id === editingReviewId);

      if (targetIndex !== -1) {
        // Enforce user ownership security check
        if (allReviews[targetIndex].userId !== currentUser.id) {
          if (typeof showToast === "function") {
            showToast("Unauthorized operation.", "danger");
          }
          resetForm();
          isSubmitting = false;
          if (submitReviewBtn) submitReviewBtn.disabled = false;
          return;
        }

        allReviews[targetIndex].rating = rating;
        allReviews[targetIndex].title = title;
        allReviews[targetIndex].text = text;
        allReviews[targetIndex].updatedAt = nowIso;

        saveReviews();
        renderMyReviews();
        resetForm();

        if (typeof showToast === "function") {
          showToast("Your review has been updated on this device.", "success");
        }
      }
    } else {
      // Create new review record
      const uniqueId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const displayName = currentUser.firstName || currentUser.username || "User";

      const newReview = {
        id: uniqueId,
        userId: currentUser.id,
        username: displayName,
        rating: rating,
        title: title,
        text: text,
        createdAt: nowIso,
        updatedAt: nowIso
      };

      allReviews.push(newReview);
      saveReviews();
      renderMyReviews();
      resetForm();

      if (typeof showToast === "function") {
        showToast("Thank you! Your review has been saved on this device.", "success");
      }
    }

    isSubmitting = false;
    if (submitReviewBtn) submitReviewBtn.disabled = false;
  }

  function resetForm() {
    editingReviewId = null;
    currentSelectedRating = 0;

    if (reviewIdInput) reviewIdInput.value = "";
    if (reviewTitleInput) reviewTitleInput.value = "";
    if (reviewTextInput) reviewTextInput.value = "";
    if (charCountDisplay) charCountDisplay.textContent = "0 / 1000";

    setSelectedRating(0);

    if (ratingError) ratingError.textContent = "";
    if (titleError) titleError.textContent = "";
    if (textError) textError.textContent = "";

    if (reviewFormTitle) reviewFormTitle.textContent = "WRITE A REVIEW / FEEDBACK";
    if (submitReviewBtn) submitReviewBtn.textContent = "Submit Review";
    if (cancelEditBtn) cancelEditBtn.classList.add("hidden");
    if (reviewFormCard) reviewFormCard.classList.remove("editing-mode");
  }

  function renderStarsHtml(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars += "★";
      } else {
        stars += "☆";
      }
    }
    return stars;
  }

  function formatDate(isoStr) {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      });
    } catch (e) {
      return "";
    }
  }

  function escapeHtml(text) {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderMyReviews() {
    const userReviews = getCurrentUserReviews();

    // Sort newest first
    userReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (!myReviewsContainer) return;

    myReviewsContainer.innerHTML = "";

    if (userReviews.length === 0) {
      if (reviewsEmptyState) reviewsEmptyState.classList.remove("hidden");
      return;
    }

    if (reviewsEmptyState) reviewsEmptyState.classList.add("hidden");

    userReviews.forEach((review) => {
      const card = document.createElement("div");
      card.className = "review-card";

      const createdFormatted = formatDate(review.createdAt);
      const isUpdated = review.updatedAt && review.updatedAt !== review.createdAt;
      const updatedFormatted = isUpdated ? formatDate(review.updatedAt) : "";

      card.innerHTML = `
        <div class="review-header">
          <div class="review-stars" aria-label="${review.rating} out of 5 stars">${renderStarsHtml(review.rating)}</div>
          <span class="review-date">${createdFormatted}${isUpdated ? ` (Edited: ${updatedFormatted})` : ""}</span>
        </div>
        ${review.title ? `<h3 class="review-card-title">${escapeHtml(review.title)}</h3>` : ""}
        <p class="review-card-text">${escapeHtml(review.text)}</p>
        <div class="review-actions">
          <button class="btn btn-sm btn-outline edit-review-btn" data-id="${review.id}">Edit</button>
          <button class="btn btn-sm btn-danger-outline delete-review-btn" data-id="${review.id}">Delete</button>
        </div>
      `;

      myReviewsContainer.appendChild(card);
    });

    // Attach Edit and Delete listeners
    document.querySelectorAll(".edit-review-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        populateFormForEdit(id);
      });
    });

    document.querySelectorAll(".delete-review-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        promptDeleteReview(id);
      });
    });
  }

  function populateFormForEdit(id) {
    const target = allReviews.find((r) => r.id === id);
    if (!target) return;

    // Security check
    if (target.userId !== currentUser.id) {
      if (typeof showToast === "function") {
        showToast("Unauthorized operation.", "danger");
      }
      return;
    }

    editingReviewId = target.id;
    if (reviewIdInput) reviewIdInput.value = target.id;
    if (reviewTitleInput) reviewTitleInput.value = target.title || "";
    if (reviewTextInput) reviewTextInput.value = target.text || "";

    if (charCountDisplay) {
      charCountDisplay.textContent = `${(target.text || "").length} / 1000`;
    }

    setSelectedRating(target.rating || 0);

    if (reviewFormTitle) reviewFormTitle.textContent = "EDIT REVIEW";
    if (submitReviewBtn) submitReviewBtn.textContent = "Update Review";
    if (cancelEditBtn) cancelEditBtn.classList.remove("hidden");
    if (reviewFormCard) reviewFormCard.classList.add("editing-mode");

    reviewFormCard.scrollIntoView({ behavior: "smooth" });
  }

  function promptDeleteReview(id) {
    const target = allReviews.find((r) => r.id === id);
    if (!target || target.userId !== currentUser.id) return;

    pendingDeleteId = id;
    if (confirmModal) confirmModal.classList.remove("hidden");
  }

  function closeModal() {
    pendingDeleteId = null;
    if (confirmModal) confirmModal.classList.add("hidden");
  }

  function executePendingDelete() {
    if (!pendingDeleteId) return;

    const targetIndex = allReviews.findIndex((r) => r.id === pendingDeleteId);
    if (targetIndex !== -1 && allReviews[targetIndex].userId === currentUser.id) {
      allReviews.splice(targetIndex, 1);
      saveReviews();
      renderMyReviews();

      if (editingReviewId === pendingDeleteId) {
        resetForm();
      }

      if (typeof showToast === "function") {
        showToast("Review deleted successfully.", "info");
      }
    }

    closeModal();
  }

  init();
});