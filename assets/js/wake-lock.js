/**
 * Floating toggle that keeps the screen awake while cooking.
 * Off on every page load. While on, the lock is re-acquired when the page
 * becomes visible again, since browsers release it whenever the page is hidden.
 * Loaded with `defer`, so the body exists when this runs.
 */
(() => {
  if (!("wakeLock" in navigator)) return;

  const OFF = { icon: "🔅", label: "Håll skärmen tänd" };
  const ON = { icon: "🔆", label: "Skärmen hålls tänd" };

  let wanted = false;
  let wakeLock = null;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn wake-lock-toggle";

  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  // The text label is hidden on narrow screens by CSS; aria-label keeps it accessible.
  const label = document.createElement("span");
  label.className = "wake-lock-toggle-label";
  label.setAttribute("aria-hidden", "true");
  button.append(icon, label);

  const render = () => {
    const on = wakeLock !== null;
    const state = on ? ON : OFF;
    icon.textContent = state.icon;
    label.textContent = state.label;
    button.setAttribute("aria-label", state.label);
    button.title = state.label;
    button.setAttribute("aria-pressed", String(on));
    button.classList.toggle("btn-primary", on);
  };

  const acquire = async () => {
    if (wakeLock !== null || document.visibilityState !== "visible") return;
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
        // Released while visible means the system revoked it (e.g. battery saver).
        if (document.visibilityState === "visible") wanted = false;
        render();
      });
    } catch (err) {
      wanted = false;
      console.log(`Wake lock: ${err.name}, ${err.message}`);
    }
    render();
  };

  const toggle = async () => {
    wanted = wakeLock === null;
    if (wanted) {
      await acquire();
    } else {
      await wakeLock.release();
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (wanted) acquire();
  });

  button.addEventListener("click", toggle);
  render();
  document.body.appendChild(button);
})();
