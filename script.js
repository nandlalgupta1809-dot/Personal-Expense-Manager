
/*
 * TARGET 24 COMPLETED
 *
 * Dashboard established as the main expense-management page.
 *
 * Verified:
 * - Add Expense
 * - Edit Expense
 * - Delete Expense
 * - Expense List
 * - Filtering
 * - Sorting
 * - Dashboard Summary
 * - User-specific data
 * - Authentication protection
 * - Dark Mode
 * - Responsive layout
 *
 * Analytics, Download, and Contact/Review functionality
 * remain scheduled for later targets.
 */

document.addEventListener("DOMContentLoaded", () => {
  const EXPENSES_STORAGE_KEY = "expense_calculator_expenses_v2";
  const BUDGETS_STORAGE_KEY = "expense_calculator_budgets_v2";
  
  const VALID_CATEGORIES = [
    "Food & Dining",
    "Transportation",
    "Utilities",
    "Entertainment",
    "Shopping",
    "Health & Medical",
    "Other"
  ];

  let allExpenses = [];
  let allBudgets = {};
  let currentUser = getCurrentUserSession();

  let selectedMonthKey = getCurrentMonthKey();
  let isAllTimeView = false;
  let editingExpenseId = null;
  let modalConfirmCallback = null;

  const filterState = {
    search: "",
    category: "ALL",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
    sort: "newest"
  };

  // DOM Elements
  const welcomeHeading = document.getElementById("welcome-heading");

  // Profile details sheet
  const userProfileSection = document.getElementById("user-profile-section");
  const userIdTrigger = document.getElementById("user-id-trigger");
  const userIdDisplay = document.getElementById("user-id-display");
  const userDetailsSheet = document.getElementById("user-details-sheet");
  const profileUserName = document.getElementById("profile-user-name");
  const profileUserId = document.getElementById("profile-user-id");
  const profileUserEmail = document.getElementById("profile-user-email");
  const profileAccountType = document.getElementById("profile-account-type");

  const expenseForm = document.getElementById("expense-form");
  const formCard = document.querySelector(".form-card");
  const formTitle = document.getElementById("form-title");
  const expenseIdInput = document.getElementById("expense-id");
  const titleInput = document.getElementById("expense-title");
  const amountInput = document.getElementById("expense-amount");
  const categoryInput = document.getElementById("expense-category");
  const dateInput = document.getElementById("expense-date");
  const notesInput = document.getElementById("expense-notes");
  const saveExpenseBtn = document.getElementById("save-expense-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const clearAllBtn = document.getElementById("clear-all-btn");

  const titleError = document.getElementById("title-error");
  const amountError = document.getElementById("amount-error");
  const categoryError = document.getElementById("category-error");
  const dateError = document.getElementById("date-error");

  const searchInput = document.getElementById("search-input");
  const filterCategory = document.getElementById("filter-category");
  const sortExpensesSelect = document.getElementById("sort-expenses");
  const filterDateFrom = document.getElementById("filter-date-from");
  const filterDateTo = document.getElementById("filter-date-to");
  const filterMinAmount = document.getElementById("filter-min-amount");
  const filterMaxAmount = document.getElementById("filter-max-amount");
  const filterResultsCount = document.getElementById("filter-results-count");
  const activeFilterBadge = document.getElementById("active-filter-badge");
  const clearFiltersBtn = document.getElementById("clear-filters-btn");

  const expensesTbody = document.getElementById("expenses-tbody");
  const noExpensesMessage = document.getElementById("no-expenses-message");
  const emptyStateText = document.getElementById("empty-state-text");

  const prevMonthBtn = document.getElementById("prev-month-btn");
  const nextMonthBtn = document.getElementById("next-month-btn");
  const currentMonthLabel = document.getElementById("current-month-label");
  const toggleAllMonthsBtn = document.getElementById("toggle-all-months-btn");
  const allTimeBadge = document.getElementById("all-time-badge");

  const monthlyTotalEl = document.getElementById("monthly-total");
  const momComparisonSubtextEl = document.getElementById("mom-comparison-subtext");
  const monthlyDailyAvgEl = document.getElementById("monthly-daily-average");

  const monthlyHighestEl = document.getElementById("monthly-highest");
  const highestExpenseSubtextEl = document.getElementById("highest-expense-subtext");
  const monthlyCountEl = document.getElementById("monthly-count");
  const monthlyAverageEl = document.getElementById("monthly-average");

  const topCategoryNameEl = document.getElementById("top-category-name");
  const topCategorySubtextEl = document.getElementById("top-category-subtext");
  const highestSpendingDayEl = document.getElementById("highest-spending-day");
  const highestDaySubtextEl = document.getElementById("highest-day-subtext");

  const insightsContainer = document.getElementById("insights-container");

  const budgetForm = document.getElementById("budget-form");
  const budgetInput = document.getElementById("budget-input");
  const budgetError = document.getElementById("budget-error");
  const budgetStatusBadge = document.getElementById("budget-status-badge");
  const budgetMonthSubtitle = document.getElementById("budget-month-subtitle");
  const budgetFormMonth = document.getElementById("budget-form-month");
  const budgetAmountDisplay = document.getElementById("budget-amount-display");
  const budgetSpentDisplay = document.getElementById("budget-spent-display");
  const budgetRemainingDisplay = document.getElementById("budget-remaining-display");
  const budgetPercentageDisplay = document.getElementById("budget-percentage-display");
  const progressTextDisplay = document.getElementById("progress-text-display");
  const budgetProgressFill = document.getElementById("budget-progress-fill");
  const clearBudgetBtn = document.getElementById("clear-budget-btn");

  const confirmModal = document.getElementById("confirm-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDesc = document.getElementById("modal-desc");
  const modalCancelBtn = document.getElementById("modal-cancel-btn");
  const modalConfirmBtn = document.getElementById("modal-confirm-btn");

  if (dateInput) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }

  function init() {
    currentUser = getCurrentUserSession();

    if (welcomeHeading && currentUser) {
      const name = currentUser.firstName || currentUser.username || "User";
      welcomeHeading.textContent = `Hello, ${name}`;
    }

    updateProfileDetailsUI(currentUser);
    setupProfileDetailsSheet();

    loadLocalData();
    setupEventListeners();
    renderApp();
  }

  // ==========================================
  // PROFILE DETAILS SHEET
  // ==========================================

  function getProfileDisplayName(user) {
    if (!user) return "—";

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    return fullName || user.username || "—";
  }

  function updateProfileDetailsUI(user) {
    const hasUser = !!(user && user.id);

    if (userIdTrigger) {
      userIdTrigger.classList.toggle("hidden", !hasUser);
      userIdTrigger.disabled = !hasUser;
      userIdTrigger.setAttribute("aria-expanded", "false");
    }

    if (userIdDisplay) {
      userIdDisplay.textContent = hasUser ? user.id : "—";
    }

    if (profileUserName) {
      profileUserName.textContent = hasUser
        ? getProfileDisplayName(user)
        : "—";
    }

    if (profileUserId) {
      profileUserId.textContent = hasUser ? user.id : "—";
    }

    if (profileUserEmail) {
      profileUserEmail.textContent = hasUser
        ? (user.email || "—")
        : "—";
    }

    if (profileAccountType) {
      const type = String(
        (user && user.accountType) || ""
      ).toLowerCase();

      profileAccountType.textContent = !hasUser
        ? "—"
        : (type === "business" ? "Business" : "Personal");
    }

    closeProfileDetailsSheet();
  }

  function openProfileDetailsSheet() {
    if (!userDetailsSheet || !currentUser) return;

    userDetailsSheet.classList.remove("hidden");

    requestAnimationFrame(() => {
      if (userDetailsSheet) {
        userDetailsSheet.classList.add("open");
      }
    });

    if (userIdTrigger) {
      userIdTrigger.setAttribute("aria-expanded", "true");
    }

    userDetailsSheet.setAttribute("aria-hidden", "false");
  }

  function closeProfileDetailsSheet() {
    if (!userDetailsSheet) return;

    userDetailsSheet.classList.remove("open");

    if (userIdTrigger) {
      userIdTrigger.setAttribute("aria-expanded", "false");
    }

    userDetailsSheet.setAttribute("aria-hidden", "true");

    window.setTimeout(() => {
      if (
        userDetailsSheet &&
        !userDetailsSheet.classList.contains("open")
      ) {
        userDetailsSheet.classList.add("hidden");
      }
    }, 220);
  }

  function toggleProfileDetailsSheet() {
    if (!currentUser || !userDetailsSheet) return;

    if (userDetailsSheet.classList.contains("open")) {
      closeProfileDetailsSheet();
    } else {
      openProfileDetailsSheet();
    }
  }

  function setupProfileDetailsSheet() {
    if (userIdTrigger) {
      userIdTrigger.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleProfileDetailsSheet();
      });
    }

    if (userDetailsSheet) {
      userDetailsSheet.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    }

    document.addEventListener("click", (event) => {
      if (!userProfileSection || !userDetailsSheet) return;

      if (!userProfileSection.contains(event.target)) {
        closeProfileDetailsSheet();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeProfileDetailsSheet();
      }
    });
  }

  // ==========================================
  // LOCAL DATA
  // ==========================================

  function loadLocalData() {
    try {
      const storedExpenses = localStorage.getItem(
        EXPENSES_STORAGE_KEY
      );

      allExpenses = storedExpenses
        ? JSON.parse(storedExpenses)
        : [];

      if (!Array.isArray(allExpenses)) {
        allExpenses = [];
      }

      const storedBudgets = localStorage.getItem(
        BUDGETS_STORAGE_KEY
      );

      const parsedBudgets = storedBudgets
        ? JSON.parse(storedBudgets)
        : {};

      allBudgets =
        parsedBudgets &&
        typeof parsedBudgets === "object" &&
        !Array.isArray(parsedBudgets)
          ? parsedBudgets
          : {};
    } catch (e) {
      allExpenses = [];
      allBudgets = {};
    }
  }

  function saveData() {
    try {
      localStorage.setItem(
        EXPENSES_STORAGE_KEY,
        JSON.stringify(allExpenses)
      );

      localStorage.setItem(
        BUDGETS_STORAGE_KEY,
        JSON.stringify(allBudgets)
      );
    } catch (e) {
      showToast(
        "Unable to write to local storage.",
        "warning"
      );
    }
  }

  function getUserExpenses() {
    if (!currentUser || !currentUser.id) {
      return [];
    }

    return allExpenses.filter(
      (e) =>
        e.userId === currentUser.id ||
        !e.userId
    );
  }

  function getUserBudgetKey(monthKey) {
    const uid = currentUser
      ? currentUser.id
      : "guest";

    return `${uid}_${monthKey}`;
  }

  // ==========================================
  // DATE / CURRENCY HELPERS
  // ==========================================

  function getCurrentMonthKey() {
    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
  }

  function getPreviousMonthKey(monthKey) {
    if (!monthKey || !monthKey.includes("-")) {
      return getCurrentMonthKey();
    }

    const [year, month] = monthKey
      .split("-")
      .map(Number);

    const date = new Date(
      year,
      month - 2,
      1
    );

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
  }

  function formatCurrency(amount) {
    const num = Number(amount);

    const safeNum =
      isNaN(num) || !isFinite(num)
        ? 0
        : num;

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safeNum);
  }

  function formatMonthLabel(monthKey) {
    if (!monthKey || !monthKey.includes("-")) {
      return "All Time";
    }

    const [year, month] = monthKey
      .split("-")
      .map(Number);

    return new Date(
      year,
      month - 1,
      1
    ).toLocaleString("en-US", {
      month: "long",
      year: "numeric"
    });
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return "";

    const parts = dateStr.split("-");

    if (parts.length !== 3) {
      return dateStr;
    }

    return new Date(
      parts[0],
      parts[1] - 1,
      parts[2]
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  // ==========================================
  // EXPENSE FILTERING
  // ==========================================

  function getExpensesForSelectedMonth() {
    const userExpenses = getUserExpenses();

    if (isAllTimeView) {
      return [...userExpenses];
    }

    return userExpenses.filter(
      (e) =>
        e.date &&
        e.date.startsWith(selectedMonthKey)
    );
  }

  function getFilteredExpenses(baseList) {
    return baseList
      .filter((exp) => {
        if (filterState.search) {
          const query =
            filterState.search.toLowerCase();

          if (
            !(exp.title || "")
              .toLowerCase()
              .includes(query) &&
            !(exp.notes || "")
              .toLowerCase()
              .includes(query)
          ) {
            return false;
          }
        }

        if (
          filterState.category !== "ALL" &&
          exp.category !== filterState.category
        ) {
          return false;
        }

        if (
          filterState.dateFrom &&
          exp.date < filterState.dateFrom
        ) {
          return false;
        }

        if (
          filterState.dateTo &&
          exp.date > filterState.dateTo
        ) {
          return false;
        }

        if (
          filterState.minAmount !== "" &&
          exp.amount < Number(filterState.minAmount)
        ) {
          return false;
        }

        if (
          filterState.maxAmount !== "" &&
          exp.amount > Number(filterState.maxAmount)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filterState.sort === "newest") {
          return new Date(b.date) - new Date(a.date);
        }

        if (filterState.sort === "oldest") {
          return new Date(a.date) - new Date(b.date);
        }

        if (filterState.sort === "amount-high") {
          return b.amount - a.amount;
        }

        if (filterState.sort === "amount-low") {
          return a.amount - b.amount;
        }

        if (filterState.sort === "title-az") {
          return (a.title || "").localeCompare(
            b.title || ""
          );
        }

        return 0;
      });
  }

  // ==========================================
  // MAIN RENDERING
  // ==========================================

  function renderApp() {
    renderMonthHeader();

    const monthlyList =
      getExpensesForSelectedMonth();

    const filteredList =
      getFilteredExpenses(monthlyList);

    renderExpensesTable(
      filteredList,
      monthlyList.length
    );

    renderOverviewCards(monthlyList);
    renderBudgetSection(monthlyList);
    renderSmartInsights(monthlyList);
    updateFilterBadgeState();
  }

  function renderMonthHeader() {
    if (currentMonthLabel) {
      currentMonthLabel.textContent =
        isAllTimeView
          ? "All Time Overview"
          : formatMonthLabel(selectedMonthKey);
    }

    if (allTimeBadge) {
      if (isAllTimeView) {
        allTimeBadge.classList.remove("hidden");
      } else {
        allTimeBadge.classList.add("hidden");
      }
    }

    if (toggleAllMonthsBtn) {
      toggleAllMonthsBtn.textContent =
        isAllTimeView
          ? "Show Monthly View"
          : "Show All Time";
    }
  }

  function updateFilterBadgeState() {
    const isFiltered =
      filterState.search !== "" ||
      filterState.category !== "ALL" ||
      filterState.dateFrom !== "" ||
      filterState.dateTo !== "" ||
      filterState.minAmount !== "" ||
      filterState.maxAmount !== "" ||
      filterState.sort !== "newest";

    if (activeFilterBadge) {
      if (isFiltered) {
        activeFilterBadge.classList.remove("hidden");
      } else {
        activeFilterBadge.classList.add("hidden");
      }
    }

    if (clearFiltersBtn) {
      if (isFiltered) {
        clearFiltersBtn.classList.remove("hidden");
      } else {
        clearFiltersBtn.classList.add("hidden");
      }
    }
  }

  // ==========================================
  // EXPENSE TABLE
  // ==========================================

  function renderExpensesTable(
    filteredList,
    monthlyTotalCount
  ) {
    if (!expensesTbody || !noExpensesMessage) {
      return;
    }

    expensesTbody.innerHTML = "";

    if (filteredList.length === 0) {
      noExpensesMessage.classList.remove("hidden");

      if (emptyStateText) {
        emptyStateText.textContent =
          monthlyTotalCount > 0
            ? "No expenses match your active filter parameters."
            : "No expenses recorded for this time period.";
      }
    } else {
      noExpensesMessage.classList.add("hidden");

      filteredList.forEach((item) => {
        const tr =
          document.createElement("tr");

        tr.innerHTML = `
          <td>${formatShortDate(item.date)}</td>
          <td style="font-weight: 600;">${item.title}</td>
          <td>
            <span class="category-badge">
              ${item.category}
            </span>
          </td>
          <td style="font-weight: 700;">
            ${formatCurrency(item.amount)}
          </td>
          <td style="color: var(--text-muted); font-size: 0.85rem;">
            ${item.notes || "-"}
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button
                class="btn btn-sm btn-outline edit-btn"
                data-id="${item.id}"
              >
                Edit
              </button>

              <button
                class="btn btn-sm btn-danger-outline delete-btn"
                data-id="${item.id}"
              >
                Delete
              </button>
            </div>
          </td>
        `;

        expensesTbody.appendChild(tr);
      });
    }

    if (filterResultsCount) {
      filterResultsCount.textContent =
        `Showing ${filteredList.length} of ${monthlyTotalCount} expenses`;
    }
  }

  // ==========================================
  // OVERVIEW CARDS
  // ==========================================

  function renderOverviewCards(monthlyList) {
    const totalSpent =
      monthlyList.reduce(
        (sum, item) => sum + item.amount,
        0
      );

    const count = monthlyList.length;

    if (monthlyTotalEl) {
      monthlyTotalEl.textContent =
        formatCurrency(totalSpent);
    }

    if (monthlyCountEl) {
      monthlyCountEl.textContent =
        count;
    }

    if (monthlyAverageEl) {
      const avg =
        count > 0
          ? totalSpent / count
          : 0;

      monthlyAverageEl.textContent =
        formatCurrency(avg);
    }

    if (monthlyDailyAvgEl) {
      if (count === 0) {
        monthlyDailyAvgEl.textContent =
          formatCurrency(0);
      } else {
        const days =
          isAllTimeView
            ? 30
            : new Date(
                selectedMonthKey.split("-")[0],
                selectedMonthKey.split("-")[1],
                0
              ).getDate();

        monthlyDailyAvgEl.textContent =
          formatCurrency(
            totalSpent / days
          );
      }
    }

    if (monthlyHighestEl) {
      if (count === 0) {
        monthlyHighestEl.textContent =
          formatCurrency(0);

        if (highestExpenseSubtextEl) {
          highestExpenseSubtextEl.textContent =
            "None recorded";
        }
      } else {
        const highest =
          monthlyList.reduce(
            (max, item) =>
              item.amount > max.amount
                ? item
                : max,
            monthlyList[0]
          );

        monthlyHighestEl.textContent =
          formatCurrency(highest.amount);

        if (highestExpenseSubtextEl) {
          highestExpenseSubtextEl.textContent =
            highest.title;
        }
      }
    }

    if (topCategoryNameEl) {
      if (count === 0) {
        topCategoryNameEl.textContent =
          "None";

        if (topCategorySubtextEl) {
          topCategorySubtextEl.textContent =
            "0.0% of total";
        }
      } else {
        const catMap = {};

        monthlyList.forEach((e) => {
          catMap[e.category] =
            (catMap[e.category] || 0) +
            e.amount;
        });

        let topCat = "";
        let maxVal = 0;

        Object.keys(catMap).forEach((cat) => {
          if (catMap[cat] > maxVal) {
            maxVal = catMap[cat];
            topCat = cat;
          }
        });

        const pct =
          totalSpent > 0
            ? ((maxVal / totalSpent) * 100).toFixed(1)
            : 0;

        topCategoryNameEl.textContent =
          topCat;

        if (topCategorySubtextEl) {
          topCategorySubtextEl.textContent =
            `${pct}% of total`;
        }
      }
    }

    if (highestSpendingDayEl) {
      if (count === 0) {
        highestSpendingDayEl.textContent =
          "None";

        if (highestDaySubtextEl) {
          highestDaySubtextEl.textContent =
            "₹0.00 spent";
        }
      } else {
        const dayMap = {};

        monthlyList.forEach((e) => {
          dayMap[e.date] =
            (dayMap[e.date] || 0) +
            e.amount;
        });

        let peakDay = "";
        let maxDayVal = 0;

        Object.keys(dayMap).forEach((day) => {
          if (dayMap[day] > maxDayVal) {
            maxDayVal = dayMap[day];
            peakDay = day;
          }
        });

        highestSpendingDayEl.textContent =
          formatShortDate(peakDay);

        if (highestDaySubtextEl) {
          highestDaySubtextEl.textContent =
            `${formatCurrency(maxDayVal)} spent`;
        }
      }
    }

    if (momComparisonSubtextEl) {
      if (isAllTimeView) {
        momComparisonSubtextEl.textContent =
          "All time combined total";

        momComparisonSubtextEl.className =
          "stat-subtext text-muted";
      } else {
        const prevMonthKey =
          getPreviousMonthKey(
            selectedMonthKey
          );

        const userExpenses =
          getUserExpenses();

        const prevTotal =
          userExpenses
            .filter(
              (e) =>
                e.date &&
                e.date.startsWith(
                  prevMonthKey
                )
            )
            .reduce(
              (sum, item) =>
                sum + item.amount,
              0
            );

        if (prevTotal === 0) {
          momComparisonSubtextEl.textContent =
            "No previous month data";

          momComparisonSubtextEl.className =
            "stat-subtext text-muted";
        } else {
          const diff =
            totalSpent - prevTotal;

          const diffPct =
            (
              (diff / prevTotal) *
              100
            ).toFixed(1);

          momComparisonSubtextEl.textContent =
            `${diff > 0 ? "+" : ""}${diffPct}% vs last month`;

          momComparisonSubtextEl.className =
            `stat-subtext ${
              diff > 0
                ? "text-danger"
                : "text-success"
            }`;
        }
      }
    }
  }

  // ==========================================
  // BUDGET
  // ==========================================

  function renderBudgetSection(monthlyList) {
    if (!budgetStatusBadge) return;

    if (isAllTimeView) {
      if (budgetMonthSubtitle) {
        budgetMonthSubtitle.textContent =
          "Budget tracking disabled in All Time view";
      }

      budgetStatusBadge.textContent =
        "N/A";

      budgetStatusBadge.className =
        "status-badge status-none";

      if (clearBudgetBtn) {
        clearBudgetBtn.classList.add("hidden");
      }

      return;
    }

    const bKey =
      getUserBudgetKey(
        selectedMonthKey
      );

    const currentBudget =
      allBudgets[bKey]
        ? Number(allBudgets[bKey])
        : null;

    const totalSpent =
      monthlyList.reduce(
        (sum, item) =>
          sum + item.amount,
        0
      );

    if (budgetFormMonth) {
      budgetFormMonth.textContent =
        formatMonthLabel(
          selectedMonthKey
        );
    }

    if (budgetMonthSubtitle) {
      budgetMonthSubtitle.textContent =
        `Target budget for ${formatMonthLabel(
          selectedMonthKey
        )}`;
    }

    if (currentBudget === null) {
      budgetStatusBadge.textContent =
        "No Budget Set";

      budgetStatusBadge.className =
        "status-badge status-none";

      if (budgetAmountDisplay) {
        budgetAmountDisplay.textContent =
          formatCurrency(0);
      }

      if (budgetSpentDisplay) {
        budgetSpentDisplay.textContent =
          formatCurrency(totalSpent);
      }

      if (budgetRemainingDisplay) {
        budgetRemainingDisplay.textContent =
          formatCurrency(0);
      }

      if (budgetPercentageDisplay) {
        budgetPercentageDisplay.textContent =
          "0%";
      }

      if (progressTextDisplay) {
        progressTextDisplay.textContent =
          "Set a budget above to start tracking.";
      }

      if (budgetProgressFill) {
        budgetProgressFill.style.width =
          "0%";
      }

      if (clearBudgetBtn) {
        clearBudgetBtn.classList.add(
          "hidden"
        );
      }
    } else {
      if (clearBudgetBtn) {
        clearBudgetBtn.classList.remove(
          "hidden"
        );
      }

      const remaining =
        currentBudget - totalSpent;

      const pct =
        Math.min(
          Math.round(
            (totalSpent / currentBudget) *
              100
          ),
          100
        );

      if (budgetAmountDisplay) {
        budgetAmountDisplay.textContent =
          formatCurrency(currentBudget);
      }

      if (budgetSpentDisplay) {
        budgetSpentDisplay.textContent =
          formatCurrency(totalSpent);
      }

      if (budgetRemainingDisplay) {
        budgetRemainingDisplay.textContent =
          formatCurrency(remaining);
      }

      if (budgetPercentageDisplay) {
        budgetPercentageDisplay.textContent =
          `${pct}%`;
      }

      if (budgetProgressFill) {
        budgetProgressFill.style.width =
          `${pct}%`;
      }

      if (totalSpent > currentBudget) {
        budgetStatusBadge.textContent =
          "Over Budget";

        budgetStatusBadge.className =
          "status-badge status-danger";

        if (progressTextDisplay) {
          progressTextDisplay.textContent =
            `Exceeded target budget by ${formatCurrency(
              totalSpent - currentBudget
            )}`;
        }
      } else if (pct >= 85) {
        budgetStatusBadge.textContent =
          "Near Limit";

        budgetStatusBadge.className =
          "status-badge status-warning";

        if (progressTextDisplay) {
          progressTextDisplay.textContent =
            `Used ${pct}% of your monthly target`;
        }
      } else {
        budgetStatusBadge.textContent =
          "On Track";

        budgetStatusBadge.className =
          "status-badge status-success";

        if (progressTextDisplay) {
          progressTextDisplay.textContent =
            `${formatCurrency(
              remaining
            )} remaining in budget`;
        }
      }
    }
  }

  // ==========================================
  // SMART INSIGHTS
  // ==========================================

  function renderSmartInsights(monthlyList) {
    if (!insightsContainer) return;

    insightsContainer.innerHTML = "";

    if (monthlyList.length === 0) {
      insightsContainer.innerHTML =
        `<p class="text-muted" style="font-size: 0.9rem;">
          Add expenses to view automated financial observations.
        </p>`;

      return;
    }

    const totalSpent =
      monthlyList.reduce(
        (sum, item) =>
          sum + item.amount,
        0
      );

    const catMap = {};

    monthlyList.forEach((e) => {
      catMap[e.category] =
        (catMap[e.category] || 0) +
        e.amount;
    });

    let topCat = "";
    let maxCatVal = 0;

    Object.keys(catMap).forEach((c) => {
      if (catMap[c] > maxCatVal) {
        maxCatVal = catMap[c];
        topCat = c;
      }
    });

    const topPct =
      ((maxCatVal / totalSpent) * 100)
        .toFixed(0);

    const insight1 =
      document.createElement("div");

    insight1.className =
      "insight-item";

    insight1.innerHTML =
      `<strong>Category Focus:</strong>
       Your largest spending area is
       <strong>${topCat}</strong>
       comprising ${topPct}%
       (${formatCurrency(maxCatVal)})
       of recorded spending.`;

    insightsContainer.appendChild(
      insight1
    );
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  function setupEventListeners() {
    const logoutBtn =
      document.getElementById(
        "logout-btn"
      );

    if (logoutBtn) {
      logoutBtn.addEventListener(
        "click",
        () => {
          closeProfileDetailsSheet();
        }
      );
    }

    if (expenseForm) {
      expenseForm.addEventListener(
        "submit",
        (e) => {
          e.preventDefault();
          saveExpense();
        }
      );
    }

    if (cancelEditBtn) {
      cancelEditBtn.addEventListener(
        "click",
        resetExpenseForm
      );
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener(
        "click",
        () => {
          openConfirmModal(
            "Clear All Expenses?",
            "Are you sure you want to delete ALL your expense records? This cannot be undone.",
            () => {
              const userId =
                currentUser
                  ? currentUser.id
                  : null;

              allExpenses =
                allExpenses.filter(
                  (item) =>
                    item.userId !== userId &&
                    item.userId
                );

              saveData();
              renderApp();

              showToast(
                "All your expenses have been cleared.",
                "info"
              );
            }
          );
        }
      );
    }

    if (expensesTbody) {
      expensesTbody.addEventListener(
        "click",
        (e) => {
          const target =
            e.target;

          if (
            target.classList.contains(
              "edit-btn"
            )
          ) {
            startEditingExpense(
              target.getAttribute(
                "data-id"
              )
            );
          } else if (
            target.classList.contains(
              "delete-btn"
            )
          ) {
            const id =
              target.getAttribute(
                "data-id"
              );

            openConfirmModal(
              "Delete Expense?",
              "Are you sure you want to delete this expense record?",
              () => {
                allExpenses =
                  allExpenses.filter(
                    (item) =>
                      item.id !== id
                  );

                saveData();
                renderApp();

                showToast(
                  "Expense record deleted.",
                  "success"
                );
              }
            );
          }
        }
      );
    }

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        (e) => {
          filterState.search =
            e.target.value;

          renderApp();
        }
      );
    }

    if (filterCategory) {
      filterCategory.addEventListener(
        "change",
        (e) => {
          filterState.category =
            e.target.value;

          renderApp();
        }
      );
    }

    if (sortExpensesSelect) {
      sortExpensesSelect.addEventListener(
        "change",
        (e) => {
          filterState.sort =
            e.target.value;

          renderApp();
        }
      );
    }

    if (filterDateFrom) {
      filterDateFrom.addEventListener(
        "change",
        (e) => {
          filterState.dateFrom =
            e.target.value;

          renderApp();
        }
      );
    }

    if (filterDateTo) {
      filterDateTo.addEventListener(
        "change",
        (e) => {
          filterState.dateTo =
            e.target.value;

          renderApp();
        }
      );
    }

    if (filterMinAmount) {
      filterMinAmount.addEventListener(
        "input",
        (e) => {
          filterState.minAmount =
            e.target.value;

          renderApp();
        }
      );
    }

    if (filterMaxAmount) {
      filterMaxAmount.addEventListener(
        "input",
        (e) => {
          filterState.maxAmount =
            e.target.value;

          renderApp();
        }
      );
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener(
        "click",
        resetFilters
      );
    }

    if (prevMonthBtn) {
      prevMonthBtn.addEventListener(
        "click",
        () => {
          isAllTimeView = false;

          selectedMonthKey =
            getPreviousMonthKey(
              selectedMonthKey
            );

          renderApp();
        }
      );
    }

    if (nextMonthBtn) {
      nextMonthBtn.addEventListener(
        "click",
        () => {
          isAllTimeView = false;

          const [y, m] =
            selectedMonthKey
              .split("-")
              .map(Number);

          const d =
            new Date(
              y,
              m,
              1
            );

          selectedMonthKey =
            `${d.getFullYear()}-${String(
              d.getMonth() + 1
            ).padStart(2, "0")}`;

          renderApp();
        }
      );
    }

    if (toggleAllMonthsBtn) {
      toggleAllMonthsBtn.addEventListener(
        "click",
        () => {
          isAllTimeView =
            !isAllTimeView;

          renderApp();
        }
      );
    }

    if (budgetForm) {
      budgetForm.addEventListener(
        "submit",
        (e) => {
          e.preventDefault();

          const val =
            Number(budgetInput.value);

          if (
            isNaN(val) ||
            val <= 0
          ) {
            if (budgetError) {
              budgetError.textContent =
                "Please enter a valid positive budget amount.";
            }

            return;
          }

          if (budgetError) {
            budgetError.textContent =
              "";
          }

          const bKey =
            getUserBudgetKey(
              selectedMonthKey
            );

          allBudgets[bKey] =
            val;

          saveData();

          budgetInput.value =
            "";

          renderApp();

          showToast(
            "Monthly budget updated successfully.",
            "success"
          );
        }
      );
    }

    if (clearBudgetBtn) {
      clearBudgetBtn.addEventListener(
        "click",
        () => {
          const bKey =
            getUserBudgetKey(
              selectedMonthKey
            );

          delete allBudgets[bKey];

          saveData();
          renderApp();

          showToast(
            "Monthly budget cleared.",
            "info"
          );
        }
      );
    }

    if (modalConfirmBtn) {
      modalConfirmBtn.addEventListener(
        "click",
        () => {
          if (
            typeof modalConfirmCallback ===
            "function"
          ) {
            modalConfirmCallback();
          }

          closeConfirmModal();
        }
      );
    }

    if (modalCancelBtn) {
      modalCancelBtn.addEventListener(
        "click",
        closeConfirmModal
      );
    }
  }

  // ==========================================
  // SAVE EXPENSE
  // ==========================================

  function saveExpense() {
    clearFormErrors();

    const title =
      titleInput.value.trim();

    const amount =
      Number(amountInput.value);

    const category =
      categoryInput.value;

    const date =
      dateInput.value;

    const notes =
      notesInput.value.trim();

    let isValid = true;

    if (!title) {
      if (titleError) {
        titleError.textContent =
          "Title is required.";
      }

      isValid = false;
    }

    if (
      isNaN(amount) ||
      amount <= 0
    ) {
      if (amountError) {
        amountError.textContent =
          "Amount must be a positive number.";
      }

      isValid = false;
    }

    if (
      !category ||
      !VALID_CATEGORIES.includes(
        category
      )
    ) {
      if (categoryError) {
        categoryError.textContent =
          "Please select a valid category.";
      }

      isValid = false;
    }

    if (!date) {
      if (dateError) {
        dateError.textContent =
          "Date is required.";
      }

      isValid = false;
    }

    if (!isValid) return;

    const currentUserId =
      currentUser
        ? currentUser.id
        : "guest";

    if (editingExpenseId) {
      const idx =
        allExpenses.findIndex(
          (e) =>
            e.id ===
            editingExpenseId
        );

      if (idx !== -1) {
        allExpenses[idx] = {
          ...allExpenses[idx],
          title,
          amount,
          category,
          date,
          notes,
          userId:
            currentUserId
        };

        showToast(
          "Expense updated successfully.",
          "success"
        );
      }
    } else {
      allExpenses.push({
        id: `EXP-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`,

        userId:
          currentUserId,

        title,
        amount,
        category,
        date,
        notes,

        createdAt:
          new Date().toISOString()
      });

      showToast(
        "Expense added successfully.",
        "success"
      );
    }

    saveData();
    resetExpenseForm();
    renderApp();
  }

  // ==========================================
  // EDIT EXPENSE
  // ==========================================

  function startEditingExpense(id) {
    const item =
      allExpenses.find(
        (e) => e.id === id
      );

    if (!item) return;

    editingExpenseId =
      item.id;

    if (expenseIdInput) {
      expenseIdInput.value =
        item.id;
    }

    if (titleInput) {
      titleInput.value =
        item.title;
    }

    if (amountInput) {
      amountInput.value =
        item.amount;
    }

    if (categoryInput) {
      categoryInput.value =
        item.category;
    }

    if (dateInput) {
      dateInput.value =
        item.date;
    }

    if (notesInput) {
      notesInput.value =
        item.notes || "";
    }

    if (formTitle) {
      formTitle.textContent =
        "Edit Expense";
    }

    if (saveExpenseBtn) {
      saveExpenseBtn.textContent =
        "Update Expense";
    }

    if (cancelEditBtn) {
      cancelEditBtn.classList.remove(
        "hidden"
      );
    }

    if (formCard) {
      formCard.classList.add(
        "editing-mode"
      );

      formCard.scrollIntoView({
        behavior: "smooth"
      });
    }
  }

  function resetExpenseForm() {
    editingExpenseId = null;

    if (expenseForm) {
      expenseForm.reset();
    }

    if (expenseIdInput) {
      expenseIdInput.value =
        "";
    }

    if (dateInput) {
      dateInput.value =
        new Date()
          .toISOString()
          .split("T")[0];
    }

    if (formTitle) {
      formTitle.textContent =
        "Add New Expense";
    }

    if (saveExpenseBtn) {
      saveExpenseBtn.textContent =
        "Save Expense";
    }

    if (cancelEditBtn) {
      cancelEditBtn.classList.add(
        "hidden"
      );
    }

    if (formCard) {
      formCard.classList.remove(
        "editing-mode"
      );
    }

    clearFormErrors();
  }

  // ==========================================
  // FORM ERRORS
  // ==========================================

  function clearFormErrors() {
    if (titleError) {
      titleError.textContent = "";
    }

    if (amountError) {
      amountError.textContent = "";
    }

    if (categoryError) {
      categoryError.textContent = "";
    }

    if (dateError) {
      dateError.textContent = "";
    }
  }

  // ==========================================
  // RESET FILTERS
  // ==========================================

  function resetFilters() {
    filterState.search = "";
    filterState.category = "ALL";
    filterState.dateFrom = "";
    filterState.dateTo = "";
    filterState.minAmount = "";
    filterState.maxAmount = "";
    filterState.sort = "newest";

    if (searchInput) {
      searchInput.value = "";
    }

    if (filterCategory) {
      filterCategory.value = "ALL";
    }

    if (sortExpensesSelect) {
      sortExpensesSelect.value =
        "newest";
    }

    if (filterDateFrom) {
      filterDateFrom.value = "";
    }

    if (filterDateTo) {
      filterDateTo.value = "";
    }

    if (filterMinAmount) {
      filterMinAmount.value = "";
    }

    if (filterMaxAmount) {
      filterMaxAmount.value = "";
    }

    renderApp();
  }

  // ==========================================
  // CONFIRM MODAL
  // ==========================================

  function openConfirmModal(
    title,
    description,
    onConfirm
  ) {
    if (
      !confirmModal ||
      !modalTitle ||
      !modalDesc
    ) {
      return;
    }

    modalTitle.textContent =
      title;

    modalDesc.textContent =
      description;

    modalConfirmCallback =
      onConfirm;

    confirmModal.classList.remove(
      "hidden"
    );
  }

  function closeConfirmModal() {
    if (confirmModal) {
      confirmModal.classList.add(
        "hidden"
      );
    }

    modalConfirmCallback =
      null;
  }

  // ==========================================
  // START
  // ==========================================

  init();
});