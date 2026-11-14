/**
 * Floating toggle that keeps the screen awake while cooking.
 * Off on every page load. While on, the lock is re-acquired when the page
 * becomes visible again, since browsers release it whenever the page is hidden.
 * Loaded with `defer`, so the body exists when this runs.
 */
(() => {
  if (!("wakeLock" in navigator)) return;

  const LABEL_OFF = "🔅 Håll skärmen tänd";
  const LABEL_ON = "🔆 Skärmen hålls tänd";

  let wanted = false;
  let wakeLock = null;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn wake-lock-toggle";

  const render = () => {
    const on = wakeLock !== null;
    button.textContent = on ? LABEL_ON : LABEL_OFF;
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
