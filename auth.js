
/*
 * Authentication & Session Management Module
 * Standardized across index.html, dashboard.html, analytics.html, download.html, and contact.html
 */

const USERS_STORAGE_KEY = "expense_calculator_users_v1";
const CURRENT_USER_SESSION_KEY = "expense_calculator_session_v1";

function getAllUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Failed to save users database:", e);
  }
}

function getCurrentUserSession() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setCurrentUserSession(user) {
  try {
    if (!user) {
      localStorage.removeItem(CURRENT_USER_SESSION_KEY);
    } else {
      const sessionUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        accountType: user.accountType
      };
      localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(sessionUser));
    }
  } catch (e) {
    console.error("Failed to set session:", e);
  }
}

function logoutUser() {
  localStorage.removeItem(CURRENT_USER_SESSION_KEY);
  window.location.href = "index.html";
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `<span>${escapeHtmlText(message)}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 3500);
}

function escapeHtmlText(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function protectAppPage() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const isAuthPage = currentPage === "index.html" || currentPage === "";
  const user = getCurrentUserSession();

  if (!user && !isAuthPage) {
    window.location.href = "index.html";
    return null;
  }

  if (user && isAuthPage) {
    window.location.href = "dashboard.html";
    return user;
  }

  return user;
}

function updateHeaderUserProfile(currentUser) {
  const userNameDisplay = document.getElementById("user-name-display");
  const userEmailDisplay = document.getElementById("user-email-display");
  const userAvatar = document.getElementById("user-avatar");
  const logoutBtn = document.getElementById("logout-btn");

  if (currentUser) {
    if (userNameDisplay) {
      userNameDisplay.textContent = currentUser.firstName
        ? `${currentUser.firstName} ${currentUser.lastName || ""}`.trim()
        : currentUser.username;
    }
    if (userEmailDisplay) {
      userEmailDisplay.textContent = currentUser.email;
    }
    if (userAvatar) {
      const firstInitial = (currentUser.firstName || currentUser.username || "U")[0].toUpperCase();
      userAvatar.textContent = firstInitial;
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logoutUser);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = protectAppPage();
  if (currentUser) {
    updateHeaderUserProfile(currentUser);
  }

  const authForm = document.getElementById("auth-form");
  if (!authForm) return;

  let isSignUpMode = true;

  const authTitle = document.getElementById("auth-title");
  const authSubtitle = document.getElementById("auth-subtitle");
  const signupFields = document.getElementById("signup-fields");
  const confirmPasswordGroup = document.getElementById("confirm-password-group");
  const authSubmitBtn = document.getElementById("auth-submit-btn");
  const toggleAuthModeBtn = document.getElementById("toggle-auth-mode-btn");
  const authToggleText = document.getElementById("auth-toggle-text");
  const authErrorMsg = document.getElementById("auth-error-msg");

  const firstNameInput = document.getElementById("auth-first-name");
  const lastNameInput = document.getElementById("auth-last-name");
  const usernameInput = document.getElementById("auth-username");
  const accountTypeInput = document.getElementById("auth-account-type");
  const emailInput = document.getElementById("auth-email");
  const passwordInput = document.getElementById("auth-password");
  const confirmPasswordInput = document.getElementById("auth-confirm-password");

  function toggleMode() {
    isSignUpMode = !isSignUpMode;
    if (authErrorMsg) authErrorMsg.textContent = "";

    if (isSignUpMode) {
      if (authTitle) authTitle.textContent = "Create Account";
      if (authSubtitle) authSubtitle.textContent = "Sign up to manage your expenses and track monthly budgets.";
      if (signupFields) signupFields.classList.remove("hidden");
      if (confirmPasswordGroup) confirmPasswordGroup.classList.remove("hidden");
      if (authSubmitBtn) authSubmitBtn.textContent = "Create Account";
      if (authToggleText) authToggleText.textContent = "Already have an account?";
      if (toggleAuthModeBtn) toggleAuthModeBtn.textContent = "Log In";
    } else {
      if (authTitle) authTitle.textContent = "Welcome Back";
      if (authSubtitle) authSubtitle.textContent = "Log in with your credentials to access your dashboard.";
      if (signupFields) signupFields.classList.add("hidden");
      if (confirmPasswordGroup) confirmPasswordGroup.classList.add("hidden");
      if (authSubmitBtn) authSubmitBtn.textContent = "Log In";
      if (authToggleText) authToggleText.textContent = "Don't have an account?";
      if (toggleAuthModeBtn) toggleAuthModeBtn.textContent = "Sign Up";
    }
  }

  if (toggleAuthModeBtn) {
    toggleAuthModeBtn.addEventListener("click", toggleMode);
  }

  authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (authErrorMsg) authErrorMsg.textContent = "";

    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!email || !password) {
      if (authErrorMsg) authErrorMsg.textContent = "Please fill in all required fields.";
      return;
    }

    if (!isValidEmail(email)) {
      if (authErrorMsg) authErrorMsg.textContent = "Please enter a valid email address.";
      return;
    }

    const users = getAllUsers();

    if (isSignUpMode) {
      const firstName = firstNameInput ? firstNameInput.value.trim() : "";
      const lastName = lastNameInput ? lastNameInput.value.trim() : "";
      const username = usernameInput ? usernameInput.value.trim() : "";
      const accountType = accountTypeInput ? accountTypeInput.value : "Personal";
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

      if (!firstName || !lastName || !username) {
        if (authErrorMsg) authErrorMsg.textContent = "Please complete all sign-up fields.";
        return;
      }

      if (password !== confirmPassword) {
        if (authErrorMsg) authErrorMsg.textContent = "Passwords do not match.";
        return;
      }

      const existingUser = users.find((u) => u.email === email);
      if (existingUser) {
        if (authErrorMsg) authErrorMsg.textContent = "An account with this email address already exists.";
        return;
      }

      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        firstName,
        lastName,
        username,
        accountType,
        email,
        password,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      saveUsers(users);
      setCurrentUserSession(newUser);
      window.location.href = "dashboard.html";
    } else {
      const targetUser = users.find((u) => u.email === email && u.password === password);
      if (!targetUser) {
        if (authErrorMsg) authErrorMsg.textContent = "Invalid email or password.";
        return;
      }

      setCurrentUserSession(targetUser);
      window.location.href = "dashboard.html";
    }
  });
});