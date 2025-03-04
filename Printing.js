document.addEventListener("DOMContentLoaded", function () {
  const printTrigger = document.getElementById("print-trigger");
  const printContainer = document.getElementById("print-container");
  const calendarComponent = document.querySelector(".calendar_component");

  printTrigger.addEventListener("click", function () {
    // 1. Clear the print container
    printContainer.innerHTML = "";

    // 2. Clone the .calendar_component
    const clone = calendarComponent.cloneNode(true);

    // 3. Append the clone into #print-container
    printContainer.appendChild(clone);

    // 4. Trigger print
    window.print();

    // 5. (Optional) Clean up after printing
    printContainer.innerHTML = "";
  });
});
