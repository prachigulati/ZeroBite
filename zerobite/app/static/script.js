let mealsChartInstance, co2ChartInstance;

const chartData = {
    '12m': {
        labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        meals: [500,1200,2000,3100,4500,6000,8000,9500,11000,12300,13200,14000],
        co2: [200,300,450,600,800,1000,1300,1500,1700,1850,1950,2000],
    },
    '6m': {
        labels: ["Jul","Aug","Sep","Oct","Nov","Dec"],
        meals: [8000,9500,11000,12300,13200,14000],
        co2: [1300,1500,1700,1850,1950,2000],
    },
    '30d': {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        meals: [3050, 3200, 2900, 3450],
        co2: [450, 480, 440, 510],
    }
};

function updateAllCharts(range) {
    const data = chartData[range];
    mealsChartInstance.data.labels = data.labels;
    mealsChartInstance.data.datasets[0].data = data.meals;
    co2ChartInstance.data.labels = data.labels;
    co2ChartInstance.data.datasets[0].data = data.co2;
    mealsChartInstance.update();
    co2ChartInstance.update();
}

document.addEventListener('DOMContentLoaded', () => {
  // --- Single entry point for all DOM-ready initializations ---

  // 1. Login state is handled by Django templates - no need to check

  // 2. Set active navigation link based on current URL
  const navLinks = document.querySelectorAll('.nav-item');
  const currentPath = location.pathname;
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (currentPath.endsWith(linkPath)) {
      // Remove 'active' from any other link that might have it by default
      document.querySelector('.nav-item.active')?.classList.remove('active');
      link.classList.add('active');
    }
  });

  console.log('Homepage pixel-approx loaded — accent:', getComputedStyle(document.documentElement).getPropertyValue('--accent'));

  // 2. Donation form submission
  const form = document.getElementById('donationForm');
  if (form) {
    console.log("Donation form found, adding event listener");
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log("Form submitted, preventing default");
      
      const formData = new FormData(form);
      
      // Debug: Log form data
      console.log("Form data entries:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      try {
        console.log("Sending request to /api/create-donation/");
        const response = await fetch('/api/create-donation/', {
          method: 'POST',
          body: formData
        });
        
        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);
        
        if (response.ok) {
          const result = await response.json();
          console.log("Success response:", result);
          alert("Donation submitted successfully!");
          form.reset();
        } else {
          const error = await response.json();
          console.log("Error response:", error);
          alert("Error: " + (error.message || "Failed to submit donation"));
        }
      } catch (error) {
        console.error("Error submitting donation:", error);
        alert("Error: Failed to submit donation. Please try again.");
      }
    });
  } else {
    console.log("Donation form not found!");
  }

  // 3. Volunteer form submission (if exists)
  const vForm = document.getElementById('volunteerForm');
  if (vForm) {
    vForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(vForm);
      
      try {
        const response = await fetch('/api/volunteer/', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          alert("Volunteer application submitted successfully!");
          vForm.reset();
        } else {
          const error = await response.json();
          alert("Error: " + (error.message || "Failed to submit application"));
        }
      } catch (error) {
        console.error("Error submitting volunteer application:", error);
        alert("Error: Failed to submit application. Please try again.");
      }
    });
  }

  // 4. QR Code Scanner Logic for Volunteer Page
  const startBtn = document.getElementById("startBtn");
  const confirmBtn = document.getElementById("confirmBtn");
  const scanResult = document.getElementById("scanResult");
  const scannerBox = document.getElementById("scannerBox");
  const placeholder = document.getElementById("scannerPlaceholder");

  // Only initialize scanner logic if the buttons are on the page
  if (startBtn && confirmBtn && scannerBox) {
    let html5QrCode;

    startBtn.addEventListener("click", () => {
      placeholder.classList.add("hidden");
      scannerBox.classList.remove("hidden");

      html5QrCode = new Html5Qrcode("preview");

      html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        { fps: 10, qrbox: 250 },
        (decodedText) => { // Success callback
          scanResult.textContent = "Scanned: " + decodedText;
          confirmBtn.disabled = false;
          // Optional: stop scanning after a successful scan
          // html5QrCode.stop();
        },
        (error) => { // Failure callback
          // This callback is called frequently, so we'll ignore non-critical errors.
        }
      ).catch(err => {
        console.error("Unable to start QR Code scanner.", err);
        alert("Error: Could not start the camera. Please check permissions.");
      });
    });

    confirmBtn.addEventListener("click", () => {
      alert("Pickup confirmed ✅\n" + scanResult.textContent);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          scannerBox.classList.add("hidden");
          placeholder.classList.remove("hidden");
          confirmBtn.disabled = true;
          scanResult.textContent = "Waiting for scan...";
        }).catch(err => {
          console.error("Failed to stop the scanner.", err);
        });
      }
    });
  }

  // 5. Initialize Charts for Analytics Page
  initializeCharts();

  // 6. Add event listener for the analytics time range selector
  const timeRangeSelect = document.getElementById('timeRangeSelect');
  if (timeRangeSelect) {
      timeRangeSelect.addEventListener('change', (e) => {
          updateAllCharts(e.target.value);
      });
  }
});

