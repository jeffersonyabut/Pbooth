export function setDelay(second) {
  document.getElementById("second").textContent = second;
}

export function showMe() {
  const dropdown = document.querySelector(".dropdown");
  const selected = dropdown.querySelector(".selected");
  const options = dropdown.querySelectorAll(".options div");

  selected.addEventListener("click", () => {
    dropdown.classList.toggle("active");
  });

  let secValue;
  // Set selected value
  options.forEach((option) => {
    option.addEventListener("click", () => {
      selected.textContent = option.textContent;
      // console.log("Selected value:", option.dataset.value);
      secValue = option.dataset.value;
      setDelay(secValue);
      dropdown.classList.remove("active");
    });
  });

  // Close dropdown if clicked outside
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });
}
