// Main menu under the Bet assist composer. While the question field has focus
// (keyboard open) the menu collapses so the chat gets the room; without focus
// it slides back. Focus moving inside the composer (e.g. to the send button)
// keeps the menu hidden.
window.assistNav = (function () {
  function init(composerEl) {
    const nav = document.getElementById("assist-nav");
    document.getElementById("assist-nav-slot").appendChild(window.bottomNavModule.renderMainNav("assist"));

    const setHidden = (hidden) => {
      nav.classList.toggle("assist-nav--hidden", hidden);
      nav.inert = hidden;
    };

    composerEl.addEventListener("focusin", () => setHidden(true));
    composerEl.addEventListener("focusout", (event) => {
      if (event.relatedTarget && composerEl.contains(event.relatedTarget)) return;
      setHidden(false);
    });
  }

  return { init };
})();
