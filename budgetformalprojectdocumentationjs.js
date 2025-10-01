
  const floatBtn = document.getElementById("draggableainameFloatButton");
  const iframe = document.getElementById("draggableainameIframe");
  const closeBtn = document.getElementById("closeAIButton");

  floatBtn.addEventListener("click", () => {
    iframe.style.display = "block";
    closeBtn.style.display = "block";
    floatBtn.style.display = "none";
  });

  closeBtn.addEventListener("click", () => {
    iframe.style.display = "none";
    closeBtn.style.display = "none";
    floatBtn.style.display = "inline-block";
  });
