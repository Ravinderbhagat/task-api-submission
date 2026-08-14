const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task Routes Integration', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('POST /tasks', () => {
    it('should create a new task on happy path', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Integration Task', priority: 'high' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Integration Task');
      expect(res.body.id).toBeDefined();
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ description: 'No title here' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 if priority is invalid', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Title', priority: 'super-high' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /tasks', () => {
    it('should return all tasks on happy path', async () => {
      taskService.create({ title: 'Task 1' });
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('should return empty array if no tasks exist', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should support pagination ?page=1&limit=2 (1-based indexing)', async () => {
      taskService.create({ title: 'T1' });
      taskService.create({ title: 'T2' });
      taskService.create({ title: 'T3' });
      const res = await request(app).get('/tasks?page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].title).toBe('T1');
      expect(res.body[1].title).toBe('T2');
    });

    it('should support combining status filtering and pagination', async () => {
      taskService.create({ title: 'T1', status: 'todo' });
      taskService.create({ title: 'T2', status: 'todo' });
      taskService.create({ title: 'T3', status: 'done' });
      const res = await request(app).get('/tasks?status=todo&page=1&limit=1');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('T1');
    });

    it('should return empty array for non-matching status filtering', async () => {
      const res = await request(app).get('/tasks?status=in_progress');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update a task on happy path', async () => {
      const task = taskService.create({ title: 'Old Title' });
      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: 'New Title', status: 'done' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New Title');
      expect(res.body.status).toBe('done');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .put('/tasks/invalid-id')
        .send({ title: 'New Title' });
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid payload (e.g. invalid status)', async () => {
      const task = taskService.create({ title: 'Task' });
      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ status: 'invalid-status' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task and return 204', async () => {
      const task = taskService.create({ title: 'Task to delete' });
      const res = await request(app).delete(`/tasks/${task.id}`);
      expect(res.status).toBe(204);
      expect(taskService.getAll().length).toBe(0);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app).delete('/tasks/invalid-id');
      expect(res.status).toBe(404);
    });

    it('should return 404 when trying to delete already deleted task', async () => {
      const task = taskService.create({ title: 'Task' });
      await request(app).delete(`/tasks/${task.id}`);
      const res = await request(app).delete(`/tasks/${task.id}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    it('should mark a task complete and preserve its priority', async () => {
      const task = taskService.create({ title: 'Task', priority: 'high' });
      const res = await request(app).patch(`/tasks/${task.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.priority).toBe('high');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app).patch('/tasks/invalid-id/complete');
      expect(res.status).toBe(404);
    });

    it('should still return 200 if already completed', async () => {
      const task = taskService.create({ title: 'Task', status: 'done' });
      const res = await request(app).patch(`/tasks/${task.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
    });
  });

  describe('GET /tasks/stats', () => {
    it('should return stats object on happy path', async () => {
      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('todo');
      expect(res.body).toHaveProperty('in_progress');
      expect(res.body).toHaveProperty('done');
      expect(res.body).toHaveProperty('overdue');
    });

    it('should correctly reflect task state in stats', async () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'done' });
      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body.todo).toBe(1);
      expect(res.body.done).toBe(1);
    });
    
    it('should return 404 if hitting /stats directly without /tasks prefix', async () => {
      const res = await request(app).get('/stats');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    it('should assign a task and return the updated task', async () => {
      const create = await request(app).post('/tasks').send({ title: 'Task 1' });
      const res = await request(app)
        .patch(`/tasks/${create.body.id}/assign`)
        .send({ assignee: 'Ravinder' });
      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('Ravinder');
    });

    it('should return 400 for empty assignee', async () => {
      const create = await request(app).post('/tasks').send({ title: 'Task 1' });
      const res = await request(app)
        .patch(`/tasks/${create.body.id}/assign`)
        .send({ assignee: '' });
      expect(res.status).toBe(400);
    });

    it('should return 404 for nonexistent task', async () => {
      const res = await request(app)
        .patch('/tasks/fake-id/assign')
        .send({ assignee: 'Ravinder' });
      expect(res.status).toBe(404);
    });
  });
});
