
/*
 * TARGET 26 — DOWNLOAD / EXPORT EXPENSE DETAILS
 * Manages user authentication verification, multi-criteria expense filtering,
 * live tabular preview generation, and safe local UTF-8 CSV downloads.
 */

document.addEventListener("DOMContentLoaded", () => {
  const EXPENSES_STORAGE_KEY = "expense_calculator_expenses_v2";

  let currentUser = null;
  let allExpenses = [];
  let filteredExportExpenses = [];
  let isDownloading = false;

  // DOM Elements
  const periodSelect = document.getElementById("export-period");
  const monthGroup = document.getElementById("group-export-month");
  const monthInput = document.getElementById("export-month");
  const startDateGroup = document.getElementById("group-export-start-date");
  const startDateInput = document.getElementById("export-start-date");
  const endDateGroup = document.getElementById("group-export-end-date");
  const endDateInput = document.getElementById("export-end-date");

  const categorySelect = document.getElementById("export-category");
  const sortSelect = document.getElementById("export-sort");
  const validationErrorEl = document.getElementById("export-validation-error");

  const countDisplayEl = document.getElementById("export-count-display");
  const totalDisplayEl = document.getElementById("export-total-display");

  const previewTbody = document.getElementById("export-preview-tbody");
  const emptyStateEl = document.getElementById("export-empty-state");
  const downloadCsvBtn = document.getElementById("download-csv-btn");

  function init() {
    currentUser = getCurrentUserSession();
    if (!currentUser) {
      window.location.href = "index.html";
      return;
    }

    // Set default month selector value (YYYY-MM)
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (monthInput) {
      monthInput.value = currentMonthKey;
    }

    loadExpenses();
    populateCategories();
    setupEventListeners();
    updateExportDataset();
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

  function getCurrentUserExpenses() {
    if (!currentUser || !currentUser.id) return [];
    return allExpenses.filter((e) => e.userId === currentUser.id || !e.userId);
  }

  function populateCategories() {
    if (!categorySelect) return;
    const userExpenses = getCurrentUserExpenses();
    const categoriesSet = new Set();

    userExpenses.forEach((exp) => {
      if (exp.category) {
        categoriesSet.add(exp.category);
      }
    });

    categorySelect.innerHTML = `<option value="ALL">All Categories</option>`;
    Array.from(categoriesSet).sort().forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
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

  function formatShortDate(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function setupEventListeners() {
    if (periodSelect) {
      periodSelect.addEventListener("change", () => {
        handlePeriodUIChange();
        updateExportDataset();
      });
    }

    if (monthInput) monthInput.addEventListener("change", updateExportDataset);
    if (startDateInput) startDateInput.addEventListener("change", updateExportDataset);
    if (endDateInput) endDateInput.addEventListener("change", updateExportDataset);
    if (categorySelect) categorySelect.addEventListener("change", updateExportDataset);
    if (sortSelect) sortSelect.addEventListener("change", updateExportDataset);

    if (downloadCsvBtn) {
      downloadCsvBtn.addEventListener("click", () => {
        if (!isDownloading && filteredExportExpenses.length > 0) {
          executeDownload();
        }
      });
    }
  }

  function handlePeriodUIChange() {
    const period = periodSelect.value;
    
    // Reset visibility
    if (monthGroup) monthGroup.classList.add("hidden");
    if (startDateGroup) startDateGroup.classList.add("hidden");
    if (endDateGroup) endDateGroup.classList.add("hidden");

    if (period === "selected-month") {
      if (monthGroup) monthGroup.classList.remove("hidden");
    } else if (period === "custom") {
      if (startDateGroup) startDateGroup.classList.remove("hidden");
      if (endDateGroup) endDateGroup.classList.remove("hidden");
    }
  }

  function updateExportDataset() {
    if (validationErrorEl) validationErrorEl.textContent = "";

    const userExpenses = getCurrentUserExpenses();
    const period = periodSelect.value;
    let list = [...userExpenses];

    // Period Filtering
    if (period === "current-month") {
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      list = list.filter((e) => e.date && e.date.startsWith(currentMonthKey));
    } else if (period === "selected-month") {
      const selectedMonth = monthInput.value;
      if (selectedMonth) {
        list = list.filter((e) => e.date && e.date.startsWith(selectedMonth));
      }
    } else if (period === "custom") {
      const start = startDateInput.value;
      const end = endDateInput.value;

      if (start && end && start > end) {
        if (validationErrorEl) {
          validationErrorEl.textContent = "End date must be on or after the start date.";
        }
        renderEmptyPreview();
        return;
      }

      if (start) list = list.filter((e) => e.date >= start);
      if (end) list = list.filter((e) => e.date <= end);
    }

    // Category Filtering
    const selectedCategory = categorySelect.value;
    if (selectedCategory !== "ALL") {
      list = list.filter((e) => e.category === selectedCategory);
    }

    // Sorting Logic
    const sortVal = sortSelect.value;
    list.sort((a, b) => {
      const amtA = Number(a.amount) || 0;
      const amtB = Number(b.amount) || 0;
      if (sortVal === "newest") return new Date(b.date) - new Date(a.date);
      if (sortVal === "oldest") return new Date(a.date) - new Date(b.date);
      if (sortVal === "highest") return amtB - amtA;
      if (sortVal === "lowest") return amtA - amtB;
      return 0;
    });

    filteredExportExpenses = list;
    renderPreview();
  }

  function renderEmptyPreview() {
    filteredExportExpenses = [];
    if (countDisplayEl) countDisplayEl.textContent = "0";
    if (totalDisplayEl) totalDisplayEl.textContent = formatCurrency(0);
    if (previewTbody) previewTbody.innerHTML = "";
    if (emptyStateEl) emptyStateEl.classList.remove("hidden");
    if (downloadCsvBtn) downloadCsvBtn.disabled = true;
  }

  function renderPreview() {
    const count = filteredExportExpenses.length;
    const total = filteredExportExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    if (countDisplayEl) countDisplayEl.textContent = count;
    if (totalDisplayEl) totalDisplayEl.textContent = formatCurrency(total);

    if (count === 0) {
      renderEmptyPreview();
      return;
    }

    if (emptyStateEl) emptyStateEl.classList.add("hidden");
    if (downloadCsvBtn) downloadCsvBtn.disabled = false;

    if (previewTbody) {
      previewTbody.innerHTML = "";
      filteredExportExpenses.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${formatShortDate(item.date)}</td>
          <td style="font-weight: 600;">${escapeHtml(item.title || "")}</td>
          <td><span class="category-badge">${escapeHtml(item.category || "Uncategorized")}</span></td>
          <td style="font-weight: 700;">${formatCurrency(item.amount)}</td>
          <td style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(item.notes || "-")}</td>
        `;
        previewTbody.appendChild(tr);
      });
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

  // Safe CSV Value Escaper (Handles quotes, commas, and line breaks)
  function escapeCsvValue(val) {
    if (val === null || val === undefined) return '""';
    let stringified = String(val);
    // Double-up inner quotation marks
    stringified = stringified.replace(/"/g, '""');
    return `"${stringified}"`;
  }

  function generateCsvContent() {
    const headers = ["Date", "Description", "Category", "Amount", "Notes"];
    const rows = [headers.map(escapeCsvValue).join(",")];

    filteredExportExpenses.forEach((exp) => {
      const row = [
        escapeCsvValue(exp.date || ""),
        escapeCsvValue(exp.title || ""),
        escapeCsvValue(exp.category || ""),
        escapeCsvValue(Number(exp.amount) || 0), // Pure numeric format for spreadsheet tools
        escapeCsvValue(exp.notes || "")
      ];
      rows.push(row.join(","));
    });

    return rows.join("\r\n");
  }

  function generateFilename() {
    const period = periodSelect.value;
    if (period === "current-month") {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      return `expense-report-${monthKey}.csv`;
    } else if (period === "selected-month" && monthInput.value) {
      return `expense-report-${monthInput.value}.csv`;
    } else if (period === "custom" && (startDateInput.value || endDateInput.value)) {
      const start = startDateInput.value || "start";
      const end = endDateInput.value || "end";
      return `expense-report-${start}-to-${end}.csv`;
    }
    return "expense-details-all.csv";
  }

  function executeDownload() {
    if (filteredExportExpenses.length === 0) return;

    isDownloading = true;
    if (downloadCsvBtn) downloadCsvBtn.disabled = true;

    try {
      const csvContent = generateCsvContent();
      // Prepend UTF-8 BOM (\uFEFF) to guarantee Excel/Sheets Unicode support
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.setAttribute("download", generateFilename());
      document.body.appendChild(downloadLink);
      
      downloadLink.click();
      
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      if (typeof showToast === "function") {
        showToast("Expense file downloaded successfully.", "success");
      }
    } catch (err) {
      if (typeof showToast === "function") {
        showToast("Failed to generate expense export file.", "danger");
      }
    } finally {
      setTimeout(() => {
        isDownloading = false;
        if (downloadCsvBtn && filteredExportExpenses.length > 0) {
          downloadCsvBtn.disabled = false;
        }
      }, 500);
    }
  }

  init();
});