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

  // 1. Check login state on page load
  checkLoginState();

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
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      
      try {
        const response = await fetch('/api/create-donation/', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          alert("Donation submitted successfully!");
          form.reset();
        } else {
          const error = await response.json();
          alert("Error: " + (error.message || "Failed to submit donation"));
        }
      } catch (error) {
        console.error("Error submitting donation:", error);
        alert("Error: Failed to submit donation. Please try again.");
      }
    });
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
    const id = e.target.getAttribute('data-id');
    // TODO: call your backend reservation API here
    alert(`Pickup reserved (demo) for item #${id}`);
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
      // By removing `maintainAspectRatio: false`, it defaults to `true`,
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

const loginBtn = document.querySelector('.btn.ghost');
const signupBtn = document.querySelector('.btn.primary');
const modal = document.getElementById('modalOverlay');
const closeBtn = document.getElementById('modalClose');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

function openModal(isSignup) {
  modal.classList.add('active');
  if (isSignup) {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
  } else {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
  }
}

loginBtn.addEventListener('click', () => openModal(false));
signupBtn.addEventListener('click', () => openModal(true));
closeBtn.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  signupTab.classList.remove('active');
  loginForm.classList.add('active');
  signupForm.classList.remove('active');
});

signupTab.addEventListener('click', () => {
  signupTab.classList.add('active');
  loginTab.classList.remove('active');
  signupForm.classList.add('active');
  loginForm.classList.remove('active');
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const email = formData.get('email') || loginForm.querySelector('input[type="email"]').value;
  const password = formData.get('password') || loginForm.querySelector('input[type="password"]').value;
  
  try {
    const response = await fetch('/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const result = await response.json();
      alert("Login successful!");
      modal.classList.remove('active');
      // Update UI to show logged in state
      updateLoginState(true, result.user);
    } else {
      const error = await response.json();
      alert("Error: " + (error.message || "Login failed"));
    }
  } catch (error) {
    console.error("Error logging in:", error);
    alert("Error: Failed to login. Please try again.");
  }
});

// Signup form submission
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(signupForm);
  const name = formData.get('name') || signupForm.querySelector('input[placeholder="Name"]').value;
  const email = formData.get('email') || signupForm.querySelector('input[type="email"]').value;
  const password = formData.get('password') || signupForm.querySelector('input[type="password"]').value;
  
  try {
    const response = await fetch('/api/signup/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password })
    });
    
    if (response.ok) {
      const result = await response.json();
      alert("Account created successfully!");
      modal.classList.remove('active');
      // Update UI to show logged in state
      updateLoginState(true, result.user);
    } else {
      const error = await response.json();
      alert("Error: " + (error.message || "Signup failed"));
    }
  } catch (error) {
    console.error("Error signing up:", error);
    alert("Error: Failed to create account. Please try again.");
  }
});

// Function to check login state on page load
async function checkLoginState() {
  try {
    const response = await fetch('/api/analytics/', {
      method: 'GET',
      credentials: 'same-origin'
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        // User is logged in, update UI
        updateLoginState(true, { name: 'User' });
      } else {
        updateLoginState(false);
      }
    } else {
      updateLoginState(false);
    }
  } catch (error) {
    console.log('Not logged in');
    updateLoginState(false);
  }
}

// Function to update login state in UI
function updateLoginState(isLoggedIn, user = null) {
  const loginBtn = document.querySelector('.btn.ghost');
  const signupBtn = document.querySelector('.btn.primary');
  
  if (isLoggedIn && user) {
    loginBtn.textContent = user.name || 'Profile';
    signupBtn.textContent = 'Logout';
    signupBtn.onclick = () => logout();
  } else {
    loginBtn.textContent = 'Login';
    signupBtn.textContent = 'Get Started';
    signupBtn.onclick = () => openModal(true);
  }
}

// Logout function
async function logout() {
  try {
    const response = await fetch('/api/logout/', {
      method: 'POST'
    });
    
    if (response.ok) {
      alert("Logged out successfully!");
      updateLoginState(false);
    } else {
      alert("Error logging out");
    }
  } catch (error) {
    console.error("Error logging out:", error);
    alert("Error logging out");
  }
}