document.addEventListener("DOMContentLoaded", function () {
  // 1) References
  const toggleStart = document.getElementById("toggle-start");
  const calendarMain = document.getElementById("calendar-main");

  // Day-of-week arrays
  const daysOfWeekSundayStart = [
    "SUN",
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
  ];
  const daysOfWeekMondayStart = [
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
    "SUN",
  ];

  // 2) Render on page load
  renderCalendar();

  // 3) Re-render whenever the checkbox changes
  toggleStart.addEventListener("change", function () {
    renderCalendar();
  });

  // 4) The core function that recalculates & re-maps everything
  function renderCalendar() {
    // --- (A) Update Day Labels ---
    const dayLabels = document.querySelectorAll(".calendar_day");
    if (toggleStart.checked) {
      // Monday start
      dayLabels.forEach((labelEl, i) => {
        labelEl.textContent = daysOfWeekMondayStart[i];
      });
    } else {
      // Sunday start
      dayLabels.forEach((labelEl, i) => {
        labelEl.textContent = daysOfWeekSundayStart[i];
      });
    }

    // --- (B) Gather month & year info
    const monthName = calendarMain.getAttribute("month");
    const year = parseInt(calendarMain.getAttribute("year"), 10);
    const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // Raw start day (0=Sunday, 1=Monday, etc.)
    const rawStartDay = new Date(year, monthIndex, 1).getDay();

    // If user wants Monday start, shift Sunday => 6, Monday => 0, etc.
    let startDay;
    if (toggleStart.checked) {
      startDay = (rawStartDay + 6) % 7;
    } else {
      startDay = rawStartDay;
    }

    // --- (C) Collect .editable-text from each block, keyed by day number
    const calendarBlocks = document.querySelectorAll(".calendar_block");
    const dayToTextNodes = {}; // e.g. { 1: [node1, node2], 2: [...], ... }

    calendarBlocks.forEach((block) => {
      const dayEl = block.querySelector(".calendar_block-day");
      const existingDayNum = parseInt(dayEl.textContent, 10);

      if (!isNaN(existingDayNum) && existingDayNum > 0) {
        const textNodes = Array.from(block.querySelectorAll(".editable-text"));
        if (textNodes.length) {
          dayToTextNodes[existingDayNum] = (
            dayToTextNodes[existingDayNum] || []
          ).concat(textNodes);
        }
      }
    });

    // --- (D) Reset every block before we reassign days
    calendarBlocks.forEach((block) => {
      const dayEl = block.querySelector(".calendar_block-day");
      dayEl.textContent = "";
      block.classList.remove("active", "inactive");
    });

    // --- (E) Reassign each block to the correct day
    calendarBlocks.forEach((block, index) => {
      const dayEl = block.querySelector(".calendar_block-day");

      // If index is within the valid range for this month
      if (index >= startDay && index < startDay + daysInMonth) {
        const newDayNum = index - startDay + 1; // 1-based day number
        dayEl.textContent = newDayNum;
        block.classList.add("active");

        // If we had stored .editable-text for this day, re-append them
        if (dayToTextNodes[newDayNum]) {
          dayToTextNodes[newDayNum].forEach((textNode) => {
            block.appendChild(textNode);
          });
        }
      } else {
        block.classList.add("inactive");
      }
    });

    // --- (F) Re-run your editing logic so only the new active blocks are editable
    if (typeof enableBlockEditing === "function") {
      enableBlockEditing();
    }
  }
});
