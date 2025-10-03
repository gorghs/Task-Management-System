const db = require('../db/db');
const redisClient = require('../db/redis');

// --- Task Creation ---
async function createTask(userId, title, description, priority, dueDate) {
  const query = `
        INSERT INTO tasks (assigned_user_id, title, description, priority, due_date) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *
    `;
  const result = await db.query(query, [userId, title, description, priority, dueDate]);

  // In a production system: Send 'TaskCreated' event to Kafka/Message Queue here
  console.log(`[SIMULATED EVENT] TaskCreated event sent for Task ID: ${result.rows[0].task_id}`);

  return result.rows[0];
}

// --- Task Retrieval (Keyset Pagination & Unique Filter) ---
async function getTasksForUser(userId, filters) {
  const cacheKey = `tasks:${userId}:${JSON.stringify(filters)}`;
  const cachedTasks = await redisClient.get(cacheKey);

  if (cachedTasks) {
    return JSON.parse(cachedTasks);
  }

  // We select the 'version' field here to support the Optimistic Locking flow in the UI
  let query = `
        SELECT task_id, title, description, status, priority, due_date, created_at, version 
        FROM tasks 
        WHERE assigned_user_id = $1
    `;
  const values = [userId];
  let valueIndex = 2;

  // 1. Dynamic Filters
  if (filters.status) {
    query += ` AND status = $${valueIndex++}`;
    values.push(filters.status);
  }
  if (filters.priority) {
    query += ` AND priority = $${valueIndex++}`;
    values.push(filters.priority);
  }

  // **UNIQUE FEATURE: TIME-WARP FILTER (asOfDate)**
  // Filters tasks to only include those created before or on the specified date.
  if (filters.asOfDate) {
    query += ` AND created_at <= $${valueIndex++}`;
    values.push(filters.asOfDate);
  }

  // 2. Sorting and Pagination Setup
  // Ensures we default to an indexed field for efficiency
  const sortField = filters.sortField || 'due_date';
  const sortOrder = filters.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  const limit = parseInt(filters.limit) || 50;

  // 3. Keyset Cursor Logic (HIGH PERFORMANCE PAGINATION)
  if (filters.after) {
    // Keyset format: "lastSortValue,lastTaskId"
    const [lastSortValue, lastTaskId] = filters.after.split(',');

    // This query structure leverages the composite index for fast searching.
    // It skips rows based on the last seen value of the sort field and task_id as a tie-breaker.
    const operator = sortOrder === 'DESC' ? '<' : '>';
    query += ` AND (tasks.${sortField}, tasks.task_id) ${operator} ('${lastSortValue}'::${sortField === 'due_date' ? 'date' : 'timestamp'} , '${lastTaskId}'::UUID)`;
  }

  query += ` ORDER BY ${sortField} ${sortOrder}, task_id ${sortOrder}`;
  query += ` LIMIT ${limit}`;

  const result = await db.query(query, values);

  // Calculate next cursor for the client
  let nextCursor = null;
  if (result.rows.length === limit) {
    const lastTask = result.rows[result.rows.length - 1];
    nextCursor = `${lastTask[sortField]},${lastTask.task_id}`;
  }

  const response = { tasks: result.rows, nextCursor };
  await redisClient.set(cacheKey, JSON.stringify(response), {
    EX: 300 // 5 minutes
  });

  return response;
}

// --- Concurrent Update Handling (Optimistic Locking) ---
async function updateTaskStatus(taskId, userId, newStatus, currentVersion) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN'); // VITAL: Start transaction for atomicity

    // Attempt to update only if the provided version matches the DB version
    const updateQuery = `
            UPDATE tasks 
            SET status = $1, updated_at = CURRENT_TIMESTAMP, version = version + 1 
            WHERE task_id = $2 AND assigned_user_id = $3 AND version = $4
            RETURNING task_id, version, status
        `;

    const result = await client.query(updateQuery, [newStatus, taskId, userId, currentVersion]);

    if (result.rowCount === 0) {
      // Check why the update failed (owner/task not found OR version mismatch)
      const ownerCheck = await client.query('SELECT task_id FROM tasks WHERE task_id = $1 AND assigned_user_id = $2', [taskId, userId]);

      if (ownerCheck.rowCount === 0) {
        throw new Error("Task not found or unauthorized.");
      } else {
        // This is the Optimistic Lock failure: version mismatch
        await client.query('ROLLBACK');
        throw new Error("Concurrent update detected. The task was modified by another user or session. Please refresh and try again.");
      }
    }

    await client.query('COMMIT'); // Commit transaction

    // In a production system: Send 'TaskStatusUpdated' event
    console.log(`[SIMULATED EVENT] TaskStatusUpdated event sent for Task ID: ${taskId}`);

    return result.rows[0]; // Return the updated status and new version

  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// --- Get single task (owned by user) ---
async function getTaskById(userId, taskId) {
  const query = `
        SELECT task_id, title, description, status, priority, due_date, created_at, updated_at, version
        FROM tasks
        WHERE task_id = $1 AND assigned_user_id = $2
    `;
  const result = await db.query(query, [taskId, userId]);
  return result.rows[0] || null;
}

// --- Update task fields (title, description, priority, due_date) ---
async function updateTask(taskId, userId, fields) {
  const allowed = ['title', 'description', 'priority', 'due_date'];
  const keys = Object.keys(fields).filter(k => allowed.includes(k));
  if (keys.length === 0) {
    throw new Error('No valid fields provided for update.');
  }

  const setClauses = keys.map((k, idx) => `${k} = $${idx + 1}`);
  const values = keys.map(k => fields[k]);
  values.push(taskId, userId);

  const query = `
        UPDATE tasks
        SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE task_id = $${keys.length + 1} AND assigned_user_id = $${keys.length + 2}
        RETURNING *
    `;
  const result = await db.query(query, values);
  if (result.rowCount === 0) {
    throw new Error('Task not found or unauthorized');
  }
  return result.rows[0];
}

// --- Delete task ---
async function deleteTask(taskId, userId) {
  const result = await db.query('DELETE FROM tasks WHERE task_id = $1 AND assigned_user_id = $2', [taskId, userId]);
  if (result.rowCount === 0) {
    throw new Error('Task not found or unauthorized');
  }
  return true;
}

module.exports = { createTask, getTasksForUser, updateTaskStatus, getTaskById, updateTask, deleteTask };
