document.addEventListener("DOMContentLoaded", function () {
  const saveNameInput = document.getElementById("save-calendar-name");
  const saveButton = document.getElementById("calendar-save");
  const calendarMain = document.getElementById("calendar-main");
  const calendarComponent = document.querySelector(".calendar_component");

  const toggleStart = document.getElementById("toggle-start");
  const toggleHolidays = document.getElementById("toggle-input");
  const countryInput = document.getElementById("country-input");

  // Font pickers (may or may not exist, so we guard)
  const titleFontList = document.getElementById("title-font-list");
  const mainFontList = document.getElementById("main-font-list");
  const calendarTitle = document.getElementById("calendar-title");
  const calendarDays = document.getElementById("calendar-days");

  if (!saveButton || !calendarMain) {
    // Not on a page with saving functionality
    return;
  }

  // ---------- Helpers for localStorage ----------

  function getSavedCalendars() {
    const json = localStorage.getItem("quickcalendars_saved");
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("SaveCalendar: Failed to parse saved calendars:", e);
      return [];
    }
  }

  function saveCalendars(list) {
    localStorage.setItem("quickcalendars_saved", JSON.stringify(list));
  }

  // Ensure unique naming: baseName, baseName (2), baseName (3) ...
  function generateCalendarName(baseName, existingList) {
    let name = baseName;
    let counter = 2;

    while (existingList.some((cal) => cal.name === name)) {
      name = `${baseName} (${counter})`;
      counter++;
    }

    return name;
  }

  // Get current color settings from .calendar_component
  function getCurrentColors() {
    if (!calendarComponent) {
      return { bg: null, text: null };
    }

    // Prefer inline styles if set by your swatch script
    let bg = calendarComponent.style.backgroundColor;
    let text = calendarComponent.style.color;

    // Fallback to computed styles if inline is empty
    const computed = window.getComputedStyle(calendarComponent);
    if (!bg) bg = computed.backgroundColor;
    if (!text) text = computed.color;

    return { bg, text };
  }

  // Get currently selected fonts from the font pickers
  function getCurrentFonts() {
    let titleFont = null;
    let mainFont = null;

    // Title font (from active .font-option in #title-font-list)
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

    // Main font (from active .font-option in #main-font-list)
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

    // Fallbacks using actual DOM styles if we didn't get anything
    if (!titleFont && calendarTitle) {
      titleFont = {
        family: calendarTitle.style.fontFamily || null,
        category: null,
      };
    }

    if (!mainFont && calendarMain) {
      mainFont = {
        family: calendarMain.style.fontFamily || null,
        category: null,
      };
    }

    return { titleFont, mainFont };
  }

  // Collect notes per day from .calendar_block.active
  // Each day has at most one .editable-text; we store its HTML to preserve colors/spans/etc.
  function getCurrentNotes() {
    const notes = {};
    if (!calendarMain) return notes;

    const blocks = calendarMain.querySelectorAll(".calendar_block.active");

    blocks.forEach((block) => {
      const dayEl = block.querySelector(".calendar_block-day");
      if (!dayEl) return;

      const dayNum = parseInt(dayEl.textContent, 10);
      if (isNaN(dayNum) || dayNum <= 0) return;

      const editable = block.querySelector(".editable-text");
      if (!editable) return;

      const html = (editable.innerHTML || "").trim();
      if (html.length > 0) {
        // Store a single HTML string per day
        notes[String(dayNum)] = html;
      }
    });

    return notes;
  }

  // ---------- UI helpers (count + notification) ----------

  function updateSavedCountUI() {
    const countEl = document.getElementById("nav-saved-count");
    if (!countEl) return;

    const savedList = getSavedCalendars();
    countEl.textContent = savedList.length;
  }

  let saveTooltipTimeout = null;

  function showSaveNotification() {
    let tooltip = document.getElementById("save-tooltip");

    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "save-tooltip";

      // Container styles
      tooltip.style.position = "fixed";
      tooltip.style.right = "1.5rem";
      tooltip.style.bottom = "1.5rem";
      tooltip.style.zIndex = "9999";
      tooltip.style.padding = "0.75rem 1rem";
      tooltip.style.borderRadius = "0.75rem";
      tooltip.style.backgroundColor = "#ffffff";
      tooltip.style.boxShadow = "0 10px 30px rgba(15, 23, 42, 0.25)";
      tooltip.style.display = "flex";
      tooltip.style.alignItems = "flex-start";
      tooltip.style.gap = "0.75rem";
      tooltip.style.fontSize = "0.875rem";
      tooltip.style.color = "#111827";
      tooltip.style.opacity = "0";
      tooltip.style.transform = "translateY(10px)";
      tooltip.style.transition = "opacity 0.2s ease, transform 0.2s ease";
      tooltip.style.pointerEvents = "none";

      // Icon
      const icon = document.createElement("div");
      icon.style.width = "24px";
      icon.style.height = "24px";
      icon.style.borderRadius = "999px";
      icon.style.backgroundColor = "#16a34a"; // green
      icon.style.display = "flex";
      icon.style.alignItems = "center";
      icon.style.justifyContent = "center";
      icon.style.color = "#ffffff";
      icon.style.fontSize = "16px";
      icon.style.flexShrink = "0";
      icon.textContent = "✓";

      // Text wrapper
      const textWrap = document.createElement("div");

      const title = document.createElement("div");
      title.textContent = "Success";
      title.style.fontWeight = "600";
      title.style.marginBottom = "2px";

      const body = document.createElement("div");
      body.textContent = "Your calendar has been saved";

      textWrap.appendChild(title);
      textWrap.appendChild(body);

      tooltip.appendChild(icon);
      tooltip.appendChild(textWrap);

      document.body.appendChild(tooltip);
    }

    // Show with animation
    if (saveTooltipTimeout) {
      clearTimeout(saveTooltipTimeout);
    }

    // Force reflow so transition applies every time
    tooltip.getBoundingClientRect();
    tooltip.style.opacity = "1";
    tooltip.style.transform = "translateY(0)";

    // Hide after 2 seconds
    saveTooltipTimeout = setTimeout(() => {
      tooltip.style.opacity = "0";
      tooltip.style.transform = "translateY(10px)";
    }, 2000);
  }

  // Initial count on page load (for pages that have save UI)
  updateSavedCountUI();

  // ---------- Main save handler ----------

  saveButton.addEventListener("click", function () {
    let savedList = getSavedCalendars();

    // Month + Year from the calendar
    const month = calendarMain.getAttribute("month");
    const year = calendarMain.getAttribute("year");

    // 1) Determine the base name
    let baseName = saveNameInput ? saveNameInput.value.trim() : "";
    if (!baseName) {
      baseName = `${month} ${year}`;
    }

    // 2) Ensure unique name
    const finalName = generateCalendarName(baseName, savedList);

    // 3) Gather current settings
    const startOnMonday = !!(toggleStart && toggleStart.checked);
    const showHolidays = !!(toggleHolidays && toggleHolidays.checked);
    const country = countryInput ? countryInput.value : null;

    const colors = getCurrentColors();
    const fonts = getCurrentFonts();
    const notes = getCurrentNotes();

    const nowIso = new Date().toISOString();

    // 4) Build the saved calendar object
    const calendarObj = {
      id: Date.now().toString(), // simple unique id for now
      name: finalName,
      month,
      year,
      createdAt: nowIso,
      updatedAt: nowIso,

      settings: {
        startOnMonday,
        showHolidays,
        country,
        colors,
        fonts,
      },

      // { "1": "<span style='...'>..</span><div>..</div>", "12": "..." }
      notes,
    };

    // 5) Add to saved list and persist
    savedList.push(calendarObj);
    saveCalendars(savedList);

    // 6) UI updates
    updateSavedCountUI();
    showSaveNotification();

    // 7) Debug logs so you can inspect
    console.log("Saved calendar object:", calendarObj);
    console.log("All saved calendars:", savedList);
  });
});
