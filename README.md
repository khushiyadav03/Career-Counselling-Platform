# Career Counselling Platform

An AI-powered career counseling chatbot web application that helps users set career goals, get personalized advice, and navigate their career journey.

## 🎯 Project Structure

```
Career-Counselling-Platform/
│
├── server.js              (Express server - entry point)
├── package.json           (Project dependencies)
├── package-lock.json      (Dependency lock file)
├── .gitignore            (Git ignore rules)
│
├── public/               (Frontend files)
│   ├── index.html        (Home page)
│   ├── get-started.html  (Get started page)
│   ├── set-goals.html    (Career goals page)
│   ├── styles.css        (Styling)
│   └── script.js         (JavaScript functionality)
│
└── README.md            (This file)
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Start the development server:**
```bash
npm start
```

3. **Open in browser:**
```
http://localhost:3000
```

## ✨ Features

### 🤖 CareerBot Chatbot
- AI-powered career guidance using Gemini API
- Fallback to mock responses if API is unavailable
- Page-specific welcome messages
- Real-time chat interface
- Clear chat history option

### 📋 Career Goals Management
- Set career goals with field, experience level, and notes
- View all saved goals
- Delete goals
- Auto-save to localStorage
- Backend API integration

### 💼 Career Planning
- Personalized career recommendations
- Resume building tips
- Job search guidance
- Skills development suggestions

### 📱 Responsive Design
- Mobile-friendly interface
- Adaptive layouts
- Touch-optimized navigation

## 🛠️ API Endpoints

### GET `/api/career-goals`
Retrieve all saved career goals.

**Response:**
```json
{
  "careerGoals": [
    {
      "careerField": "Software Engineering",
      "experienceLevel": "Entry-Level",
      "notes": "Interested in backend development"
    }
  ]
}
```

### POST `/api/career-goals`
Create a new career goal.

**Request Body:**
```json
{
  "careerField": "string",
  "experienceLevel": "string",
  "notes": "string (optional)"
}
```

### DELETE `/api/career-goals/:index`
Delete a career goal by index.

**Response:**
```json
{
  "careerGoals": []
}
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
GEMINI_API_KEY=your_api_key_here
```

### Port
- Default: `3000`
- Can be changed via `PORT` environment variable
- Automatically uses `process.env.PORT` for deployment platforms

## 📦 Dependencies

- **express**: Web framework for Node.js
- **cors**: Enable Cross-Origin Resource Sharing
- **path**: Node.js path utilities

## 🚁 Deployment

### Render
1. Push code to GitHub
2. Connect repository to Render
3. Set `Root Directory` to root if server.js is at root
4. Render will automatically:
   - Run `npm install`
   - Run `npm start`

### Environment Setup
- Render detects `PORT` environment variable
- Ensure `.gitignore` excludes `node_modules/`
- All dependencies must be in `package.json`

## 📝 File Descriptions

### `server.js`
- Main entry point for the application
- Sets up Express server
- Defines API routes
- Serves static files from `public/` folder
- Handles CORS and JSON parsing

### `public/index.html`
- Home page with hero section
- Feature cards
- Career goals form
- ChatBot widget

### `public/styles.css`
- All CSS styling for the application
- Responsive design with media queries
- Chatbot UI styling
- Form and button styling

### `public/script.js`
- Frontend JavaScript logic
- ChatBot functionality
- Career goals management
- Local storage integration
- Gemini API integration

## 🔐 Security Notes

- API keys should be stored in `.env` file
- Don't commit `.env` to repository
- Use environment variables for sensitive data

## 🐛 Common Issues

### "Cannot find module 'cors'"
```bash
npm install cors
```

### Server won't start
- Check if port is already in use
- Ensure `server.js` exists at root
- Run `npm install` to install dependencies

### Static files not loading
- Ensure all frontend files are in `public/` folder
- Check that `server.js` uses `path.join(__dirname, 'public')`
- Clear browser cache

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements.

## 📧 Contact

For questions or suggestions, please reach out through the contact form on the website.

---

**Built with ❤️ for career growth**