// --- Event Delegation for dynamically added elements or general purpose clicks ---
document.addEventListener('click', (e) => {
  // Handle pickup button clicks on the donations page
  if (e.target.matches('.pickup-btn')) {
    // Check if user is authenticated
    const isAuthenticated = document.querySelector('.welcome-user') !== null;
    
    if (!isAuthenticated) {
      // User not authenticated, open login modal
      if (typeof openLoginModal === 'function') {
        openLoginModal();
      } else {
        alert('Please login to access this feature');
      }
      return;
    }
    
    // User is authenticated, let the donation page handle the modal
    // The donation page has its own pickup button handler
  }
});

function initializeCharts() {
// Meals Saved Over Time (Line Chart)
const ctxMeals = document.getElementById('mealsChart');
const initialData = chartData['12m'];
if (ctxMeals) {
  mealsChartInstance = new Chart(ctxMeals, {
    type: 'line',
    data: {
      labels: initialData.labels,
      datasets: [{
        label: "Meals Saved",
        data: initialData.meals,
        borderColor: "green",
        backgroundColor: "rgba(46,125,50,0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
}

// CO2 Reduction (Bar Chart)
const ctxCO2 = document.getElementById('co2Chart');
if (ctxCO2) {
  co2ChartInstance = new Chart(ctxCO2, {
    type: 'bar',
    data: {
      labels: initialData.labels,
      datasets: [{
        label: "CO₂ Reduced (kg)",
        data: initialData.co2,
        backgroundColor: "black"
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
}

// Donation Status (Doughnut)
const ctxDonation = document.getElementById('donationStatusChart');
if (ctxDonation) {
  new Chart(ctxDonation, {
    type: 'doughnut',
    data: {
      labels: ["Active","Completed","Expired"],
      datasets: [{
        data: [60,30,10],
        backgroundColor: ["#2e7d32","#4caf50","#a5d6a7"]
      }]
    },
    options: {
      responsive: true,
      // By removing maintainAspectRatio: false, it defaults to true,
      // which is ideal for pie/doughnut charts to prevent distortion.
      plugins: {
        legend: { position: 'bottom' } // Move legend to the bottom for better layout
      }
    }
  });
}
}
  // 7. Rewards page redeem buttons
  const redeemButtons = document.querySelectorAll('.reward-card .btn');
  redeemButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      alert("Reward redeemed successfully! (Demo — backend not connected yet)");
    });
  });
  // 7. Rewards page logic
  const balanceValue = document.querySelector('.balance-value');
  const rewardButtons = document.querySelectorAll('.reward-card .btn');

  if (balanceValue && rewardButtons.length) {
    // Initialize balance from localStorage or default to 2450
    let balance = parseInt(localStorage.getItem('rewardBalance')) || 2450;
    balanceValue.textContent = balance + " pts";

    rewardButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Extract points cost from button text
        const costMatch = btn.textContent.match(/(\d+)\s*pts/);
        if (!costMatch) return;

        const cost = parseInt(costMatch[1]);

        if (balance >= cost) {
          balance -= cost;
          balanceValue.textContent = balance + " pts";
          localStorage.setItem('rewardBalance', balance);
          alert("✅ Reward redeemed! " + cost + " pts deducted.");
        } else {
          alert("❌ Not enough points to redeem this reward.");
        }
      });
    });
  }

// Updated modal system to work with new base.html modals
const loginBtn = document.querySelector('.btn.ghost');
const signupBtn = document.querySelector('.btn.primary');

// Only add event listeners if buttons exist and we're not already using the new modal system
if (loginBtn && !loginBtn.onclick) {
  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof openLoginModal === 'function') {
      openLoginModal();
    }
  });
}

