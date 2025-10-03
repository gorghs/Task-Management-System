
# API Design

This document outlines the RESTful API for the Task Management system.

## User Management

### Register a new user

*   **Endpoint:** `POST /v1/auth/register`
*   **Request Body:**
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "password": "password123"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "message": "Registration successful. Please log in.",
      "user": {
        "user_id": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "registration_date": "2025-10-02T10:00:00.000Z"
      }
    }
    ```

### Login

*   **Endpoint:** `POST /v1/auth/login`
*   **Request Body:**
    ```json
    {
      "email": "john.doe@example.com",
      "password": "password123"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Login successful.",
      "token": "your_jwt_token",
      "user_id": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
      "name": "John Doe"
    }
    ```

## Task Management

### Create a new task

*   **Endpoint:** `POST /v1/tasks`
*   **Authentication:** Bearer Token
*   **Request Body:**
    ```json
    {
      "title": "Implement caching",
      "description": "Use Redis to cache frequently accessed data.",
      "priority": "high",
      "due_date": "2025-10-10"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "message": "Task created successfully.",
      "task": {
        "task_id": "t1a2s3k4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
        "assigned_user_id": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
        "title": "Implement caching",
        "description": "Use Redis to cache frequently accessed data.",
        "status": "pending",
        "priority": "high",
        "due_date": "2025-10-10T00:00:00.000Z",
        "created_at": "2025-10-02T10:30:00.000Z",
        "updated_at": "2025-10-02T10:30:00.000Z",
        "version": 1
      }
    }
    ```

### Get tasks

*   **Endpoint:** `GET /v1/tasks`
*   **Authentication:** Bearer Token
*   **Query Parameters:**
    *   `status`: `pending`, `in-progress`, `completed`
    *   `priority`: `low`, `medium`, `high`
    *   `sortField`: `due_date`, `created_at`
    *   `sortOrder`: `asc`, `desc`
    *   `limit`: number (e.g., 10)
    *   `after`: cursor for keyset pagination
*   **Response (200 OK):**
    ```json
    {
      "tasks": [
        {
          "task_id": "t1a2s3k4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
          "title": "Implement caching",
          "description": "Use Redis to cache frequently accessed data.",
          "status": "pending",
          "priority": "high",
          "due_date": "2025-10-10T00:00:00.000Z",
          "created_at": "2025-10-02T10:30:00.000Z",
          "version": 1
        }
      ],
      "pagination": {
        "limit": "10",
        "next_cursor": "MjAyNS0xMC0xMFQwMDowMDowMC4wMDBaLHQxYTJzM2s0LWU1ZjYtZzdoOC1pOWowLWsxbDJtM240bzVwNg=="
      }
    }
    ```

### Update task status

*   **Endpoint:** `PATCH /v1/tasks/:taskId/status`
*   **Authentication:** Bearer Token
*   **Request Body:**
    ```json
    {
      "status": "in-progress",
      "version": 1
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Task status updated successfully.",
      "updatedTask": {
        "task_id": "t1a2s3k4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
        "version": 2,
        "status": "in-progress"
      }
    }
    ```

## Analytics

### Get user leaderboard

*   **Endpoint:** `GET /v1/analytics/leaderboard`
*   **Authentication:** Bearer Token
*   **Response (200 OK):**
    ```json
    {
      "leaderboard": [
        {
          "user_id": "u1s2e3r4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
          "name": "Jane Smith",
          "completed_tasks": 50
        },
        {
          "user_id": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
          "name": "John Doe",
          "completed_tasks": 42
        }
      ]
    }
    ```
