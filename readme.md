# 🏋️‍♂️ DBU Gym Membership & Management System

A comprehensive web-based management system designed for **Debre Berhan University (DBU) Gym**. This project simulates a full-stack application using **HTML, CSS, JavaScript, and Bootstrap 5** for the frontend, with **JSON Server** acting as a REST API backend.

## 📋 Table of Contents
- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Login Credentials](#-login-credentials)
- [Folder Structure](#-folder-structure)
- [Screenshots](#-screenshots)

## 🔷 Overview
This system is designed to streamline operations for gym administrators and provide a self-service portal for members. It handles two distinct user types:
1.  **University Members** (Students/Staff) - Eligible for discounts.
2.  **External Members** (Public customers) - Standard rates.

The application features a simulated authentication system, role-based access control, and dynamic data persistence using a local JSON database.

## ✨ Features

### 👤 User Module
* **Registration:** Dynamic form switching between University (ID/Dept) and External (National ID/Address) registration.
* **Authentication:** Secure login and session management via LocalStorage.
* **Dashboard:** Real-time view of membership status, expiry date, and plan cost.
* **Profile Management:** Edit personal details and upload profile pictures (stored as Base64).
* **Membership Status:** Visual badges indicating "Active", "Expiring Soon", or "Expired".

### 🛡️ Admin Module
* **Dashboard Overview:** Real-time statistics on total revenue, active members, and expiry alerts.
* **Member Management:** Add, View, and Delete members directly from the interface.
* **System Settings:** Configure global settings (System Name, Maintenance Mode, Pricing, Opening Hours) which update the User Dashboard in real-time.
* **Backup:** One-click download of the entire database (`db.json`) for backup.

## 🛠 Tech Stack
* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Styling:** Bootstrap 5 (Responsive Design) + Custom CSS Variables for Theme Toggling.
* **Icons:** FontAwesome 6.
* **Backend Simulation:** JSON Server (REST API).
* **Data Persistence:** Local JSON file (`data/db.json`) + LocalStorage.

## ⚙️ Prerequisites
To run this project, you need **Node.js** installed on your computer to run the JSON Server.
* [Download Node.js](https://nodejs.org/)

## 🚀 Installation & Setup

1.  **Clone or Download** the project folder.
2.  **Open a terminal** inside the project root directory.
3.  **Install Dependencies** (specifically `json-server`):
    ```bash
    npm install
    # OR if you don't have a package.json yet:
    npm install json-server --save-dev
    ```
4.  **Start the Backend Server**:
    This command watches your `db.json` file and runs the API on port 3000.
    ```bash
    npm run server
    # OR directly:
    npx json-server --watch data/db.json --port 3000
    ```
5.  **Run the Frontend**:
    Simply open `index.html` in your web browser (or use Live Server if using VS Code).

## 🔐 Login Credentials
The system comes pre-populated with the following accounts for testing:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@gmail.com` | `admin` |
| **User** | `abebe@example.com` | `password123` |

> **Note:** You can register new users via the "Sign Up" page.

## 📂 Folder Structure
```text
/
├── admin/                  
│   ├── adminPage.html      
│   ├── admin.css 
│   ├── admin.js
│   ├── approvals.html
│   ├── settings/           
|   │   ├── editProfile.html      
|   │   ├── editProfile.css 
|   │   ├── editProfile.js
│   └── editProfile/        
│       ├── editProfile.html      
│       ├── editProfile.css 
│       └── editProfile.js
├── data/
│   └── db.json  
├── forgotpass/          
|   ├── forgot.html      
│   ├── forgot.css 
│   ├── forgot.js
├── pending/
│   └── pending.html
├── login/           
|   ├── login.html      
│   ├── login.css 
│   ├── login.js
├── register/          
|   ├── register.html      
│   ├── register.css 
│   ├── register.js
│   ├── payment.js
│   ├── payment.css
├── user/                  
│   ├── userDashboard.html      
│   ├── userDashboard.css 
│   ├── userDashboard.js
│   └── editProfile/        
│       ├── editProfile.html      
│       ├── editProfile.css 
│       └── editProfile.js
├── index.html              
├── package.json            
└── README.md               # Documentation

```
# Group Members _ _ _ _ _ _ _ _ID
```
1. Yishaq Damtew -----------DBU1601755
2. Yirgalem Zegeye----------DBU1601753
3. Ahmed Seid --------------DBU1601509
4. Abrham Belay ------------DBU1601483
```
