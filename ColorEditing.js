document.addEventListener("DOMContentLoaded", function () {
  const colorInput = document.getElementById("primary-color-input");
  const randomizeButton = document.getElementById("randomize-button");
  const swatchContainer = document.getElementById("swatch-container");
  const calendar = document.querySelector(".calendar_component");

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

  // Create swatches
  // isInitialLoad = true => try to select white/black if it exists
  // isInitialLoad = false => just select the first swatch
  function displaySwatches(primary, isInitialLoad = false) {
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
    if (isInitialLoad) {
      // On page load, try to find white bg & black text
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
  colorInput.addEventListener("input", () => {
    displaySwatches(colorInput.value, false);
  });

  // Handle randomize
  randomizeButton.addEventListener("click", () => {
    const randomColor = tinycolor.random().toHexString();
    colorInput.value = randomColor;
    displaySwatches(randomColor, false);
  });

  // Initial load => default color white (#ffffff) => pick white/black if found
  displaySwatches("#ffffff", true);
});
