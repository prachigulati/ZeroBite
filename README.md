<h1 align="center">ZeroBite 🍲</h1>
<p align="center"><b>Turning Surplus into Sustenance.</b></p>
ZeroBite is a real-time surplus food distribution platform that connects donors, volunteers, and NGOs in an efficient, transparent, and gamified ecosystem.


## 🌍 The Mission
Food waste is a dual crisis. While millions face food insecurity, decaying surplus food in landfills contributes significantly to $CH_4$ (methane) and $CO_2$ emissions. **ZeroBite** bridges this gap by ensuring surplus food reaches those in need while providing measurable environmental and social impact data.

## ✨ Key Features

### 1. Smart Donation & QR Verification
* **Donor Listings:** Restaurants and individuals can quickly list surplus food with details on quantity and expiry.
* **QR Code Generation:** The system generates a unique QR code for each donation to ensure secure handovers.
* **Verified Pickups:** Volunteers scan the QR code upon collection, ensuring transparency and preventing food wastage through real-time tracking.

### 2. Gamified Volunteer Rewards
* **Incentivized Action:** Volunteers earn points for every verified pickup or donation.
* **Redemption:** Points can be redeemed for food vouchers, transport credits, or learning perks via the **Rewards Page**.
* **Engagement:** A leaderboard system to keep the community motivated and active.

### 3. Impact Analytics Dashboard
* **Environmental Tracking:** Real-time metrics on $CO_2$ emissions avoided (calculated based on the weight of food diverted from landfills).
* **Social Impact:** Total meals saved and lives impacted.
* **CSR Reporting:** A dedicated tool for corporate donors to track and demonstrate their Corporate Social Responsibility impact.


## 🛠️ Tech Stack
* **Backend:** Python (Django)
* **Frontend:** HTML5, CSS3, JavaScript
* **Database:** SQLite / PostgreSQL
* **Tools:** QR Code API, Data Visualization (Chart.js/D3.js)


## 🚀 Getting Started

### Prerequisites
* Python 3.x
* pip (Python package manager)

### Installation
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/prachigulati/ZeroBite.git]
   cd ZeroBite
2. **Set up a virtual environment:**
   ```bash
   python -m venv venv
   # Activate on Windows:
   .\venv\Scripts\activate
   # Activate on macOS/Linux:
   source venv/bin/activate
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
4. **Initialize the database:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
5. **Run the application:**
   ```bash
   python manage.py runserver
The platform will be live at http://127.0.0.1:8000/.
## 📊 Impact Logic
We track sustainability using the following environmental impact formula:
      Emissions Avoided (kg CO2e) = Weight of Food Saved (kg)X2.5
## 🤝Contributing
We welcome contributions from the community! Whether it's fixing bugs, improving the UI, or adding new reward perks, feel free to fork the repo and submit a Pull Request.👥❤️.Reducing waste, one bite at a time.
