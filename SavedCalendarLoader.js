document.addEventListener("DOMContentLoaded", function () {
  const calendarMain = document.getElementById("calendar-main");
  if (!calendarMain) {
    // Not on a calendar page – nothing to do
    return;
  }

  // ---------- Helpers ----------

  function getSavedCalendars() {
    const json = localStorage.getItem("quickcalendars_saved");
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("SavedCalendarLoader: Failed to parse saved calendars:", e);
      return [];
    }
  }

  function saveCalendars(list) {
    localStorage.setItem("quickcalendars_saved", JSON.stringify(list));
  }

  function getCalendarIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  function loadGoogleFontsForSaved(fonts) {
    if (!fonts) return;

    const families = [];
    const titleFont = fonts.titleFont;
    const mainFont = fonts.mainFont;

    if (titleFont && titleFont.family) {
      families.push(titleFont.family.replace(/\s+/g, "+"));
    }
    if (
      mainFont &&
      mainFont.family &&
      (!titleFont || mainFont.family !== titleFont.family)
    ) {
      families.push(mainFont.family.replace(/\s+/g, "+"));
    }

    if (!families.length) return;

    // Remove any previous loader link we might have added
    const existing = document.getElementById("saved-calendar-fonts-link");
    if (existing) existing.remove();

    const link = document.createElement("link");
    link.id = "saved-calendar-fonts-link";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=" +
      families.join("&family=") +
      "&display=swap";

    document.head.appendChild(link);
  }

  // ---------- Main load logic ----------

  const calendarId = getCalendarIdFromUrl();
  if (!calendarId) {
    console.warn("SavedCalendarLoader: No ?id= provided in URL.");
    return;
  }

  const savedCalendars = getSavedCalendars();
  const calendarObj = savedCalendars.find((cal) => cal.id === calendarId);

  if (!calendarObj) {
    console.warn(
      "SavedCalendarLoader: No saved calendar found for id:",
      calendarId
    );
    return;
  }

  console.log("SavedCalendarLoader: Loaded saved calendar:", calendarObj);

  const settings = calendarObj.settings || {};
  const notes = calendarObj.notes || {};

  // Save-state metadata for autosave
  const currentCalendarId = calendarObj.id;
  const originalCreatedAt = calendarObj.createdAt || new Date().toISOString();
  const saveStatusEl = document.getElementById("save-status");

  // Core elements
  const calendarComponent = document.querySelector(".calendar_component");
  const toggleStart = document.getElementById("toggle-start");
  const toggleHolidays = document.getElementById("toggle-input");
  const countryInput = document.getElementById("country-input");
  const calendarTitle = document.getElementById("calendar-title");
  const calendarDays = document.getElementById("calendar-days");

  // 1) Apply basic identity: month, year, header pieces

  if (calendarObj.month) {
    calendarMain.setAttribute("month", calendarObj.month);
  }
  if (calendarObj.year) {
    calendarMain.setAttribute("year", calendarObj.year);
  }

  // Header:
  // #calendar-name → saved calendar name
  // #current-month → saved month
  // #current-year → saved year

  const nameEl = document.getElementById("calendar-name");
  if (nameEl) {
    nameEl.textContent =
      calendarObj.name ||
      `${calendarObj.month || ""} ${calendarObj.year || ""}`.trim();
  }

  const currentMonthEl = document.getElementById("current-month");
  if (currentMonthEl) {
    currentMonthEl.textContent = calendarObj.month || "";
  }

  const currentYearEl = document.getElementById("current-year");
  if (currentYearEl) {
    currentYearEl.textContent = calendarObj.year || "";
  }

  // 2) Apply settings: start day, holidays, country

  const startOnMonday = !!settings.startOnMonday;
  const showHolidays = !!settings.showHolidays;
  const country =
    settings.country || (countryInput ? countryInput.value : null);

  if (toggleStart) {
    toggleStart.checked = startOnMonday;
  }

  if (toggleHolidays) {
    toggleHolidays.checked = showHolidays;

    // Fire change so:
    // - holiday-select visibility script runs
    // - holiday script (updateHolidays) re-runs if it listens to this
    const evtHolidayToggle = new Event("change");
    toggleHolidays.dispatchEvent(evtHolidayToggle);
  }

  if (countryInput && country) {
    // Update both property and attribute so MutationObserver + other scripts see it
    countryInput.value = country;
    countryInput.setAttribute("value", country);

    // Sync dropdown UI if helper exists (sets flag + label + may call updateHolidays)
    if (typeof window.syncHolidayDropdownUI === "function") {
      window.syncHolidayDropdownUI();
    }
  }

  // 3) Apply colors

  const colors = settings.colors || {};
  if (calendarComponent) {
    if (colors.bg) {
      calendarComponent.style.backgroundColor = colors.bg;
    }
    if (colors.text) {
      calendarComponent.style.color = colors.text;
    }
  }

  // Let the color modal reflect the saved colors, if the helper exists
  if (typeof window.syncColorModalWithSaved === "function") {
    window.syncColorModalWithSaved(colors);
  }

  // 4) Load and apply fonts

  const fonts = settings.fonts || {};
  loadGoogleFontsForSaved(fonts);

  function applySavedFonts(fontsObj) {
    if (!fontsObj) return;

    const savedTitleFont = fontsObj.titleFont || null;
    const savedMainFont = fontsObj.mainFont || null;

    if (calendarTitle && savedTitleFont && savedTitleFont.family) {
      calendarTitle.style.fontFamily = `"${savedTitleFont.family}", ${
        savedTitleFont.category || "sans-serif"
      }`;

      // Expose to FontEditing.js for syncing the active state in the modal
      calendarTitle.dataset.savedFontFamily = savedTitleFont.family;
      calendarTitle.dataset.savedFontCategory =
        savedTitleFont.category || "sans-serif";
    }

    if (calendarMain && savedMainFont && savedMainFont.family) {
      const mainFamily = `"${savedMainFont.family}", ${
        savedMainFont.category || "sans-serif"
      }`;
      calendarMain.style.fontFamily = mainFamily;
      if (calendarDays) {
        calendarDays.style.fontFamily = mainFamily;
      }

      // Expose to FontEditing.js
      calendarMain.dataset.savedFontFamily = savedMainFont.family;
      calendarMain.dataset.savedFontCategory =
        savedMainFont.category || "sans-serif";
    }
  }

  // Apply saved fonts once immediately
  applySavedFonts(fonts);

  // ---------- Cooperate with FontEditing.js ----------

  // We want saved fonts to "win" on initial load,
  // but once the user manually changes fonts in the modal,
  // we stop overriding them.

  let userChangedFonts = false;
  let isApplyingSavedFonts = false;

  // If the user clicks any font option, that's a manual override
  const fontOptionSelector =
    "#title-font-list .font-option, #main-font-list .font-option";
  const fontOptions = document.querySelectorAll(fontOptionSelector);

  fontOptions.forEach((opt) => {
    opt.addEventListener("click", () => {
      userChangedFonts = true;
      scheduleAutosave(); // also trigger autosave when fonts change
    });
  });

  if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      if (isApplyingSavedFonts || userChangedFonts) return;

      let shouldReapply = false;

      mutations.forEach((m) => {
        if (m.type === "attributes" && m.attributeName === "style") {
          if (
            m.target === calendarMain ||
            m.target === calendarTitle ||
            m.target === calendarDays
          ) {
            shouldReapply = true;
          }
        }
      });

      if (shouldReapply) {
        isApplyingSavedFonts = true;
        applySavedFonts(fonts);
        isApplyingSavedFonts = false;
      }
    });

    if (calendarMain) {
      observer.observe(calendarMain, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }
    if (calendarTitle) {
      observer.observe(calendarTitle, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }
    if (calendarDays) {
      observer.observe(calendarDays, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }
  }

  // 5) Trigger a re-render of the calendar grid
  //    Script 8 is listening for changes on #toggle-start (renderCalendar).
  if (toggleStart) {
    const evt = new Event("change");
    toggleStart.dispatchEvent(evt);
  } else {
    console.warn(
      "SavedCalendarLoader: #toggle-start not found. Calendar may not re-render correctly."
    );
  }

  // After this point, renderCalendar() has run,
  // days are assigned, holidays updated, and editing enabled.

  // 6) Inject saved notes into the correct day blocks
  //    Each day has at most one .editable-text; we stored its HTML string.

  const activeBlocks = calendarMain.querySelectorAll(".calendar_block.active");
  activeBlocks.forEach((block) => {
    const dayEl = block.querySelector(".calendar_block-day");
    if (!dayEl) return;

    const dayStr = dayEl.textContent.trim();
    if (!dayStr) return;

    const noteHtml = notes[dayStr];
    if (!noteHtml) return;

    const noteEl = document.createElement("div");
    noteEl.classList.add("editable-text");

    // Match inline styles from enableBlockEditing() for consistency
    noteEl.style.fontSize = "0.75rem";
    noteEl.style.whiteSpace = "pre-wrap";
    noteEl.style.outline = "none";
    noteEl.style.minHeight = "1.2em";

    // IMPORTANT: use innerHTML to preserve spans/colors/etc.
    noteEl.innerHTML = noteHtml;

    // Do NOT set contenteditable here – your editing script will handle that on click.
    block.appendChild(noteEl);
  });

  console.log("SavedCalendarLoader: Notes injected for days:", notes);

  // ==================================================
  // AUTOSAVE LOGIC (for /display-saved)
  // ==================================================

  let autosaveTimeout = null;

  function setSaveStatusSaving() {
    if (saveStatusEl) {
      saveStatusEl.textContent = "Saving...";
    }
  }

  function setSaveStatusSaved() {
    if (saveStatusEl) {
      saveStatusEl.textContent = "All changes saved";
    }
  }

  function getCurrentColors() {
    if (!calendarComponent) {
      return { bg: null, text: null };
    }

    let bg = calendarComponent.style.backgroundColor;
    let text = calendarComponent.style.color;

    const computed = window.getComputedStyle(calendarComponent);
    if (!bg) bg = computed.backgroundColor;
    if (!text) text = computed.color;

    return { bg, text };
  }

  function getCurrentFonts() {
    let titleFont = null;
    let mainFont = null;

    const titleFontList = document.getElementById("title-font-list");
    const mainFontList = document.getElementById("main-font-list");

    if (titleFontList) {
      const activeTitleOption = titleFontList.querySelector(
        ".font-option.active"
      );
      if (activeTitleOption) {
        titleFont = {
          family: activeTitleOption.getAttribute("font") || null,
          category: activeTitleOption.getAttribute("font-cat") || null,
        };
      }
    }

    if (mainFontList) {
      const activeMainOption = mainFontList.querySelector(
        ".font-option.active"
      );
      if (activeMainOption) {
        mainFont = {
          family: activeMainOption.getAttribute("font") || null,
          category: activeMainOption.getAttribute("font-cat") || null,
        };
      }
    }

    // Fallbacks based on actual applied styles
    if (!titleFont && calendarTitle) {
      const fam = calendarTitle.style.fontFamily || "";
      if (fam) {
        titleFont = { family: fam, category: null };
      }
    }

    if (!mainFont && calendarMain) {
      const fam = calendarMain.style.fontFamily || "";
      if (fam) {
        mainFont = { family: fam, category: null };
      }
    }

    return { titleFont, mainFont };
  }

  function getCurrentNotesHtml() {
    const notesObj = {};
    const blocks = calendarMain.querySelectorAll(".calendar_block.active");

    blocks.forEach((block) => {
      const dayEl = block.querySelector(".calendar_block-day");
      if (!dayEl) return;

      const dayNum = parseInt(dayEl.textContent, 10);
      if (isNaN(dayNum) || dayNum <= 0) return;

      const editable = block.querySelector(".editable-text");
      if (!editable) return;

      const html = editable.innerHTML.trim();
      if (html.length > 0) {
        notesObj[String(dayNum)] = html;
      }
    });

    return notesObj;
  }

  function serializeCurrentCalendar() {
    const month = calendarMain.getAttribute("month");
    const year = calendarMain.getAttribute("year");

    const startOnMondayNow = !!(toggleStart && toggleStart.checked);
    const showHolidaysNow = !!(toggleHolidays && toggleHolidays.checked);
    const countryNow = countryInput ? countryInput.value : null;

    return {
      id: currentCalendarId,
      name: calendarObj.name,
      month,
      year,
      createdAt: originalCreatedAt,
      updatedAt: new Date().toISOString(),
      settings: {
        startOnMonday: startOnMondayNow,
        showHolidays: showHolidaysNow,
        country: countryNow,
        colors: getCurrentColors(),
        fonts: getCurrentFonts(),
      },
      notes: getCurrentNotesHtml(),
    };
  }

  function doAutosave() {
    if (!currentCalendarId) return;

    const updatedObj = serializeCurrentCalendar();
    const list = getSavedCalendars();
    const idx = list.findIndex((c) => c.id === currentCalendarId);

    if (idx !== -1) {
      list[idx] = updatedObj;
    } else {
      // Shouldn't normally happen, but safe fallback
      list.push(updatedObj);
    }

    saveCalendars(list);
    setSaveStatusSaved();
    console.log("SavedCalendarLoader: Autosaved calendar:", updatedObj);
  }

  function scheduleAutosave() {
    if (!currentCalendarId) return;
    setSaveStatusSaving();
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }
    // Debounce: wait 1s after last change
    autosaveTimeout = setTimeout(doAutosave, 1000);
  }

  // --- Wire autosave to interactions ---

  // Toggles & country
  if (toggleStart) {
    toggleStart.addEventListener("change", scheduleAutosave);
  }
  if (toggleHolidays) {
    toggleHolidays.addEventListener("change", scheduleAutosave);
  }
  if (countryInput) {
    countryInput.addEventListener("change", scheduleAutosave);
  }

  // Notes (contenteditable) – input & blur
  calendarMain.addEventListener(
    "input",
    function (e) {
      if (e.target && e.target.classList.contains("editable-text")) {
        scheduleAutosave();
      }
    },
    true
  );

  calendarMain.addEventListener(
    "blur",
    function (e) {
      if (e.target && e.target.classList.contains("editable-text")) {
        scheduleAutosave();
      }
    },
    true
  );

  // Colors – observe style changes on the calendar component
  if (window.MutationObserver && calendarComponent) {
    const colorObserver = new MutationObserver((mutations) => {
      let changed = false;
      mutations.forEach((m) => {
        if (m.type === "attributes" && m.attributeName === "style") {
          changed = true;
        }
      });
      if (changed) {
        scheduleAutosave();
      }
    });

    colorObserver.observe(calendarComponent, {
      attributes: true,
      attributeFilter: ["style"],
    });
  }

  // Initial status
  setSaveStatusSaved();
});
