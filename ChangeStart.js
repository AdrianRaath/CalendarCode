document.addEventListener("DOMContentLoaded", function () {
  const toggleStart = document.getElementById("toggle-start");

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

  // Initial render
  renderCalendar();

  // Re-render whenever the toggle changes
  toggleStart.addEventListener("change", function () {
    renderCalendar();
  });

  function renderCalendar() {
    // 1) Update day-of-week labels
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

    // 2) Gather info about the current month/year
    const calendarMain = document.getElementById("calendar-main");
    const monthName = calendarMain.getAttribute("month");
    const year = parseInt(calendarMain.getAttribute("year"), 10);
    const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const rawStartDay = new Date(year, monthIndex, 1).getDay();

    // Decide the effective start day (0-based) depending on toggle
    // Sunday => 0, Monday => (rawStartDay + 6) % 7
    let startDay;
    if (toggleStart.checked) {
      startDay = (rawStartDay + 6) % 7;
    } else {
      startDay = rawStartDay;
    }

    // 3) Collect all .editable-text elements keyed by their current day number
    //    so we can re-attach them to the correct block after we rebuild.
    const calendarBlocks = document.querySelectorAll(".calendar_block");
    const dayToTextNodes = {}; // e.g. { 15: [node1, node2], ... }
    calendarBlocks.forEach((block) => {
      const dayEl = block.querySelector(".calendar_block-day");
      const dayNum = parseInt(dayEl.textContent, 10);
      if (!isNaN(dayNum) && dayNum > 0) {
        const textNodes = Array.from(block.querySelectorAll(".editable-text"));
        if (textNodes.length) {
          dayToTextNodes[dayNum] = (dayToTextNodes[dayNum] || []).concat(
            textNodes
          );
        }
      }
    });

    // 4) Reset all blocks (remove active/inactive, clear day text, etc.)
    calendarBlocks.forEach((block) => {
      const dayEl = block.querySelector(".calendar_block-day");
      dayEl.textContent = "";
      block.classList.remove("active", "inactive");
    });

    // 5) Reassign the day numbers for each block based on startDay
    calendarBlocks.forEach((block, index) => {
      const dayEl = block.querySelector(".calendar_block-day");

      if (index >= startDay && index < startDay + daysInMonth) {
        // This block is "active" and represents a valid date
        const dayNum = index - startDay + 1; // 1-based day
        dayEl.textContent = dayNum;
        block.classList.add("active");

        // 6) If we had stored .editable-text nodes for this dayNum, re-append them
        if (dayToTextNodes[dayNum]) {
          dayToTextNodes[dayNum].forEach((textNode) => {
            block.appendChild(textNode);
          });
        }
      } else {
        // It's outside this month's range
        block.classList.add("inactive");
      }
    });
  }
});
