window.addEventListener("load", function () {
  //==========================================================
  // SHARED: Google Fonts API
  //==========================================================
  const GOOGLE_FONTS_API_KEY = "AIzaSyBU9KE_ocK-zVqQGuX9Q87Hi61IDyNaunY";
  const GOOGLE_FONTS_API_URL = `https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}&sort=popularity`;

  // Helpers to read initial fonts from data-* (set by SavedCalendarLoader on /display-saved)
  function getInitialTitleFont() {
    const titleEl = document.getElementById("calendar-title");
    if (!titleEl) return null;
    const family = titleEl.dataset.savedFontFamily;
    const category = titleEl.dataset.savedFontCategory;
    if (!family) return null;
    return { family, category: category || "sans-serif" };
  }

  function getInitialMainFont() {
    const mainEl = document.getElementById("calendar-main");
    if (!mainEl) return null;
    const family = mainEl.dataset.savedFontFamily;
    const category = mainEl.dataset.savedFontCategory;
    if (!family) return null;
    return { family, category: category || "sans-serif" };
  }

  // IMPORTANT: now these are evaluated AFTER SavedCalendarLoader has run
  const savedInitialTitleFont = getInitialTitleFont(); // null on normal pages
  const savedInitialMainFont = getInitialMainFont(); // null on normal pages

  //==========================================================
  // TITLE FONT FUNCTIONALITY
  //==========================================================
  const titleFontFilters = document.getElementById("title-font-filters");
  const titleFontList = document.getElementById("title-font-list");
  const titleFontOptions = titleFontList
    ? titleFontList.querySelectorAll(".font-option")
    : [];
  const calendarTitle = document.getElementById("calendar-title");

  const titleBackEl = document.querySelector('[font-nav="title-back"]');
  const titleMoreEl = document.querySelector('[font-nav="title-more"]');

  let titleMatchingFonts = [];
  let titleCurrentPage = 0;
  let titleSavedFontApplied = false; // so we only auto-activate once

  // Ensure .font-preview exists
  titleFontOptions.forEach((opt) => {
    if (!opt.querySelector(".font-preview")) {
      const previewDiv = document.createElement("div");
      previewDiv.classList.add("font-preview");
      opt.appendChild(previewDiv);
    }
  });

  // Filter clicks
  if (titleFontFilters) {
    titleFontFilters.addEventListener("click", function (e) {
      const filterEl = e.target.closest("[font-category]");
      if (!filterEl) return;

      titleFontFilters
        .querySelectorAll(".active")
        .forEach((el) => el.classList.remove("active"));
      filterEl.classList.add("active");

      titleFontOptions.forEach((opt) => {
        const preview = opt.querySelector(".font-preview");
        if (preview) preview.style.opacity = 0;
      });

      titleCurrentPage = 0;
      const category = filterEl.getAttribute("font-category");
      loadTitleFontsForCategory(category);
    });
  }

  async function loadTitleFontsForCategory(category) {
    try {
      const response = await fetch(GOOGLE_FONTS_API_URL);
      const data = await response.json();

      titleMatchingFonts = data.items.filter(
        (font) => font.category === category
      );

      // If we have a saved initial title font AND this category matches it,
      // jump to the page containing that family.
      if (
        savedInitialTitleFont &&
        savedInitialTitleFont.category === category &&
        !titleSavedFontApplied
      ) {
        const idx = titleMatchingFonts.findIndex(
          (f) => f.family === savedInitialTitleFont.family
        );
        if (idx !== -1) {
          titleCurrentPage = Math.floor(idx / 10);
        } else {
          titleCurrentPage = 0;
        }
      } else {
        titleCurrentPage = titleCurrentPage || 0;
      }

      displayTitleFontPage();
    } catch (err) {
      console.error("Error loading title fonts:", err);
    }
  }

  function displayTitleFontPage() {
    const startIndex = titleCurrentPage * 10;
    const endIndex = startIndex + 10;
    const currentSlice = titleMatchingFonts.slice(startIndex, endIndex);

    const oldLink = document.getElementById("title-fonts-link");
    if (oldLink) oldLink.remove();

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

    const familiesToLoad = currentSlice
      .map((f) => f.family.replace(/\s+/g, "+"))
      .join("&family=");

    const newLink = document.createElement("link");
    newLink.id = "title-fonts-link";
    newLink.rel = "stylesheet";
    newLink.href = `https://fonts.googleapis.com/css2?family=${familiesToLoad}&display=swap`;
    document.head.appendChild(newLink);

    newLink.onload = () => {
      titleFontOptions.forEach((optionEl, idx) => {
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
          optionEl.setAttribute("font", "");
          optionEl.setAttribute("font-cat", "");
          preview.textContent = "";
          preview.style.fontFamily = "";
        }
        preview.style.opacity = 1;
      });

      let activeOption = null;

      // FIRST: try to activate the saved font if present on this page
      if (savedInitialTitleFont && !titleSavedFontApplied) {
        const localIdx = currentSlice.findIndex(
          (f) => f.family === savedInitialTitleFont.family
        );
        if (localIdx !== -1 && titleFontOptions[localIdx]) {
          titleFontOptions.forEach((opt) => opt.classList.remove("active"));
          activeOption = titleFontOptions[localIdx];
          activeOption.classList.add("active");
          titleSavedFontApplied = true;
          console.log(
            "FontEditing: Activated saved title font in modal:",
            savedInitialTitleFont.family
          );
        }
      }

      // FALLBACK: if we still don't have an active option, use whatever is marked .active
      if (!activeOption && titleFontList) {
        activeOption = titleFontList.querySelector(".font-option.active");
      }

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

  // Clicks
  titleFontOptions.forEach((optionEl) => {
    optionEl.addEventListener("click", () => {
      titleFontOptions.forEach((opt) => opt.classList.remove("active"));
      optionEl.classList.add("active");

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

  // Back / More
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
      const maxPage = Math.floor((titleMatchingFonts.length - 1) / 10);
      if (titleCurrentPage < maxPage) {
        titleCurrentPage += 1;
        displayTitleFontPage();
      }
    });
  }

  // Initial category selection for Title
  if (titleFontFilters) {
    const initiallyActiveTitleFilter =
      titleFontFilters.querySelector(".active");

    // If we have a saved title font, try to switch to its category filter
    if (savedInitialTitleFont) {
      const filterForSaved = titleFontFilters.querySelector(
        `[font-category="${savedInitialTitleFont.category}"]`
      );
      if (filterForSaved) {
        titleFontFilters
          .querySelectorAll(".active")
          .forEach((el) => el.classList.remove("active"));
        filterForSaved.classList.add("active");
        loadTitleFontsForCategory(savedInitialTitleFont.category);
      } else if (initiallyActiveTitleFilter) {
        loadTitleFontsForCategory(
          initiallyActiveTitleFilter.getAttribute("font-category")
        );
      }
    } else if (initiallyActiveTitleFilter) {
      loadTitleFontsForCategory(
        initiallyActiveTitleFilter.getAttribute("font-category")
      );
    }
  }

  //==========================================================
  // MAIN FONT FUNCTIONALITY
  //==========================================================
  const mainFontFilters = document.getElementById("main-font-filters");
  const mainFontList = document.getElementById("main-font-list");
  const mainFontOptions = mainFontList
    ? mainFontList.querySelectorAll(".font-option")
    : [];

  const calendarMain = document.getElementById("calendar-main");
  const calendarDays = document.getElementById("calendar-days");

  const mainBackEl = document.querySelector('[font-nav="main-back"]');
  const mainMoreEl = document.querySelector('[font-nav="main-more"]');

  let mainMatchingFonts = [];
  let mainCurrentPage = 0;
  let mainSavedFontApplied = false;

  mainFontOptions.forEach((opt) => {
    if (!opt.querySelector(".font-preview")) {
      const previewDiv = document.createElement("div");
      previewDiv.classList.add("font-preview");
      opt.appendChild(previewDiv);
    }
  });

  // Main filter clicks
  if (mainFontFilters) {
    mainFontFilters.addEventListener("click", function (e) {
      const filterEl = e.target.closest("[font-category]");
      if (!filterEl) return;

      mainFontFilters
        .querySelectorAll(".active")
        .forEach((el) => el.classList.remove("active"));
      filterEl.classList.add("active");

      mainFontOptions.forEach((opt) => {
        const preview = opt.querySelector(".font-preview");
        if (preview) preview.style.opacity = 0;
      });

      mainCurrentPage = 0;
      const category = filterEl.getAttribute("font-category");
      loadMainFontsForCategory(category);
    });
  }

  async function loadMainFontsForCategory(category) {
    try {
      const response = await fetch(GOOGLE_FONTS_API_URL);
      const data = await response.json();

      mainMatchingFonts = data.items.filter(
        (font) => font.category === category
      );

      if (
        savedInitialMainFont &&
        savedInitialMainFont.category === category &&
        !mainSavedFontApplied
      ) {
        const idx = mainMatchingFonts.findIndex(
          (f) => f.family === savedInitialMainFont.family
        );
        if (idx !== -1) {
          mainCurrentPage = Math.floor(idx / 10);
        } else {
          mainCurrentPage = 0;
        }
      } else {
        mainCurrentPage = mainCurrentPage || 0;
      }

      displayMainFontPage();
    } catch (err) {
      console.error("Error loading main fonts:", err);
    }
  }

  function displayMainFontPage() {
    const startIndex = mainCurrentPage * 10;
    const endIndex = startIndex + 10;
    const currentSlice = mainMatchingFonts.slice(startIndex, endIndex);

    const oldLink = document.getElementById("main-fonts-link");
    if (oldLink) oldLink.remove();

    if (!currentSlice.length) {
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
          optionEl.setAttribute("font", "");
          optionEl.setAttribute("font-cat", "");
          preview.textContent = "";
          preview.style.fontFamily = "";
        }
        preview.style.opacity = 1;
      });

      let activeOption = null;

      // FIRST: try to activate the saved main font if present on this page
      if (savedInitialMainFont && !mainSavedFontApplied) {
        const localIdx = currentSlice.findIndex(
          (f) => f.family === savedInitialMainFont.family
        );
        if (localIdx !== -1 && mainFontOptions[localIdx]) {
          mainFontOptions.forEach((opt) => opt.classList.remove("active"));
          activeOption = mainFontOptions[localIdx];
          activeOption.classList.add("active");
          mainSavedFontApplied = true;
          console.log(
            "FontEditing: Activated saved main font in modal:",
            savedInitialMainFont.family
          );
        }
      }

      // FALLBACK: if still no active option, use existing .active
      if (!activeOption && mainFontList) {
        activeOption = mainFontList.querySelector(".font-option.active");
      }

      if (activeOption) {
        const chosenFont = activeOption.getAttribute("font");
        const chosenCat = activeOption.getAttribute("font-cat");
        if (chosenFont) {
          const familyStr = `"${chosenFont}", ${chosenCat || "sans-serif"}`;
          if (calendarMain) {
            calendarMain.style.fontFamily = familyStr;
          }
          if (calendarDays) {
            calendarDays.style.fontFamily = familyStr;
          }
          console.log(`Selected main font: ${chosenFont} (${chosenCat})`);
        }
      }
    };
  }

  mainFontOptions.forEach((optionEl) => {
    optionEl.addEventListener("click", () => {
      mainFontOptions.forEach((opt) => opt.classList.remove("active"));
      optionEl.classList.add("active");

      const chosenFont = optionEl.getAttribute("font");
      const chosenCat = optionEl.getAttribute("font-cat");
      if (chosenFont) {
        const familyStr = `"${chosenFont}", ${chosenCat || "sans-serif"}`;
        if (calendarMain) {
          calendarMain.style.fontFamily = familyStr;
        }
        if (calendarDays) {
          calendarDays.style.fontFamily = familyStr;
        }
        console.log(`Selected main font: ${chosenFont} (${chosenCat})`);
      }
    });
  });

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

  if (mainFontFilters) {
    const initiallyActiveMainFilter = mainFontFilters.querySelector(".active");

    if (savedInitialMainFont) {
      const filterForSaved = mainFontFilters.querySelector(
        `[font-category="${savedInitialMainFont.category}"]`
      );
      if (filterForSaved) {
        mainFontFilters
          .querySelectorAll(".active")
          .forEach((el) => el.classList.remove("active"));
        filterForSaved.classList.add("active");
        loadMainFontsForCategory(savedInitialMainFont.category);
      } else if (initiallyActiveMainFilter) {
        loadMainFontsForCategory(
          initiallyActiveMainFilter.getAttribute("font-category")
        );
      }
    } else if (initiallyActiveMainFilter) {
      loadMainFontsForCategory(
        initiallyActiveMainFilter.getAttribute("font-category")
      );
    }
  }
});
