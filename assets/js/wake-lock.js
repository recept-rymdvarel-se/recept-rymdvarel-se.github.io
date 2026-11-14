/**
 * Keep-screen-awake toggle for the buttons rendered by _includes/nav_footer_custom.html.
 * The theme renders that include twice (sidebar and mobile footer), so every
 * `.wake-lock-toggle` shares one lock and one state. Off on every page load.
 * While on, the lock is re-acquired when the page becomes visible again, since
 * browsers release it whenever the page is hidden.
 * Loaded with `defer`, so the buttons exist when this runs.
 */
(() => {
  const buttons = document.querySelectorAll(".wake-lock-toggle");
  if (!("wakeLock" in navigator) || buttons.length === 0) return;

  const LABEL_OFF = "🔅 Håll skärmen tänd";
  const LABEL_ON = "🔆 Skärmen hålls tänd";

  let wanted = false;
  let wakeLock = null;

  const render = () => {
    const on = wakeLock !== null;
    for (const button of buttons) {
      button.textContent = on ? LABEL_ON : LABEL_OFF;
      button.setAttribute("aria-pressed", String(on));
      button.classList.toggle("btn-primary", on);
    }
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

  for (const button of buttons) {
    button.addEventListener("click", toggle);
    button.closest(".wake-lock-toggle-wrap").hidden = false;
  }
  render();
})();
