# Student Mark Management System

A web-based application for managing student academic records, built with React, TypeScript, and Firebase.

## Features

- **User Authentication**
  - Separate login for students and teachers
  - Secure authentication using Firebase Auth
  - User role-based access control

- **Teacher Features**
  - Manage student marks for different subjects
  - Generate academic reports
  - View and manage subjects
  - Real-time updates using Firebase Realtime Database

- **Student Features**
  - View academic performance
  - Track marks across different subjects
  - Real-time updates of new marks

## Tech Stack

- React 18
- TypeScript
- Firebase (Authentication & Realtime Database)
- Tailwind CSS
- Vite

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/chama-x/StudentMarkSystem.git
   cd StudentMarkSystem
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Firebase project and add your configuration:
   - Create a new project in Firebase Console
   - Enable Authentication and Realtime Database
   - Copy your Firebase configuration
   - Update the configuration in `src/firebase.ts`

4. Start the development server:
   ```bash
   npm run dev
   ```

## Default Login Credentials

### Teacher Account
- Email: teacher@school.com
- Password: Teacher@123

## Project Structure

```
src/
├── components/        # React components
│   ├── auth/         # Authentication components
│   ├── student/      # Student dashboard components
│   └── teacher/      # Teacher dashboard components
├── contexts/         # React contexts
├── services/         # Firebase services
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
