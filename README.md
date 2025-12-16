# Hospital E-Management System

A full-stack web application I built for managing hospital operations. This project handles everything from patient records and appointments to staff management and payroll. It's basically a digital solution to keep track of all the day-to-day stuff that happens in a hospital.

## What This Does

This system helps hospitals manage their operations in one place. You can handle patient information, schedule appointments, manage staff, track medical records, process payroll, and generate reports. It's got different access levels so admin, doctors, nurses, and other staff can use it based on their roles.

## Features

- **Patient Management**: Keep track of patient information, medical history, and records
- **Appointment Scheduling**: Schedule and manage patient appointments
- **Staff Management**: Manage employee information and roles
- **Department Management**: Organize staff and resources by departments
- **Medical Records**: Store and retrieve patient medical records securely
- **Prescription Management**: Create and manage prescriptions for patients
- **Payroll System**: Handle employee payroll processing
- **Notices/Announcements**: Post and manage notices for staff
- **Reports**: Generate various reports for hospital operations
- **Authentication**: Secure login system with role-based access control

## Tech Stack

### Backend
- Node.js with Express
- PostgreSQL database
- JWT for authentication
- bcrypt for password hashing

### Frontend
- React
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Recharts for data visualization

## Getting Started

### Prerequisites

You'll need these installed on your machine:
- Node.js (version 14 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Belinda1704/hospital-e-management-system.git
cd hospital-e-management-system
```

2. Set up the backend:
```bash
cd backend
npm install
```

3. Set up environment variables for the backend. Create a `.env` file in the backend directory with:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

4. Run database migrations:
```bash
npm run migrate
```

5. Seed the admin user:
```bash
npm run seed-admin
```

6. Set up the frontend:
```bash
cd ../frontend
npm install
```

7. Create a `.env` file in the frontend directory:
```
VITE_API_URL=http://localhost:5000
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173` (or another port if 5173 is taken)

3. Open your browser and navigate to the frontend URL

## Project Structure

```
hospital-e-management-system/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Authentication and other middleware
│   │   ├── routes/         # API routes
│   │   └── server.js       # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── contexts/       # React context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   └── main.jsx        # Entry point
│   └── package.json
└── README.md
```

## Notes

This was built as a learning project, so there might be some areas that could be improved. Feel free to fork it, make changes, or suggest improvements. If you run into any issues or have questions, feel free to open an issue on GitHub.

## License

MIT License - feel free to use this project for learning or as a starting point for your own projects.
