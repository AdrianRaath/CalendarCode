document.addEventListener("DOMContentLoaded", function () {
  // Select all active calendar blocks
  const activeBlocks = document.querySelectorAll(".calendar_block.active");

  // Add click event listener to each active block
  activeBlocks.forEach((block) => {
    block.addEventListener("click", function (event) {
      event.stopPropagation(); // Prevent triggering the document click listener

      // Remove the 'editing' class from any other blocks
      document
        .querySelectorAll(".calendar_block.editing")
        .forEach((otherBlock) => {
          if (otherBlock !== block) {
            otherBlock.classList.remove("editing");
          }
        });

      // Add the 'editing' class to the clicked block
      block.classList.add("editing");

      // Check if the block already has an editable element
      let textElement = block.querySelector(".editable-text");
      if (!textElement) {
        // Create a new editable text element if it doesn't exist
        textElement = document.createElement("div");
        textElement.classList.add("editable-text");
        textElement.setAttribute("contenteditable", "true");
        textElement.style.fontSize = "0.75rem";
        textElement.style.whiteSpace = "pre-wrap";
        textElement.style.outline = "none";
        textElement.style.minHeight = "1.2em";

        // Append the text element to the block and focus it
        block.appendChild(textElement);
        textElement.focus();
      } else {
        // Focus the existing text element for editing
        textElement.setAttribute("contenteditable", "true");
        textElement.focus();
      }
    });
  });

  // End editing state when clicking outside any block
  document.addEventListener("click", function () {
    const activeTextElement = document.querySelector(
      '.editable-text[contenteditable="true"]'
    );
    if (activeTextElement) {
      // Remove the editable attribute
      activeTextElement.removeAttribute("contenteditable");

      // Remove the text element if it's empty
      if (!activeTextElement.textContent.trim()) {
        activeTextElement.remove();
      }
    }

    // Remove the 'editing' class from all blocks
    document.querySelectorAll(".calendar_block.editing").forEach((block) => {
      block.classList.remove("editing");
    });
  });
});
