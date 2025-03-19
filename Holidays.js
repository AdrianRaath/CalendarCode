document.addEventListener("DOMContentLoaded", function () {
  // Hardcoded multi-year holiday data
  // Organized by: holidays[country][year]["month/day"] = "Holiday Name"
  // Expand or update these as needed for future years or additional holidays.
  const holidays = {
    USA: {
      // -------------------------------- 2023 --------------------------------
      2023: {
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
      // -------------------------------- 2024 --------------------------------
      2024: {
        "1/1": "New Year's Day",
        "1/15": "Martin Luther King Jr. Day",
        "2/19": "Presidents' Day",
        "5/27": "Memorial Day",
        "7/4": "Independence Day",
        "9/2": "Labor Day",
        "10/14": "Columbus Day",
        "11/11": "Veterans Day",
        "11/28": "Thanksgiving Day",
        "12/25": "Christmas Day",
      },
      // -------------------------------- 2025 --------------------------------
      2025: {
        "1/1": "New Year's Day",
        "1/20": "Martin Luther King Jr. Day",
        "2/17": "Presidents' Day",
        "5/26": "Memorial Day",
        "7/4": "Independence Day",
        "9/1": "Labor Day",
        "10/13": "Columbus Day",
        "11/11": "Veterans Day",
        "11/27": "Thanksgiving Day",
        "12/25": "Christmas Day",
      },
      // -------------------------------- 2026 --------------------------------
      2026: {
        "1/1": "New Year's Day",
        "1/19": "Martin Luther King Jr. Day",
        "2/16": "Presidents' Day",
        "5/25": "Memorial Day",
        "7/4": "Independence Day",
        "9/7": "Labor Day",
        "10/12": "Columbus Day",
        "11/11": "Veterans Day",
        "11/26": "Thanksgiving Day",
        "12/25": "Christmas Day",
      },
    },
    UK: {
      // -------------------------------- 2023 --------------------------------
      2023: {
        "1/1": "New Year's Day",
        "4/7": "Good Friday",
        "4/10": "Easter Monday",
        "5/1": "Early May Bank Holiday",
        "5/29": "Spring Bank Holiday",
        "8/28": "Summer Bank Holiday",
        "12/25": "Christmas Day",
        "12/26": "Boxing Day",
      },
      // -------------------------------- 2024 --------------------------------
      2024: {
        "1/1": "New Year's Day",
        "3/29": "Good Friday",
        "4/1": "Easter Monday",
        "5/6": "Early May Bank Holiday",
        "5/27": "Spring Bank Holiday",
        "8/26": "Summer Bank Holiday",
        "12/25": "Christmas Day",
        "12/26": "Boxing Day",
      },
      // -------------------------------- 2025 --------------------------------
      2025: {
        "1/1": "New Year's Day",
        "4/18": "Good Friday",
        "4/21": "Easter Monday",
        "5/5": "Early May Bank Holiday",
        "5/26": "Spring Bank Holiday",
        "8/25": "Summer Bank Holiday",
        "12/25": "Christmas Day",
        "12/26": "Boxing Day",
      },
      // -------------------------------- 2026 --------------------------------
      2026: {
        "1/1": "New Year's Day",
        "4/3": "Good Friday",
        "4/6": "Easter Monday",
        "5/4": "Early May Bank Holiday",
        "5/25": "Spring Bank Holiday",
        "8/31": "Summer Bank Holiday",
        "12/25": "Christmas Day",
        "12/26": "Boxing Day",
      },
    },
    Canada: {
      // -------------------------------- 2023 --------------------------------
      2023: {
        "1/1": "New Year's Day",
        "2/20": "Family Day",
        "4/7": "Good Friday",
        "7/1": "Canada Day",
        "9/4": "Labour Day",
        "10/9": "Thanksgiving Day",
        "11/11": "Remembrance Day",
        "12/25": "Christmas Day",
      },
      // -------------------------------- 2024 --------------------------------
      2024: {
        "1/1": "New Year's Day",
        "2/19": "Family Day",
        "3/29": "Good Friday",
        "7/1": "Canada Day",
        "9/2": "Labour Day",
        "10/14": "Thanksgiving Day",
        "11/11": "Remembrance Day",
        "12/25": "Christmas Day",
      },
      // -------------------------------- 2025 --------------------------------
      2025: {
        "1/1": "New Year's Day",
        "2/17": "Family Day",
        "4/18": "Good Friday",
        "7/1": "Canada Day",
        "9/1": "Labour Day",
        "10/13": "Thanksgiving Day",
        "11/11": "Remembrance Day",
        "12/25": "Christmas Day",
      },
      // -------------------------------- 2026 --------------------------------
      2026: {
        "1/1": "New Year's Day",
        "2/16": "Family Day",
        "4/3": "Good Friday",
        "7/1": "Canada Day",
        "9/7": "Labour Day",
        "10/12": "Thanksgiving Day",
        "11/11": "Remembrance Day",
        "12/25": "Christmas Day",
      },
    },
  };

  // Get references
  const toggleInput = document.getElementById("toggle-input");
  const countryInput = document.getElementById("country-input");
  const calendarMain = document.getElementById("calendar-main");

  // Globally expose updateHolidays
  window.updateHolidays = function updateHolidays() {
    // 1) Determine the selected country & year
    const selectedCountry = countryInput.value;
    const year = parseInt(calendarMain.getAttribute("year"), 10);

    // 2) Convert month name to numeric index (1-based)
    const monthName = calendarMain.getAttribute("month");
    const monthIndex = new Date(`${monthName} 1, 2000`).getMonth() + 1;

    // 3) Access the correct sub-object
    const countryData = holidays[selectedCountry] || {};
    const yearData = countryData[year] || {};
    // If empty, no holidays for that year => none will display

    // 4) Clear existing holiday labels
    const calendarBlocks = document.querySelectorAll(".calendar_block");
    calendarBlocks.forEach((block) => {
      const holidayElement = block.querySelector(".calendar_holiday");
      if (holidayElement) {
        holidayElement.textContent = "";
        holidayElement.style.display = "none";
      }
    });

    // 5) Assign holiday text if a match is found
    calendarBlocks.forEach((block) => {
      const dayElement = block.querySelector(".calendar_block-day");
      const holidayElement = block.querySelector(".calendar_holiday");
      if (dayElement && holidayElement) {
        const dayStr = dayElement.textContent.trim();
        const holidayKey = `${monthIndex}/${dayStr}`;

        if (yearData[holidayKey]) {
          holidayElement.textContent = yearData[holidayKey];
          // Show only if toggle is checked
          holidayElement.style.display = toggleInput.checked ? "block" : "none";
        }
      }
    });
  };

  // Re-run holidays on toggle & country changes
  toggleInput.addEventListener("change", window.updateHolidays);

  const observer = new MutationObserver(window.updateHolidays);
  observer.observe(countryInput, {
    attributes: true,
    attributeFilter: ["value"],
  });

  // Initial load
  window.updateHolidays();
});
