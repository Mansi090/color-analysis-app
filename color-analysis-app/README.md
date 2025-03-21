🖌️ Color Analysis App
A web-based color analysis tool that determines your seasonal color palette based on a selfie. It suggests best colors to wear, colors to avoid, and generates a fun PDF report for easy reference.



📌 Features
✔ Upload a Selfie – Analyze your dominant color.
✔ Seasonal Color Analysis – Find out if you're Spring, Summer, Autumn, or Winter.
✔ Best & Worst Colors – Get personalized clothing color recommendations.
✔ PDF Report – Download a stylish, AI-generated color report.
✔ React Frontend + Flask Backend – Fast & efficient processing.

🚀 Live Demo
🌍 Try the App Here 

🛠️ Tech Stack
Frontend: React.js, JavaScript, CSS
Backend: Flask, OpenCV, NumPy, ReportLab
Deployment: Render / Railway / AWS
📥 Installation Guide
1️⃣ Clone the Repository
sh
Copy
Edit
git clone https://github.com/Mansi090/color-analysis-app.git
cd color-analysis-app
2️⃣ Set Up the Backend (Flask)
sh
Copy
Edit
cd backend
python -m venv venv  # Create virtual environment
source venv/bin/activate  # Activate (Mac/Linux)
venv\Scripts\activate  # Activate (Windows)
pip install -r requirements.txt  # Install dependencies
python app.py  # Start the backend server
Backend will run at: http://127.0.0.1:5000

3️⃣ Set Up the Frontend (React)
sh
Copy
Edit
cd ../color-analysis-app
npm install  # Install dependencies
npm start  # Start React app
Frontend will run at: http://localhost:3000

🌍 Deployment Guide
Deploy Backend on Render (Free & Easy)
Push your backend code to GitHub.
Go to Render → New Web Service.
Select your GitHub repo & deploy.
Set Start Command:
sh
Copy
Edit
gunicorn app:app
Update React API URLs from http://127.0.0.1:5000 to https://your-backend-url.onrender.com.
Deploy Frontend on Vercel (Recommended)

💡 How to Use the App
1️⃣ Upload an image of yourself.
2️⃣ The app analyzes your dominant color using AI.
3️⃣ It determines your season (Spring, Summer, Autumn, Winter).
4️⃣ Get color suggestions for outfits.
5️⃣ Download a PDF report with recommendations.

🙌 Contributing
Want to improve this project? Follow these steps:

Fork the repository
Create a new branch (git checkout -b feature-name)
Make your changes & commit (git commit -m "Added new feature")
Push to GitHub (git push origin feature-name)
Create a Pull Request (PR)
📜 License
This project is MIT Licensed – Free to use & modify.

📧 Contact & Support
For questions or collaborations, contact:
📩 Mansi – mansid875@gmail.com
🔗 GitHub: github.com/Mansi090