// Lowkey Mandarin — account, registration and profile
// One page handles sign-in, registration, password reset and profile controls.

import { get, post } from "../core/api.js";
import { loadBoot } from "../core/store.js";
import { navigate } from "../core/router.js";
import { esc, formatDate, toast } from "../core/ui.js";

function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const day = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `lowkey-mandarin-export-${day}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function safeNext(raw) {
  const value = decodeURIComponent(raw || "").replace(/^#/, "");
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

function showError(node, message) {
  if (!node) return;
  node.textContent = message || "";
  node.hidden = !message;
}

function busy(button, state, label) {
  if (!button) return;
  button.disabled = state;
  if (label) button.textContent = label;
}

export default {
  route: "account",
  index: "09",
  name: "Account",
  description: "Sign in, create an account, manage your profile and delete your study data.",
  async render(view, options = {}) {
    const query = options.query || new URLSearchParams();
    const resetToken = query.get("reset") || "";
    const next = safeNext(query.get("next") || "/");

    let boot = await loadBoot(true);
    let site = { emailConfigured: false, contactEmail: "" };
    try {
      site = await get("/api/site");
    } catch (_error) { /* non-fatal */ }

    if (resetToken) {
      renderReset(view, resetToken);
      return;
    }

    if (boot.authenticated) {
      renderProfile(view, boot, next);
    } else {
      renderAuth(view, site, next);
    }
  },
};

// --------------------------------------------------------------------------
// Signed out: sign-in and registration
// --------------------------------------------------------------------------
function renderAuth(view, site, next) {
  view.innerHTML = `
    <section class="page account">
      <header class="page-head">
        <div>
          <span class="eyebrow eyebrow--accent">账户 / ACCOUNT</span>
          <h1 class="page-head__title" style="margin-top:.55rem">Your work,<br><em>kept.</em></h1>
        </div>
        <div class="page-head__aside">
          <p>Browsing is open to everyone. An account keeps your reviews, saved words and discoveries together on this server.</p>
          <span class="mono" style="color:var(--grey)">FREE · NO ADS · NO TRACKING</span>
        </div>
      </header>

      <div class="account__layout">
        <section class="account__panel" aria-labelledby="auth-title">
          <div class="account__tabs" role="tablist" aria-label="Account access">
            <button type="button" class="account__tab is-active" id="tabLogin" role="tab"
              aria-selected="true" aria-controls="loginForm">Sign in</button>
            <button type="button" class="account__tab" id="tabRegister" role="tab"
              aria-selected="false" aria-controls="registerForm">Create account</button>
          </div>

          <form class="account__form" id="loginForm" aria-labelledby="auth-title" novalidate>
            <h2 class="account__heading" id="auth-title">Welcome back.</h2>
            <label class="account__field">
              <span>Email</span>
              <input type="email" name="email" autocomplete="email" required maxlength="254">
            </label>
            <label class="account__field">
              <span>Password</span>
              <input type="password" name="password" autocomplete="current-password" required maxlength="200">
            </label>
            <p class="account__error" id="loginError" role="alert" hidden></p>
            <button class="btn" type="submit" id="loginSubmit">Sign in</button>
            ${site.emailConfigured ? `
              <button class="account__link" type="button" id="forgotOpen">Forgot your password?</button>` : `
              <p class="account__note">Password reset by email is unavailable on this copy. Sign in and change your password from this page.</p>`}
          </form>

          <form class="account__form" id="registerForm" aria-labelledby="register-title" hidden novalidate>
            <h2 class="account__heading" id="register-title">Start an archive.</h2>
            <label class="account__field">
              <span>Display name <em>optional</em></span>
              <input type="text" name="displayName" autocomplete="nickname" maxlength="40">
            </label>
            <label class="account__field">
              <span>Email</span>
              <input type="email" name="email" autocomplete="email" required maxlength="254">
            </label>
            <label class="account__field">
              <span>Password</span>
              <input type="password" name="password" autocomplete="new-password" required minlength="10" maxlength="200">
            </label>
            <p class="account__note">At least 10 characters. No email verification is sent; the address is used to sign in and, where configured, to reset a password.</p>
            <p class="account__error" id="registerError" role="alert" hidden></p>
            <button class="btn" type="submit" id="registerSubmit">Create account</button>
          </form>

          <form class="account__form" id="forgotForm" aria-labelledby="forgot-title" hidden novalidate>
            <h2 class="account__heading" id="forgot-title">Reset by email.</h2>
            <p class="account__note">We will send one link if the address has an account. The link expires in one hour.</p>
            <label class="account__field">
              <span>Email</span>
              <input type="email" name="email" autocomplete="email" required maxlength="254">
            </label>
            <p class="account__error" id="forgotError" role="alert" hidden></p>
            <p class="account__ok" id="forgotOk" role="status" hidden></p>
            <div class="row" style="gap:.5rem;flex-wrap:wrap">
              <button class="btn" type="submit" id="forgotSubmit">Send reset link</button>
              <button class="btn btn--quiet" type="button" id="forgotBack">Back to sign in</button>
            </div>
          </form>
        </section>

        <aside class="account__side">
          <h2>What an account stores</h2>
          <ul>
            <li>Your email address and a one-way password hash.</li>
            <li>Review scheduling, saved words and discoveries.</li>
            <li>Short study-session summaries and challenge scores.</li>
          </ul>
          <p>No analytics, advertising identifiers or cross-site tracking. You can export or delete everything from the profile page.</p>
          <a class="mono" href="#/privacy">Read the privacy policy →</a>
        </aside>
      </div>
    </section>`;

  const tabLogin = view.querySelector("#tabLogin");
  const tabRegister = view.querySelector("#tabRegister");
  const loginForm = view.querySelector("#loginForm");
  const registerForm = view.querySelector("#registerForm");
  const forgotForm = view.querySelector("#forgotForm");

  const selectTab = (which) => {
    const login = which === "login";
    tabLogin.classList.toggle("is-active", login);
    tabRegister.classList.toggle("is-active", !login);
    tabLogin.setAttribute("aria-selected", String(login));
    tabRegister.setAttribute("aria-selected", String(!login));
    loginForm.hidden = !login;
    registerForm.hidden = login;
    forgotForm.hidden = true;
    const target = login ? loginForm : registerForm;
    target.querySelector("input")?.focus();
  };

  tabLogin.addEventListener("click", () => selectTab("login"));
  tabRegister.addEventListener("click", () => selectTab("register"));

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = view.querySelector("#loginError");
    const button = view.querySelector("#loginSubmit");
    showError(error, "");
    busy(button, true, "Signing in…");
    try {
      const form = new FormData(loginForm);
      await post("/api/auth/login", {
        email: form.get("email"),
        password: form.get("password"),
      });
      await loadBoot(true);
      toast("Signed in.");
      navigate(next);
    } catch (exc) {
      showError(error, exc.message);
    } finally {
      busy(button, false, "Sign in");
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = view.querySelector("#registerError");
    const button = view.querySelector("#registerSubmit");
    showError(error, "");
    busy(button, true, "Creating account…");
    try {
      const form = new FormData(registerForm);
      await post("/api/auth/register", {
        displayName: form.get("displayName"),
        email: form.get("email"),
        password: form.get("password"),
      });
      await loadBoot(true);
      toast("Account created. Your archive is ready.");
      navigate(next);
    } catch (exc) {
      showError(error, exc.message);
    } finally {
      busy(button, false, "Create account");
    }
  });

  view.querySelector("#forgotOpen")?.addEventListener("click", () => {
    loginForm.hidden = true;
    registerForm.hidden = true;
    forgotForm.hidden = false;
    forgotForm.querySelector("input")?.focus();
  });

  view.querySelector("#forgotBack")?.addEventListener("click", () => selectTab("login"));

  forgotForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = view.querySelector("#forgotError");
    const ok = view.querySelector("#forgotOk");
    const button = view.querySelector("#forgotSubmit");
    showError(error, "");
    ok.hidden = true;
    busy(button, true, "Sending…");
    try {
      const form = new FormData(forgotForm);
      await post("/api/auth/forgot", { email: form.get("email") });
      ok.textContent = "If that address has an account, a reset link is on its way.";
      ok.hidden = false;
    } catch (exc) {
      showError(error, exc.message);
    } finally {
      busy(button, false, "Send reset link");
    }
  });
}

// --------------------------------------------------------------------------
// Signed in: profile, password, export, deletion
// --------------------------------------------------------------------------
function renderProfile(view, boot, next) {
  const profile = boot.profile || {};
  const stats = boot.stats || {};
  const joined = profile.joined ? formatDate(profile.joined, { year: "numeric" }) : "—";

  view.innerHTML = `
    <section class="page account">
      <header class="page-head">
        <div>
          <span class="eyebrow eyebrow--accent">账户 / PROFILE</span>
          <h1 class="page-head__title" style="margin-top:.55rem">${esc(profile.name || "Your account")}</h1>
        </div>
        <div class="page-head__aside">
          <p>${esc(profile.email)} · joined ${esc(joined)}</p>
          <button class="btn btn--quiet btn--sm" type="button" id="signOut">Sign out</button>
        </div>
      </header>

      <dl class="account__stats">
        <div><dt>Tracked words</dt><dd>${stats.tracked ?? 0}</dd></div>
        <div><dt>Saved words</dt><dd>${stats.saved ?? 0}</dd></div>
        <div><dt>Retained</dt><dd>${stats.retained ?? 0}</dd></div>
        <div><dt>Words due</dt><dd>${boot.metrics?.due ?? 0}</dd></div>
      </dl>

      <div class="account__layout">
        <section class="account__panel" aria-labelledby="profile-title">
          <h2 class="account__heading" id="profile-title">Profile</h2>
          <form class="account__form" id="profileForm" novalidate>
            <label class="account__field">
              <span>Display name</span>
              <input type="text" name="displayName" value="${esc(profile.name || "")}" maxlength="40" autocomplete="nickname">
            </label>
            <label class="account__field">
              <span>Email</span>
              <input type="email" value="${esc(profile.email)}" disabled>
            </label>
            <p class="account__note">Changing your email address is not supported yet. Contact the operator if the address is wrong.</p>
            <p class="account__error" id="profileError" role="alert" hidden></p>
            <button class="btn" type="submit" id="profileSubmit">Save profile</button>
          </form>

          <h2 class="account__heading">Password</h2>
          <form class="account__form" id="passwordForm" novalidate>
            <label class="account__field">
              <span>Current password</span>
              <input type="password" name="currentPassword" autocomplete="current-password" required maxlength="200">
            </label>
            <label class="account__field">
              <span>New password</span>
              <input type="password" name="newPassword" autocomplete="new-password" required minlength="10" maxlength="200">
            </label>
            <p class="account__note">At least 10 characters. Other signed-in devices will be signed out.</p>
            <p class="account__error" id="passwordError" role="alert" hidden></p>
            <button class="btn" type="submit" id="passwordSubmit">Change password</button>
          </form>
        </section>

        <aside class="account__side">
          <h2>Your data</h2>
          <p>Download a JSON copy of your account and learning data. The file never includes your password or session cookies.</p>
          <button class="btn btn--ghost" type="button" id="exportData">Download JSON</button>

          <h2>Delete account</h2>
          <p>Removes your email, password hash, progress, discoveries, sessions and challenge results. This cannot be undone.</p>
          <details class="account__danger">
            <summary>Delete my account</summary>
            <form class="account__form" id="deleteForm" novalidate>
              <label class="account__field">
                <span>Password</span>
                <input type="password" name="password" autocomplete="current-password" required maxlength="200">
              </label>
              <label class="account__field">
                <span>Type DELETE to confirm</span>
                <input type="text" name="confirm" autocomplete="off" required pattern="DELETE">
              </label>
              <p class="account__error" id="deleteError" role="alert" hidden></p>
              <button class="btn btn--danger" type="submit" id="deleteSubmit">Delete account</button>
            </form>
          </details>

          <p class="account__note">Need a copy first? Download the JSON before deleting.</p>
        </aside>
      </div>
    </section>`;

  view.querySelector("#signOut")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    busy(button, true, "Signing out…");
    try {
      await post("/api/auth/logout");
      await loadBoot(true);
      toast("Signed out.");
      navigate("/");
    } catch (exc) {
      toast(exc.message);
      busy(button, false, "Sign out");
    }
  });

  const profileForm = view.querySelector("#profileForm");
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = view.querySelector("#profileError");
    const button = view.querySelector("#profileSubmit");
    showError(error, "");
    busy(button, true, "Saving…");
    try {
      const form = new FormData(profileForm);
      await post("/api/auth/profile", { displayName: form.get("displayName") });
      await loadBoot(true);
      toast("Profile saved.");
      navigate("/account");
    } catch (exc) {
      showError(error, exc.message);
    } finally {
      busy(button, false, "Save profile");
    }
  });

  const passwordForm = view.querySelector("#passwordForm");
  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = view.querySelector("#passwordError");
    const button = view.querySelector("#passwordSubmit");
    showError(error, "");
    busy(button, true, "Changing…");
    try {
      const form = new FormData(passwordForm);
      await post("/api/auth/password", {
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      });
      passwordForm.reset();
      toast("Password changed.");
    } catch (exc) {
      showError(error, exc.message);
    } finally {
      busy(button, false, "Change password");
    }
  });

  view.querySelector("#exportData")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    busy(button, true, "Preparing…");
    try {
      downloadJson(await get("/api/export"));
      toast("Export downloaded.");
    } catch (exc) {
      toast(exc.message);
    } finally {
      busy(button, false, "Download JSON");
    }
  });

  const deleteForm = view.querySelector("#deleteForm");
  deleteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = view.querySelector("#deleteError");
    const button = view.querySelector("#deleteSubmit");
    showError(error, "");
    busy(button, true, "Deleting…");
    try {
      const form = new FormData(deleteForm);
      await post("/api/account/delete", {
        password: form.get("password"),
        confirm: form.get("confirm"),
      });
      await loadBoot(true);
      toast("Account deleted.");
      navigate("/");
    } catch (exc) {
      showError(error, exc.message);
      busy(button, false, "Delete account");
    }
  });
}

// --------------------------------------------------------------------------
// Password reset link
// --------------------------------------------------------------------------
function renderReset(view, token) {
  view.innerHTML = `
    <section class="page account">
      <header class="page-head">
        <div>
          <span class="eyebrow eyebrow--accent">账户 / RESET</span>
          <h1 class="page-head__title" style="margin-top:.55rem">Choose a new<br><em>password.</em></h1>
        </div>
        <div class="page-head__aside">
          <p>This link works once and expires one hour after it was requested.</p>
          <span class="mono" style="color:var(--grey)">ONE USE ONLY</span>
        </div>
      </header>

      <section class="account__panel account__panel--narrow">
        <form class="account__form" id="resetForm" novalidate>
          <label class="account__field">
            <span>New password</span>
            <input type="password" name="password" autocomplete="new-password" required minlength="10" maxlength="200">
          </label>
          <label class="account__field">
            <span>Repeat new password</span>
            <input type="password" name="repeat" autocomplete="new-password" required minlength="10" maxlength="200">
          </label>
          <p class="account__note">At least 10 characters. All existing sessions will be signed out.</p>
          <p class="account__error" id="resetError" role="alert" hidden></p>
          <button class="btn" type="submit" id="resetSubmit">Set new password</button>
        </form>
      </section>
    </section>`;

  const form = view.querySelector("#resetForm");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = view.querySelector("#resetError");
    const button = view.querySelector("#resetSubmit");
    const data = new FormData(form);
    if (data.get("password") !== data.get("repeat")) {
      showError(error, "The two passwords do not match.");
      return;
    }
    showError(error, "");
    busy(button, true, "Saving…");
    try {
      await post("/api/auth/reset", { token, password: data.get("password") });
      toast("Password changed. Sign in with the new one.");
      navigate("/account");
    } catch (exc) {
      showError(error, exc.message);
      busy(button, false, "Set new password");
    }
  });
}
