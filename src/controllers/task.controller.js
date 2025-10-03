const taskService = require('../services/task.service');

// Controller for POST /v1/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, due_date } = req.body;
    const assigned_user_id = req.user.user_id; // Get user ID from Auth Middleware

    if (!title || !priority || !due_date) {
      return res.status(400).json({ message: 'Title, priority, and due_date are required fields.' });
    }

    const task = await taskService.createTask(assigned_user_id, title, description, priority, due_date);
    res.status(201).json({ message: 'Task created successfully.', task });
  } catch (error) {
    console.error('Task creation failed:', error);
    res.status(500).json({ message: 'Failed to create task.', error: error.message });
  }
};

// Controller for GET /v1/tasks (The complex retrieval endpoint)
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // The service handles all filtering, sorting, and pagination logic from query params
    const filters = req.query;

    const { tasks, nextCursor } = await taskService.getTasksForUser(userId, filters);

    const pagination = {
      limit: filters.limit,
      next_cursor: nextCursor,
    };

    // Custom messaging for the unique feature
    const info = filters.asOfDate
      ? `Results filtered by unique "Time-Warp" filter: showing tasks created up to ${filters.asOfDate}.`
      : null;

    res.status(200).json({
      tasks,
      pagination,
      ...(info && { info })
    });
  } catch (error) {
    console.error('Task retrieval failed:', error);
    res.status(500).json({ message: 'Failed to retrieve tasks.', error: error.message });
  }
};

// Controller for PATCH /v1/tasks/:taskId/status (Concurrency Handling API)
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.user_id;
    const { status, version } = req.body; // Expect version from client for locking

    if (!status || version === undefined) {
      return res.status(400).json({ message: 'Status and the current version number are required.' });
    }

    const updatedTask = await taskService.updateTaskStatus(taskId, userId, status, version);
    res.status(200).json({ message: 'Task status updated successfully.', updatedTask });

  } catch (error) {
    // Handle specific error codes from the service layer
    if (error.message.includes('Concurrent update detected')) {
      return res.status(409).json({ message: error.message }); // HTTP 409 Conflict
    }
    if (error.message.includes('Task not found or unauthorized')) {
      return res.status(404).json({ message: error.message });
    }
    console.error('Task status update failed:', error);
    res.status(500).json({ message: 'Failed to update task status.', error: error.message });
  }
};

// Controller for GET /v1/tasks/:taskId
exports.getTaskById = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { taskId } = req.params;
    const task = await taskService.getTaskById(userId, taskId);
    if (!task) return res.status(404).json({ message: 'Task not found or unauthorized' });
    res.status(200).json({ task });
  } catch (error) {
    console.error('Get task failed:', error);
    res.status(500).json({ message: 'Failed to get task.', error: error.message });
  }
};

// Controller for PATCH /v1/tasks/:taskId
exports.updateTask = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { taskId } = req.params;
    const fields = req.body;
    const updated = await taskService.updateTask(taskId, userId, fields);
    res.status(200).json({ message: 'Task updated successfully.', task: updated });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    console.error('Update task failed:', error);
    res.status(400).json({ message: 'Failed to update task.', error: error.message });
  }
};

// Controller for DELETE /v1/tasks/:taskId
exports.deleteTask = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { taskId } = req.params;
    await taskService.deleteTask(taskId, userId);
    res.status(204).send();
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    console.error('Delete task failed:', error);
    res.status(400).json({ message: 'Failed to delete task.', error: error.message });
  }
};
