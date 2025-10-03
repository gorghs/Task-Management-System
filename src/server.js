require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const authMiddleware = require('./middleware/auth.middleware');

// Import controllers
const authController = require('./controllers/auth.controller');
const taskController = require('./controllers/task.controller');
const analyticsController = require('./controllers/analytics.controller');

const app = express();

// --- CORS CONFIGURATION (CRITICAL for browser demo) ---
// This middleware allows the browser to make requests from the file:// protocol 
// or any other domain/port to this API.
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));
// --- END CORS CONFIG ---

app.use(express.json());

// =================================================================
// 0. FRONTEND STATIC FILE HOSTING (The Connection Point)
// =================================================================
/* This line connects the frontend to the backend's web server.
When a user navigates to http://localhost:3000/, Express looks in the 
'frontend' directory and serves the index.html file.
*/
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// We use '/health' instead of '/' for a simple check, as '/' now serves index.html
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Task Manager API is operational!', version: '1.0' });
});

// =================================================================
// 1. AUTH ROUTES (Public)
// =================================================================
app.post('/v1/auth/register', authController.register);
app.post('/v1/auth/login', authController.login);


// =================================================================
// 2. TASK ROUTES (Protected by Authentication)
// =================================================================
app.use('/v1/tasks', authMiddleware);

// Task CRUD, Filtering, and Pagination
app.post('/v1/tasks', taskController.createTask);
app.get('/v1/tasks', taskController.getTasks);
app.get('/v1/tasks/:taskId', taskController.getTaskById);
app.patch('/v1/tasks/:taskId', taskController.updateTask);
app.delete('/v1/tasks/:taskId', taskController.deleteTask);

// Task Status Update (Concurrency Handling)
app.patch('/v1/tasks/:taskId/status', taskController.updateTaskStatus);

// =================================================================
// 3. ANALYTICS ROUTES (Protected by Authentication)
// =================================================================
app.get('/v1/analytics/leaderboard', authMiddleware, analyticsController.getLeaderboard);


// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Task Manager API running on port ${PORT}`);
  console.log(`Serving frontend demo from http://localhost:${PORT}/`);
});

