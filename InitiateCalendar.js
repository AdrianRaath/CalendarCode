document.addEventListener("DOMContentLoaded", function () {
  // Get the calendar grid element
  const calendarMain = document.getElementById("calendar-main");

  // Get the month and year from the attributes
  const monthName = calendarMain.getAttribute("month");
  const year = parseInt(calendarMain.getAttribute("year"));

  // Convert month name to a number (0 = January, 1 = February, etc.)
  const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();

  // Calculate the number of days in the month and the starting day of the week
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startDay = new Date(year, monthIndex, 1).getDay();

  // Get all calendar blocks
  const calendarBlocks = document.querySelectorAll(".calendar_block");

  // Reset all blocks
  calendarBlocks.forEach((block, index) => {
    const dayElement = block.querySelector(".calendar_block-day");
    dayElement.textContent = "";
    block.classList.remove("active", "inactive");

    // Determine if the block is active or inactive
    if (index >= startDay && index < startDay + daysInMonth) {
      dayElement.textContent = index - startDay + 1;
      block.classList.add("active");
    } else {
      block.classList.add("inactive");
    }
  });
});
