      window.addEventListener("load", () => {
        setTimeout(() => {
          document.getElementById("splash").classList.add("hidden");
          setTimeout(() => {
            document.getElementById("splash").style.display = "none";
            document.getElementById("main-content").style.display = "block";
            loadData();
          }, 1000);
        }, 2000);
      });

      function saveData() {
        const salary = Number(document.getElementById("salary").value) || 0;
        localStorage.setItem("salary", salary);

        const inputs = document.querySelectorAll(".container input");
        let total = 0;

        inputs.forEach((input, index) => {
          let val = Number(input.value) || 0;
          total += val;
          localStorage.setItem("input" + index, val);
        });

        if (total > salary) {
          let lastInput = inputs[inputs.length - 1];
          lastInput.value = Math.max(0, lastInput.value - (total - salary));
          localStorage.setItem("input" + (inputs.length - 1), lastInput.value);
        }
      }

      function loadData() {
        document.getElementById("salary").value =
          localStorage.getItem("salary") || "";
        const inputs = document.querySelectorAll(".container input");
        inputs.forEach((input, index) => {
          input.value = localStorage.getItem("input" + index) || "";
        });
      }

      const containerInputs = document.querySelectorAll(".container input");
      containerInputs.forEach((input) => {
        input.addEventListener("input", () => {
          const salary = Number(document.getElementById("salary").value) || 0;
          const inputs = document.querySelectorAll(".container input");
          let total = 0;
          inputs.forEach((i) => {
            total += Number(i.value) || 0;
          });
          if (total > salary) {
            alert("Total exceeds your salary!");
            input.value = Math.max(0, input.value - (total - salary));
          }
          saveData();
        });
      });

      function clearDatabase() {
        const confirmClear = confirm(
          "Do you want to clear the entire database?"
        );
        if (confirmClear) {
          const otp = Math.floor(1000 + Math.random() * 9000);
          const enteredOtp = prompt("Enter this OTP to confirm: " + otp);
          if (enteredOtp === otp.toString()) {
            localStorage.clear();
            alert("Database cleared successfully!");
            location.reload();
          } else {
            alert("Incorrect OTP. Database not cleared.");
          }
        }
      }