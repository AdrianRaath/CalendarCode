document.addEventListener("DOMContentLoaded", function () {
  const toggleStart = document.getElementById("toggle-start");

  // These are the day names for each layout
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

  // Run the initial render on page load
  renderCalendar();

  // Listen for changes to the toggle checkbox
  toggleStart.addEventListener("change", function () {
    renderCalendar();
  });

  function renderCalendar() {
    // 1) Update the day labels at the top
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

    // 2) Build the calendar date blocks
    const calendarMain = document.getElementById("calendar-main");
    const monthName = calendarMain.getAttribute("month");
    const year = parseInt(calendarMain.getAttribute("year"), 10);

    const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // Raw start day (0 = Sunday, 1 = Monday, ...)
    const rawStartDay = new Date(year, monthIndex, 1).getDay();

    // If toggleStart is checked => Monday start
    // That means Sunday => 6, Monday => 0, Tuesday => 1, etc.
    let startDay;
    if (toggleStart.checked) {
      startDay = (rawStartDay + 6) % 7;
    } else {
      startDay = rawStartDay;
    }

    const calendarBlocks = document.querySelectorAll(".calendar_block");
    calendarBlocks.forEach((block, index) => {
      const dayElement = block.querySelector(".calendar_block-day");
      dayElement.textContent = "";
      block.classList.remove("active", "inactive");

      if (index >= startDay && index < startDay + daysInMonth) {
        dayElement.textContent = index - startDay + 1;
        block.classList.add("active");
      } else {
        block.classList.add("inactive");
      }
    });
  }
});
