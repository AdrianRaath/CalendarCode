document.addEventListener("DOMContentLoaded", function () {
  const colorInput = document.getElementById("primary-color-input");
  const randomizeButton = document.getElementById("randomize-button");
  const swatchContainer = document.getElementById("swatch-container");
  const calendar = document.querySelector(".calendar_component");

  if (!swatchContainer || !calendar) return;

  // Remove placeholder swatches on page load
  swatchContainer.innerHTML = "";

  // Generate 8 combos from a primary color
  function generateColorCombos(primary) {
    const combos = [];
    for (let i = 1; i <= 8; i++) {
      const factor = i * 5;
      const bgColor =
        i % 2 === 0
          ? tinycolor(primary).lighten(factor).toHexString()
          : tinycolor(primary).darken(factor).toHexString();
      const textColor = tinycolor
        .mostReadable(bgColor, ["#000", "#fff"])
        .toHexString();
      combos.push({ bg: bgColor, text: textColor });
    }
    return combos;
  }

  /**
   * Create swatches
   * @param {string} primary - base color
   * @param {boolean} isInitialLoad
   * @param {Object|null} preferredCombo - { bg, text } to prefer as active if it exists
   */
  function displaySwatches(
    primary,
    isInitialLoad = false,
    preferredCombo = null
  ) {
    // Clear out any old swatches
    swatchContainer.innerHTML = "";

    // Generate combos
    const combos = generateColorCombos(primary);
    const swatchEls = [];

    // Create each swatch
    combos.forEach((combo) => {
      const swatch = document.createElement("div");
      swatch.classList.add("color-swatch");
      swatch.style.backgroundColor = combo.bg;
      swatch.style.color = combo.text;
      swatch.textContent = "Aa";

      // On click => highlight & apply
      swatch.addEventListener("click", () => {
        setActiveSwatch(swatch, combo);
      });

      swatchContainer.appendChild(swatch);
      swatchEls.push({ element: swatch, combo });
    });

    // Decide which swatch to select by default
    let defaultIndex = 0;

    // 1) If a preferred combo (saved colors) is provided, try to match it
    if (preferredCombo && preferredCombo.bg && preferredCombo.text) {
      const prefBg = tinycolor(preferredCombo.bg).toHexString();
      const prefText = tinycolor(preferredCombo.text).toHexString();
      const matchIndex = swatchEls.findIndex(
        (s) =>
          tinycolor(s.combo.bg).toHexString() === prefBg &&
          tinycolor(s.combo.text).toHexString() === prefText
      );
      if (matchIndex !== -1) {
        defaultIndex = matchIndex;
      } else if (isInitialLoad) {
        // fallback to white/black logic if we didn't find a match
        defaultIndex = swatchEls.findIndex(
          (s) =>
            s.combo.bg.toLowerCase() === "#ffffff" &&
            s.combo.text.toLowerCase() === "#000000"
        );
        if (defaultIndex === -1) defaultIndex = 0;
      }
    }
    // 2) No preferred combo: keep your original initial-load behavior
    else if (isInitialLoad) {
      defaultIndex = swatchEls.findIndex(
        (s) =>
          s.combo.bg.toLowerCase() === "#ffffff" &&
          s.combo.text.toLowerCase() === "#000000"
      );
      if (defaultIndex === -1) {
        defaultIndex = 0; // fallback if white/black not found
      }
    }

    // Select that swatch
    setActiveSwatch(
      swatchEls[defaultIndex].element,
      swatchEls[defaultIndex].combo
    );
  }

  // Highlight a swatch & apply style to calendar
  function setActiveSwatch(swatchEl, combo) {
    // Remove .active from any currently active swatches
    document
      .querySelectorAll(".color-swatch.active")
      .forEach((activeEl) => activeEl.classList.remove("active"));

    // Mark this swatch as active
    swatchEl.classList.add("active");

    // Apply to calendar
    calendar.style.backgroundColor = combo.bg;
    calendar.style.color = combo.text;
  }

  // Handle color input changes
  if (colorInput) {
    colorInput.addEventListener("input", () => {
      displaySwatches(colorInput.value, false);
    });
  }

  // Handle randomize
  if (randomizeButton) {
    randomizeButton.addEventListener("click", () => {
      const randomColor = tinycolor.random().toHexString();
      if (colorInput) {
        colorInput.value = randomColor;
      }
      displaySwatches(randomColor, false);
    });
  }

  // Initial load => default color white (#ffffff) => pick white/black if found
  displaySwatches("#ffffff", true);

  // -------------------------------------------------
  // Expose a helper for SavedCalendarLoader
  // -------------------------------------------------
  window.syncColorModalWithSaved = function (savedColors) {
    if (!savedColors || !savedColors.bg) return;

    const preferredCombo = {
      bg: savedColors.bg,
      // If text not provided, pick readable one just so we have a pair
      text:
        savedColors.text ||
        tinycolor.mostReadable(savedColors.bg, ["#000", "#fff"]).toHexString(),
    };

    // Update the base color input so future randomizations feel consistent
    if (colorInput) {
      colorInput.value = savedColors.bg;
    }

    // Rebuild swatches from the saved base and try to select the exact combo
    displaySwatches(savedColors.bg, false, preferredCombo);
  };
});
