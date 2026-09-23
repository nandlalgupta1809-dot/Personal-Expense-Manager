
/*
 * TARGET 25 — ANALYTICS & STATISTICAL EXPENSE ANALYSIS
 * Reuses existing localStorage data source, enforces authentication protection,
 * isolated component rendering, and safe Chart.js instantiation.
 */

document.addEventListener("DOMContentLoaded", () => {
  const EXPENSES_STORAGE_KEY = "expense_calculator_expenses_v2";

  let currentUser = null;
  let allExpenses = [];
  let selectedMonthKey = getCurrentMonthKey();
  let isAllTimeView = false;

  let categoryChartInstance = null;
  let trendChartInstance = null;

  // DOM Elements - Period Navigation
  const prevMonthBtn = document.getElementById("analytics-prev-month-btn");
  const nextMonthBtn = document.getElementById("analytics-next-month-btn");
  const toggleAllBtn = document.getElementById("analytics-toggle-all-btn");
  const monthLabel = document.getElementById("analytics-month-label");
  const allTimeBadge = document.getElementById("analytics-all-time-badge");

  // DOM Elements - Summary Cards
  const totalExpensesEl = document.getElementById("analytics-total-expenses");
  const countEl = document.getElementById("analytics-transaction-count");
  const avgExpenseEl = document.getElementById("analytics-average-expense");
  const highestExpenseEl = document.getElementById("analytics-highest-expense");
  const highestSubtextEl = document.getElementById("analytics-highest-subtext");

  // DOM Elements - Detailed Stats
  const statTotalSpending = document.getElementById("stat-total-spending");
  const statAvgExpense = document.getElementById("stat-avg-expense");
  const statMedianExpense = document.getElementById("stat-median-expense");
  const statHighestExpense = document.getElementById("stat-highest-expense");
  const statLowestExpense = document.getElementById("stat-lowest-expense");
  const statCount = document.getElementById("stat-count");
  const statTopCategory = document.getElementById("stat-top-category");
  const statCategoriesUsed = document.getElementById("stat-categories-used");
  const statPeakDay = document.getElementById("stat-peak-day");
  const statDailyAvg = document.getElementById("stat-daily-avg");

  // DOM Elements - Category Table
  const categoryTbody = document.getElementById("category-summary-tbody");
  const categoryTableEmpty = document.getElementById("category-table-empty");

  function init() {
    currentUser = getCurrentUserSession();
    if (!currentUser) {
      window.location.href = "index.html";
      return;
    }

    loadExpenses();
    setupEventListeners();
    renderAnalytics();
  }

  function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function getPreviousMonthKey(monthKey) {
    if (!monthKey || !monthKey.includes("-")) return getCurrentMonthKey();
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function loadExpenses() {
    try {
      const stored = localStorage.getItem(EXPENSES_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      allExpenses = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      allExpenses = [];
    }
  }

  function getUserExpenses() {
    if (!currentUser || !currentUser.id) return [];
    return allExpenses.filter((e) => e.userId === currentUser.id || !e.userId);
  }

  function getFilteredExpenses() {
    const userExpenses = getUserExpenses();
    if (isAllTimeView) return [...userExpenses];
    return userExpenses.filter((e) => e.date && e.date.startsWith(selectedMonthKey));
  }

  function formatCurrency(amount) {
    const num = Number(amount);
    const safeNum = isNaN(num) || !isFinite(num) ? 0 : num;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safeNum);
  }

  function formatMonthLabel(monthKey) {
    if (!monthKey || !monthKey.includes("-")) return "All Time";
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function setupEventListeners() {
    if (prevMonthBtn) {
      prevMonthBtn.addEventListener("click", () => {
        isAllTimeView = false;
        selectedMonthKey = getPreviousMonthKey(selectedMonthKey);
        renderAnalytics();
      });
    }

    if (nextMonthBtn) {
      nextMonthBtn.addEventListener("click", () => {
        isAllTimeView = false;
        const [y, m] = selectedMonthKey.split("-").map(Number);
        const d = new Date(y, m, 1);
        selectedMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        renderAnalytics();
      });
    }

    if (toggleAllBtn) {
      toggleAllBtn.addEventListener("click", () => {
        isAllTimeView = !isAllTimeView;
        renderAnalytics();
      });
    }
  }

  function renderAnalytics() {
    updatePeriodHeader();
    const expenses = getFilteredExpenses();

    renderSummaryCards(expenses);
    renderCategorySection(expenses);
    renderTrendSection(expenses);
    renderDetailedStatistics(expenses);
  }

  function updatePeriodHeader() {
    if (monthLabel) monthLabel.textContent = isAllTimeView ? "All Time Analysis" : formatMonthLabel(selectedMonthKey);
    if (allTimeBadge) {
      if (isAllTimeView) allTimeBadge.classList.remove("hidden");
      else allTimeBadge.classList.add("hidden");
    }
    if (toggleAllBtn) toggleAllBtn.textContent = isAllTimeView ? "Show Monthly View" : "Show All Time";
  }

  // Pure Calculation Helper Functions
  function calculateTotalExpenses(expenses) {
    return expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }

  function calculateAverageExpense(expenses) {
    if (expenses.length === 0) return 0;
    return calculateTotalExpenses(expenses) / expenses.length;
  }

  function calculateHighestExpense(expenses) {
    if (expenses.length === 0) return null;
    return expenses.reduce((max, item) => (Number(item.amount) > Number(max.amount) ? item : max), expenses[0]);
  }

  function calculateLowestExpense(expenses) {
    if (expenses.length === 0) return null;
    return expenses.reduce((min, item) => (Number(item.amount) < Number(min.amount) ? item : min), expenses[0]);
  }

  function calculateMedianExpense(expenses) {
    if (expenses.length === 0) return 0;
    const sorted = [...expenses].map((e) => Number(e.amount)).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function calculateCategoryTotals(expenses) {
    const totals = {};
    expenses.forEach((e) => {
      const cat = e.category || "Uncategorized";
      totals[cat] = (totals[cat] || 0) + (Number(e.amount) || 0);
    });
    return totals;
  }

  function calculateDailyTotals(expenses) {
    const dailyMap = {};
    expenses.forEach((e) => {
      if (e.date) {
        dailyMap[e.date] = (dailyMap[e.date] || 0) + (Number(e.amount) || 0);
      }
    });
    return dailyMap;
  }

  function calculateMostExpensiveCategory(expenses) {
    const catTotals = calculateCategoryTotals(expenses);
    let topCat = "None";
    let maxVal = 0;
    Object.keys(catTotals).forEach((cat) => {
      if (catTotals[cat] > maxVal) {
        maxVal = catTotals[cat];
        topCat = cat;
      }
    });
    return { category: topCat, amount: maxVal };
  }

  // 1. Summary Cards Component
  function renderSummaryCards(expenses) {
    const total = calculateTotalExpenses(expenses);
    const count = expenses.length;
    const avg = calculateAverageExpense(expenses);
    const highest = calculateHighestExpense(expenses);

    if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(total);
    if (countEl) countEl.textContent = count;
    if (avgExpenseEl) avgExpenseEl.textContent = formatCurrency(avg);

    if (highestExpenseEl) {
      if (highest) {
        highestExpenseEl.textContent = formatCurrency(highest.amount);
        if (highestSubtextEl) highestSubtextEl.textContent = highest.title || "Highest single entry";
      } else {
        highestExpenseEl.textContent = formatCurrency(0);
        if (highestSubtextEl) highestSubtextEl.textContent = "None recorded";
      }
    }
  }

  // 2. Category Section Component (Independent Validation)
  function renderCategorySection(expenses) {
    const canvas = document.getElementById("category-chart-canvas");
    const container = document.getElementById("category-chart-container");
    const emptyState = document.getElementById("category-empty-state");

    const catTotals = calculateCategoryTotals(expenses);
    const categories = Object.keys(catTotals);
    const totalSpent = calculateTotalExpenses(expenses);

    // Render Category Table Summary
    if (categoryTbody) {
      categoryTbody.innerHTML = "";
      if (categories.length === 0) {
        if (categoryTableEmpty) categoryTableEmpty.classList.remove("hidden");
      } else {
        if (categoryTableEmpty) categoryTableEmpty.classList.add("hidden");
        categories.forEach((cat) => {
          const amt = catTotals[cat];
          const pct = totalSpent > 0 ? ((amt / totalSpent) * 100).toFixed(1) : "0.0";
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><span class="category-badge">${cat}</span></td>
            <td style="font-weight: 600;">${formatCurrency(amt)}</td>
            <td>${pct}%</td>
          `;
          categoryTbody.appendChild(tr);
        });
      }
    }

    // Canvas & Chart Handling
    if (!canvas || !container) return;

    if (categories.length === 0) {
      container.classList.add("hidden");
      if (emptyState) emptyState.classList.remove("hidden");
      if (categoryChartInstance) {
        categoryChartInstance.destroy();
        categoryChartInstance = null;
      }
      return;
    }

    container.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");

    if (categoryChartInstance) {
      categoryChartInstance.destroy();
      categoryChartInstance = null;
    }

    if (typeof Chart !== "undefined") {
      const ctx = canvas.getContext("2d");
      const dataValues = categories.map((cat) => catTotals[cat]);

      categoryChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: categories,
          datasets: [
            {
              data: dataValues,
              backgroundColor: [
                "#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"
              ],
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" },
            tooltip: {
              callbacks: {
                label: (context) => ` ${context.label}: ${formatCurrency(context.raw)}`
              }
            }
          }
        }
      });
    }
  }

  // 3. Daily Expense Trend Component (Independent Validation)
  function renderTrendSection(expenses) {
    const canvas = document.getElementById("trend-chart-canvas");
    const container = document.getElementById("trend-chart-container");
    const emptyState = document.getElementById("trend-empty-state");

    const dailyMap = calculateDailyTotals(expenses);
    const sortedDates = Object.keys(dailyMap).sort((a, b) => new Date(a) - new Date(b));

    if (!canvas || !container) return;

    if (sortedDates.length === 0) {
      container.classList.add("hidden");
      if (emptyState) emptyState.classList.remove("hidden");
      if (trendChartInstance) {
        trendChartInstance.destroy();
        trendChartInstance = null;
      }
      return;
    }

    container.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");

    if (trendChartInstance) {
      trendChartInstance.destroy();
      trendChartInstance = null;
    }

    if (typeof Chart !== "undefined") {
      const ctx = canvas.getContext("2d");
      const labels = sortedDates.map((d) => formatShortDate(d));
      const dataValues = sortedDates.map((d) => dailyMap[d]);

      trendChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Daily Total",
              data: dataValues,
              backgroundColor: "#2563eb",
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (val) => formatCurrency(val)
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => ` Total: ${formatCurrency(context.raw)}`
              }
            }
          }
        }
      });
    }
  }

  // 4. Statistical Information Component
  function renderDetailedStatistics(expenses) {
    const total = calculateTotalExpenses(expenses);
    const count = expenses.length;
    const avg = calculateAverageExpense(expenses);
    const median = calculateMedianExpense(expenses);
    const highest = calculateHighestExpense(expenses);
    const lowest = calculateLowestExpense(expenses);
    const mostExpCat = calculateMostExpensiveCategory(expenses);
    const catTotals = calculateCategoryTotals(expenses);
    const categoriesUsed = Object.keys(catTotals).length;

    const dailyMap = calculateDailyTotals(expenses);
    let peakDay = "None";
    let peakAmount = 0;
    Object.keys(dailyMap).forEach((day) => {
      if (dailyMap[day] > peakAmount) {
        peakAmount = dailyMap[day];
        peakDay = day;
      }
    });

    const daysCount = isAllTimeView ? (Object.keys(dailyMap).length || 1) : new Date(selectedMonthKey.split("-")[0], selectedMonthKey.split("-")[1], 0).getDate();
    const dailyAvg = total / (daysCount || 1);

    if (statTotalSpending) statTotalSpending.textContent = formatCurrency(total);
    if (statAvgExpense) statAvgExpense.textContent = formatCurrency(avg);
    if (statMedianExpense) statMedianExpense.textContent = formatCurrency(median);
    if (statHighestExpense) statHighestExpense.textContent = highest ? `${formatCurrency(highest.amount)} (${highest.title})` : formatCurrency(0);
    if (statLowestExpense) statLowestExpense.textContent = lowest ? `${formatCurrency(lowest.amount)} (${lowest.title})` : formatCurrency(0);
    if (statCount) statCount.textContent = count;
    if (statTopCategory) statTopCategory.textContent = mostExpCat.category !== "None" ? `${mostExpCat.category} (${formatCurrency(mostExpCat.amount)})` : "None";
    if (statCategoriesUsed) statCategoriesUsed.textContent = categoriesUsed;
    if (statPeakDay) statPeakDay.textContent = peakDay !== "None" ? `${formatShortDate(peakDay)} (${formatCurrency(peakAmount)})` : "None";
    if (statDailyAvg) statDailyAvg.textContent = formatCurrency(dailyAvg);
  }

  init();
});