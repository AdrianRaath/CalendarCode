document.addEventListener("DOMContentLoaded", function () {
  // References
  const toggleStart = document.getElementById("toggle-start");
  // This element both has the month/year attributes AND contains the day blocks
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

  // Render on page load
  renderCalendar();

  // Re-render whenever the checkbox (Sunday/Monday toggle) changes
  toggleStart.addEventListener("change", renderCalendar);

  function renderCalendar() {
    // (A) Update Day Labels
    const dayLabels = document.querySelectorAll(".calendar_day");
    if (toggleStart.checked) {
      dayLabels.forEach((labelEl, i) => {
        labelEl.textContent = daysOfWeekMondayStart[i];
      });
    } else {
      dayLabels.forEach((labelEl, i) => {
        labelEl.textContent = daysOfWeekSundayStart[i];
      });
    }

    // (B) Gather month & year info from #calendar-main
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

    // (C) Possibly add or remove the 6th row
    const neededBlocks = startDay + daysInMonth;
    if (neededBlocks > 35) {
      addSixthRowIfNeeded();
    } else {
      removeSixthRowIfExists();
    }

    // Now select all .calendar_block again (could be 35 or 42)
    const calendarBlocks = calendarMain.querySelectorAll(".calendar_block");

    // (D) Collect any existing .editable-text from each block, keyed by day number
    const dayToTextNodes = {};
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

    // (E) Reset all blocks before assigning new days
    calendarBlocks.forEach((block) => {
      const dayEl = block.querySelector(".calendar_block-day");
      dayEl.textContent = "";
      block.classList.remove("active", "inactive");
    });

    // (F) Assign day numbers to blocks
    calendarBlocks.forEach((block, index) => {
      const dayEl = block.querySelector(".calendar_block-day");
      if (index >= startDay && index < startDay + daysInMonth) {
        const newDayNum = index - startDay + 1;
        dayEl.textContent = newDayNum;
        block.classList.add("active");

        // Re-append .editable-text if any
        if (dayToTextNodes[newDayNum]) {
          dayToTextNodes[newDayNum].forEach((textNode) => {
            block.appendChild(textNode);
          });
        }
      } else {
        block.classList.add("inactive");
      }
    });

    // (G) Re-run block editing logic
    if (typeof enableBlockEditing === "function") {
      enableBlockEditing();
    }

    // (H) Re-run holiday logic if it exists
    if (typeof updateHolidays === "function") {
      updateHolidays();
    }
  }

  // Helper: Add a 6th row (7 blocks) if we only have 35 currently
  function addSixthRowIfNeeded() {
    const currentBlocks = calendarMain.querySelectorAll(".calendar_block");
    if (currentBlocks.length === 35) {
      // The last row is blocks with indices 28..34 (0-based)
      const row5Blocks = Array.from(currentBlocks).slice(28, 35);
      row5Blocks.forEach((oldBlock) => {
        const newBlock = oldBlock.cloneNode(true);
        // Clear out day text / .editable-text
        newBlock.querySelector(".calendar_block-day").textContent = "";
        newBlock
          .querySelectorAll(".editable-text")
          .forEach((txt) => txt.remove());
        // Append to #calendar-main
        calendarMain.appendChild(newBlock);
      });
    }
  }

  // Helper: Remove a 6th row if we have 42 blocks
  function removeSixthRowIfExists() {
    const currentBlocks = calendarMain.querySelectorAll(".calendar_block");
    if (currentBlocks.length === 42) {
      // Remove last 7 blocks
      for (let i = 0; i < 7; i++) {
        const lastBlock = calendarMain.lastElementChild;
        if (lastBlock.classList.contains("calendar_block")) {
          calendarMain.removeChild(lastBlock);
        }
      }
    }
  }
});
