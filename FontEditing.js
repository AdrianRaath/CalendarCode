document.addEventListener("DOMContentLoaded", function () {
  //==========================================================
  // SHARED: Google Fonts API
  //==========================================================
  const GOOGLE_FONTS_API_KEY = "AIzaSyBU9KE_ocK-zVqQGuX9Q87Hi61IDyNaunY";
  const GOOGLE_FONTS_API_URL = `https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}&sort=popularity`;

  //==========================================================
  // TITLE FONT FUNCTIONALITY
  //==========================================================
  const titleFontFilters = document.getElementById("title-font-filters");
  const titleFontList = document.getElementById("title-font-list");
  const titleFontOptions = titleFontList.querySelectorAll(".font-option");
  const calendarTitle = document.getElementById("calendar-title");

  // "Back" & "More" controls for Title
  const titleBackEl = document.querySelector('[font-nav="title-back"]');
  const titleMoreEl = document.querySelector('[font-nav="title-more"]');

  // Arrays and state for pagination
  let titleMatchingFonts = []; // all matching fonts for current category
  let titleCurrentPage = 0; // which "page" of 10 are we on?

  // Make sure each .font-option has a .font-preview
  titleFontOptions.forEach((opt) => {
    if (!opt.querySelector(".font-preview")) {
      const previewDiv = document.createElement("div");
      previewDiv.classList.add("font-preview");
      opt.appendChild(previewDiv);
    }
  });

  // 1) Filter clicks => reset page=0, load fonts
  titleFontFilters.addEventListener("click", function (e) {
    const filterEl = e.target.closest("[font-category]");
    if (!filterEl) return;

    // Deactivate other filters
    titleFontFilters
      .querySelectorAll(".active")
      .forEach((el) => el.classList.remove("active"));
    filterEl.classList.add("active");

    // Fade out existing previews
    titleFontOptions.forEach((opt) => {
      const preview = opt.querySelector(".font-preview");
      if (preview) preview.style.opacity = 0;
    });

    // Reset page
    titleCurrentPage = 0;

    // Load fonts for chosen category
    const category = filterEl.getAttribute("font-category");
    loadTitleFontsForCategory(category);
  });

  // 2) Load entire set of matching fonts for the chosen category
  async function loadTitleFontsForCategory(category) {
    try {
      const response = await fetch(GOOGLE_FONTS_API_URL);
      const data = await response.json();

      // Filter by category => store them all
      titleMatchingFonts = data.items.filter(
        (font) => font.category === category
      );

      // After fetching, display the correct "page" of 10
      displayTitleFontPage();
    } catch (err) {
      console.error("Error loading title fonts:", err);
    }
  }

  // 3) Display the current "page" of 10 fonts from titleMatchingFonts
  function displayTitleFontPage() {
    // Slice out the chunk of 10 we want
    const startIndex = titleCurrentPage * 10;
    const endIndex = startIndex + 10;
    const currentSlice = titleMatchingFonts.slice(startIndex, endIndex);

    // Build the link for these 10 families
    const familiesToLoad = currentSlice
      .map((f) => f.family.replace(/\s+/g, "+"))
      .join("&family=");

    // Remove old link
    const oldLink = document.getElementById("title-fonts-link");
    if (oldLink) oldLink.remove();

    // If we have no fonts at all, just clear the UI
    if (!currentSlice.length) {
      titleFontOptions.forEach((opt) => {
        opt.setAttribute("font", "");
        opt.setAttribute("font-cat", "");
        const preview = opt.querySelector(".font-preview");
        if (preview) {
          preview.textContent = "";
          preview.style.fontFamily = "";
          preview.style.opacity = 1;
        }
      });
      return;
    }

    // Create the new link to load
    const newLink = document.createElement("link");
    newLink.id = "title-fonts-link";
    newLink.rel = "stylesheet";
    newLink.href = `https://fonts.googleapis.com/css2?family=${familiesToLoad}&display=swap`;
    document.head.appendChild(newLink);

    // Once loaded, populate .font-option
    newLink.onload = () => {
      titleFontOptions.forEach((optionEl, idx) => {
        const preview = optionEl.querySelector(".font-preview");
        const fontObj = currentSlice[idx]; // might be undefined if < 10 remain

        if (fontObj) {
          const fontName = fontObj.family;
          const fontCat = fontObj.category;

          optionEl.setAttribute("font", fontName);
          optionEl.setAttribute("font-cat", fontCat);

          preview.textContent = fontName;
          preview.style.fontFamily = `"${fontName}", ${fontCat}`;
        } else {
          // Clear out if no font
          optionEl.setAttribute("font", "");
          optionEl.setAttribute("font-cat", "");
          preview.textContent = "";
          preview.style.fontFamily = "";
        }
        // Fade in
        preview.style.opacity = 1;
      });

      // After populating, re-apply any .font-option.active if it has a valid font
      const activeOption = titleFontList.querySelector(".font-option.active");
      if (activeOption) {
        const chosenFont = activeOption.getAttribute("font");
        const chosenCat = activeOption.getAttribute("font-cat");
        if (chosenFont) {
          calendarTitle.style.fontFamily = `"${chosenFont}", ${
            chosenCat || "sans-serif"
          }`;
          console.log(`Selected title font: ${chosenFont} (${chosenCat})`);
        }
      }
    };
  }

  // 4) .font-option click => set active, apply font
  titleFontOptions.forEach((optionEl) => {
    optionEl.addEventListener("click", () => {
      // Deactivate others
      titleFontOptions.forEach((opt) => opt.classList.remove("active"));
      optionEl.classList.add("active");

      // Apply chosen font to #calendar-title
      const chosenFont = optionEl.getAttribute("font");
      const chosenCat = optionEl.getAttribute("font-cat");
      if (chosenFont) {
        calendarTitle.style.fontFamily = `"${chosenFont}", ${
          chosenCat || "sans-serif"
        }`;
        console.log(`Selected title font: ${chosenFont} (${chosenCat})`);
      }
    });
  });

  // 5) "Back" and "More" for Title
  if (titleBackEl) {
    titleBackEl.addEventListener("click", () => {
      if (titleCurrentPage > 0) {
        titleCurrentPage -= 1;
        displayTitleFontPage();
      }
    });
  }
  if (titleMoreEl) {
    titleMoreEl.addEventListener("click", () => {
      // e.g. if we have 50 fonts total, max page index is floor( (50-1)/10 ) = 4
      const maxPage = Math.floor((titleMatchingFonts.length - 1) / 10);
      if (titleCurrentPage < maxPage) {
        titleCurrentPage += 1;
        displayTitleFontPage();
      }
    });
  }

  // On page load, whichever filter is .active => load that category
  const initiallyActiveTitleFilter = titleFontFilters.querySelector(".active");
  if (initiallyActiveTitleFilter) {
    loadTitleFontsForCategory(
      initiallyActiveTitleFilter.getAttribute("font-category")
    );
  }

  //==========================================================
  // MAIN FONT FUNCTIONALITY (identical logic, different IDs)
  //==========================================================
  const mainFontFilters = document.getElementById("main-font-filters");
  const mainFontList = document.getElementById("main-font-list");
  const mainFontOptions = mainFontList.querySelectorAll(".font-option");

  const calendarMain = document.getElementById("calendar-main");
  const calendarDays = document.getElementById("calendar-days");

  // "Back" & "More" controls for Main
  const mainBackEl = document.querySelector('[font-nav="main-back"]');
  const mainMoreEl = document.querySelector('[font-nav="main-more"]');

  // Arrays and state for pagination (main)
  let mainMatchingFonts = [];
  let mainCurrentPage = 0;

  // Ensure each main .font-option has .font-preview
  mainFontOptions.forEach((opt) => {
    if (!opt.querySelector(".font-preview")) {
      const previewDiv = document.createElement("div");
      previewDiv.classList.add("font-preview");
      opt.appendChild(previewDiv);
    }
  });

  // Main: filter clicks => reset page=0, load
  mainFontFilters.addEventListener("click", function (e) {
    const filterEl = e.target.closest("[font-category]");
    if (!filterEl) return;

    // Deactivate other filters
    mainFontFilters
      .querySelectorAll(".active")
      .forEach((el) => el.classList.remove("active"));
    filterEl.classList.add("active");

    // Fade out previews
    mainFontOptions.forEach((opt) => {
      const preview = opt.querySelector(".font-preview");
      if (preview) preview.style.opacity = 0;
    });

    mainCurrentPage = 0;
    const category = filterEl.getAttribute("font-category");
    loadMainFontsForCategory(category);
  });

  // Main: load entire set for category
  async function loadMainFontsForCategory(category) {
    try {
      const response = await fetch(GOOGLE_FONTS_API_URL);
      const data = await response.json();

      mainMatchingFonts = data.items.filter(
        (font) => font.category === category
      );
      displayMainFontPage();
    } catch (err) {
      console.error("Error loading main fonts:", err);
    }
  }

  // Main: display current page of fonts
  function displayMainFontPage() {
    const startIndex = mainCurrentPage * 10;
    const endIndex = startIndex + 10;
    const currentSlice = mainMatchingFonts.slice(startIndex, endIndex);

    // Remove old link
    const oldLink = document.getElementById("main-fonts-link");
    if (oldLink) oldLink.remove();

    if (!currentSlice.length) {
      // No fonts => clear
      mainFontOptions.forEach((opt) => {
        opt.setAttribute("font", "");
        opt.setAttribute("font-cat", "");
        const preview = opt.querySelector(".font-preview");
        if (preview) {
          preview.textContent = "";
          preview.style.fontFamily = "";
          preview.style.opacity = 1;
        }
      });
      return;
    }

    // Build link
    const familiesToLoad = currentSlice
      .map((f) => f.family.replace(/\s+/g, "+"))
      .join("&family=");

    const newLink = document.createElement("link");
    newLink.id = "main-fonts-link";
    newLink.rel = "stylesheet";
    newLink.href = `https://fonts.googleapis.com/css2?family=${familiesToLoad}&display=swap`;
    document.head.appendChild(newLink);

    newLink.onload = () => {
      mainFontOptions.forEach((optionEl, idx) => {
        const preview = optionEl.querySelector(".font-preview");
        const fontObj = currentSlice[idx];

        if (fontObj) {
          const fontName = fontObj.family;
          const fontCat = fontObj.category;

          optionEl.setAttribute("font", fontName);
          optionEl.setAttribute("font-cat", fontCat);

          preview.textContent = fontName;
          preview.style.fontFamily = `"${fontName}", ${fontCat}`;
        } else {
          // Clear
          optionEl.setAttribute("font", "");
          optionEl.setAttribute("font-cat", "");
          preview.textContent = "";
          preview.style.fontFamily = "";
        }
        preview.style.opacity = 1;
      });

      // Re-apply .font-option.active if it has a valid font
      const activeOption = mainFontList.querySelector(".font-option.active");
      if (activeOption) {
        const chosenFont = activeOption.getAttribute("font");
        const chosenCat = activeOption.getAttribute("font-cat");
        if (chosenFont) {
          calendarMain.style.fontFamily = `"${chosenFont}", ${
            chosenCat || "sans-serif"
          }`;
          calendarDays.style.fontFamily = `"${chosenFont}", ${
            chosenCat || "sans-serif"
          }`;
          console.log(`Selected main font: ${chosenFont} (${chosenCat})`);
        }
      }
    };
  }

  // Main: .font-option click => set active, apply
  mainFontOptions.forEach((optionEl) => {
    optionEl.addEventListener("click", () => {
      // Deactivate others
      mainFontOptions.forEach((opt) => opt.classList.remove("active"));
      optionEl.classList.add("active");

      const chosenFont = optionEl.getAttribute("font");
      const chosenCat = optionEl.getAttribute("font-cat");
      if (chosenFont) {
        calendarMain.style.fontFamily = `"${chosenFont}", ${
          chosenCat || "sans-serif"
        }`;
        calendarDays.style.fontFamily = `"${chosenFont}", ${
          chosenCat || "sans-serif"
        }`;
        console.log(`Selected main font: ${chosenFont} (${chosenCat})`);
      }
    });
  });

  // Main: "Back" & "More"
  if (mainBackEl) {
    mainBackEl.addEventListener("click", () => {
      if (mainCurrentPage > 0) {
        mainCurrentPage -= 1;
        displayMainFontPage();
      }
    });
  }
  if (mainMoreEl) {
    mainMoreEl.addEventListener("click", () => {
      const maxPage = Math.floor((mainMatchingFonts.length - 1) / 10);
      if (mainCurrentPage < maxPage) {
        mainCurrentPage += 1;
        displayMainFontPage();
      }
    });
  }

  // On page load, load the initial .active filter for main
  const initiallyActiveMainFilter = mainFontFilters.querySelector(".active");
  if (initiallyActiveMainFilter) {
    loadMainFontsForCategory(
      initiallyActiveMainFilter.getAttribute("font-category")
    );
  }
});