if (signupBtn && !signupBtn.onclick) {
  signupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof openSignupModal === 'function') {
      openSignupModal();
    }
  });
}
// Old modal system removed - now using base.html modals

// Login form submission removed - now handled by Django forms in base.html

// Signup form submission removed - now handled by Django forms in base.html

// Login state is handled by Django templates - no JavaScript needed

// Logout function
async function logout() {
  try {
    const response = await fetch('/api/logout/', {
      method: 'POST'
    });
    
    if (response.ok) {
      alert("Logged out successfully!");
      // Redirect to home page - Django will handle the navbar update
      window.location.href = '/';
    } else {
      alert("Error logging out");
    }
  } catch (error) {
    console.error("Error logging out:", error);
    alert("Error logging out");
  }
}

// 7. Rewards Page Logic
const userTokensEl = document.getElementById('user-tokens');
if (userTokensEl) {
  const userLevelEl = document.getElementById('user-level');
  const userStreakEl = document.getElementById('user-streak');
  const progressBarEl = document.getElementById('level-progress-bar');
  const progressLabelEl = document.getElementById('progress-label-text');
  const rewardButtons = document.querySelectorAll('.reward-card .btn');

  // --- Demo Data & State ---
  const state = {
    tokens: parseInt(localStorage.getItem('rewardBalance')) || 892,
    level: 7,
    streak: 5,
    tokensForNextLevel: 1000,
    tokensAtLevelStart: 639
  };

  // --- Main Function to Update the UI ---
  const updateStatsUI = () => {
    userTokensEl.textContent = state.tokens;
    userLevelEl.textContent = state.level;
    userStreakEl.textContent = state.streak;

    const tokensEarnedInLevel = state.tokens - state.tokensAtLevelStart;
    const progressPercentage = Math.min(100, (tokensEarnedInLevel / state.tokensForNextLevel) * 100);
    
    // Animate the progress bar
    setTimeout(() => {
        progressBarEl.style.width = progressPercentage + '%';
    }, 100);

    const tokensNeeded = Math.max(0, (state.tokensAtLevelStart + state.tokensForNextLevel) - state.tokens);
    progressLabelEl.textContent = `${tokensNeeded} tokens to next level`;

    localStorage.setItem('rewardBalance', state.tokens);
  };

  // --- Redeem Logic ---
  rewardButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const costMatch = btn.textContent.match(/(\d+)\s*pts/);
      if (!costMatch) return;

      const cost = parseInt(costMatch[1]);

      if (state.tokens >= cost) {
        state.tokens -= cost;
        updateStatsUI();
        alert("✅ Reward redeemed! " + cost + " pts deducted.");
      } else {
        alert("❌ Not enough tokens to redeem this reward.");
      }
    });
  });

  // --- Initial UI Render on Page Load ---
  updateStatsUI();
}
