document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById('splash');
  const main = document.getElementById('main-content');
  setTimeout(() => {
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
      main.style.display = 'block';
    }, 1000);
  }, 2500);
});

  const getStartedBtn = document.getElementById("getStartedBtn");
  const overlay = document.getElementById("termsOverlay");
  const agreeBtn = document.getElementById("agreeBtn");
  const declineBtn = document.getElementById("declineBtn");
  const termsCheck = document.getElementById("termsCheck");

  let agreed = false;

  getStartedBtn.addEventListener("click", () => {
    if (!agreed) {
      overlay.style.display = "flex";
    } else {
      window.location.href = "greenaiaibotlogin.html"; 
    }
  });

  agreeBtn.addEventListener("click", () => {
    if (termsCheck.checked) {
      agreed = true;
      overlay.style.display = "none";
      window.location.href = "greenaiaibotlogin.html";
    } else {
      alert("You must check the box to accept the terms before proceeding.");
    }
  });

  declineBtn.addEventListener("click", () => {
    overlay.style.display = "none"; 
  });