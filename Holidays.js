document.addEventListener("DOMContentLoaded", function () {
  // Hardcoded holiday data
  const holidays = {
    USA: {
      "1/1": "New Year's Day",
      "1/16": "Martin Luther King Jr. Day",
      "2/20": "Presidents' Day",
      "5/29": "Memorial Day",
      "7/4": "Independence Day",
      "9/4": "Labor Day",
      "10/9": "Columbus Day",
      "11/11": "Veterans Day",
      "11/23": "Thanksgiving Day",
      "12/25": "Christmas Day",
    },
    UK: {
      "1/1": "New Year's Day",
      "4/7": "Good Friday",
      "4/10": "Easter Monday",
      "5/1": "Early May Bank Holiday",
      "5/29": "Spring Bank Holiday",
      "8/28": "Summer Bank Holiday",
      "12/25": "Christmas Day",
      "12/26": "Boxing Day",
    },
    Canada: {
      "1/1": "New Year's Day",
      "2/20": "Family Day",
      "4/7": "Good Friday",
      "7/1": "Canada Day",
      "9/4": "Labour Day",
      "10/9": "Thanksgiving Day",
      "11/11": "Remembrance Day",
      "12/25": "Christmas Day",
    },
  };

  // Get the toggle input, country input, and calendar element
  const toggleInput = document.getElementById("toggle-input");
  const countryInput = document.getElementById("country-input");
  const calendarMain = document.getElementById("calendar-main");

  // Convert the month name from the calendar's month attribute to a numeric value
  const monthName = calendarMain.getAttribute("month");
  const monthIndex = new Date(`${monthName} 1, 2000`).getMonth() + 1; // Convert to 1-based index

  // Function to update holiday visibility
  function updateHolidays() {
    // Get the selected country
    const selectedCountry = countryInput.value;
    const countryHolidays = holidays[selectedCountry] || {};

    // Select all calendar blocks
    const calendarBlocks = document.querySelectorAll(".calendar_block");

    // Clear all previously shown holidays
    calendarBlocks.forEach((block) => {
      const holidayElement = block.querySelector(".calendar_holiday");
      if (holidayElement) {
        holidayElement.textContent = "";
        holidayElement.style.display = "none";
      }
    });

    // Iterate over the calendar blocks and update the holiday text
    calendarBlocks.forEach((block) => {
      const dayElement = block.querySelector(".calendar_block-day");
      const holidayElement = block.querySelector(".calendar_holiday");

      if (dayElement && holidayElement) {
        const day = dayElement.textContent;

        // Create a key in the format 'month/day'
        const holidayKey = `${monthIndex}/${day}`;

        // Update the holiday text if a holiday exists for this date
        if (countryHolidays[holidayKey]) {
          holidayElement.textContent = countryHolidays[holidayKey];
          holidayElement.style.display = toggleInput.checked ? "block" : "none";
        }
      }
    });
  }

  // Add event listener for the toggle input
  toggleInput.addEventListener("change", updateHolidays);

  // Use MutationObserver to detect value changes in the country input
  const observer = new MutationObserver(updateHolidays);
  observer.observe(countryInput, {
    attributes: true,
    attributeFilter: ["value"],
  });

  // Initial check on page load
  updateHolidays();
});
