const taskService = require('../src/services/taskService');

describe('Task Service', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create', () => {
    it('should create a task with default values', () => {
      const task = taskService.create({ title: 'Test Task' });
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task.createdAt).toBeDefined();
    });

    it('should create a task with provided values', () => {
      const task = taskService.create({
        title: 'Custom Task',
        description: 'Desc',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2023-01-01T00:00:00.000Z'
      });
      expect(task.title).toBe('Custom Task');
      expect(task.description).toBe('Desc');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should handle missing optional fields', () => {
      const task = taskService.create({ title: 'Task without description' });
      expect(task.description).toBe('');
      expect(task.status).toBe('todo');
    });
  });

  describe('update', () => {
    it('should update an existing task', () => {
      const task = taskService.create({ title: 'Old Title' });
      const updated = taskService.update(task.id, { title: 'New Title', status: 'done' });
      expect(updated.title).toBe('New Title');
      expect(updated.status).toBe('done');
    });

    it('should return null for non-existent id', () => {
      const updated = taskService.update('invalid-id', { title: 'New Title' });
      expect(updated).toBeNull();
    });

    it('should not modify other fields when updating specific fields', () => {
      const task = taskService.create({ title: 'Task', priority: 'high' });
      const updated = taskService.update(task.id, { status: 'done' });
      expect(updated.priority).toBe('high');
      expect(updated.title).toBe('Task');
    });
  });

  describe('remove', () => {
    it('should remove an existing task', () => {
      const task = taskService.create({ title: 'Task to remove' });
      const result = taskService.remove(task.id);
      expect(result).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    it('should return false for non-existent id', () => {
      const result = taskService.remove('invalid-id');
      expect(result).toBe(false);
    });

    it('should not remove other tasks', () => {
      taskService.create({ title: 'Task 1' });
      const task2 = taskService.create({ title: 'Task 2' });
      taskService.remove('invalid-id');
      expect(taskService.getAll().length).toBe(2);
      taskService.remove(task2.id);
      expect(taskService.getAll().length).toBe(1);
    });
  });

  describe('completeTask', () => {
    it('should mark an existing task as complete and preserve priority', () => {
      const task = taskService.create({ title: 'Task', priority: 'high', status: 'todo' });
      const completed = taskService.completeTask(task.id);
      expect(completed.status).toBe('done');
      expect(completed.priority).toBe('high');
      expect(completed.completedAt).toBeDefined();
    });

    it('should return null for non-existent id', () => {
      const result = taskService.completeTask('invalid-id');
      expect(result).toBeNull();
    });

    it('should update completedAt if already completed', () => {
      const task = taskService.create({ title: 'Task' });
      taskService.completeTask(task.id);
      const secondCompletion = taskService.completeTask(task.id);
      expect(secondCompletion.completedAt).toBeDefined();
    });
  });

  describe('getByStatus', () => {
    it('should return tasks matching the status', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'done' });
      const tasks = taskService.getByStatus('todo');
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Task 1');
    });

    it('should return empty array for non-existent status', () => {
      const tasks = taskService.getByStatus('non-existent');
      expect(tasks.length).toBe(0);
    });

    it('should not match partial status strings', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'done' });
      const tasks = taskService.getByStatus('do');
      expect(tasks.length).toBe(0);
    });
  });

  describe('getPaginated', () => {
    it('should return a paginated list of tasks (1-based indexing)', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      taskService.create({ title: 'Task 3' });
      
      const page1 = taskService.getPaginated(1, 2); 
      expect(page1.length).toBe(2);
      expect(page1[0].title).toBe('Task 1');
      expect(page1[1].title).toBe('Task 2');

      const page2 = taskService.getPaginated(2, 2); 
      expect(page2.length).toBe(1);
      expect(page2[0].title).toBe('Task 3');
    });

    it('should return empty array if page is out of bounds', () => {
      taskService.create({ title: 'Task 1' });
      const tasks = taskService.getPaginated(5, 10);
      expect(tasks.length).toBe(0);
    });

    it('should handle zero limit', () => {
      taskService.create({ title: 'Task 1' });
      const tasks = taskService.getPaginated(1, 0);
      expect(tasks.length).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct stats for mixed tasks', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'in_progress' });
      taskService.create({ title: 'Task 3', status: 'done' });
      taskService.create({ title: 'Task 4', status: 'todo', dueDate: '2000-01-01T00:00:00.000Z' });
      
      const stats = taskService.getStats();
      expect(stats.todo).toBe(2);
      expect(stats.in_progress).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.overdue).toBe(1);
    });

    it('should return zeros for empty state', () => {
      const stats = taskService.getStats();
      expect(stats.todo).toBe(0);
      expect(stats.in_progress).toBe(0);
      expect(stats.done).toBe(0);
      expect(stats.overdue).toBe(0);
    });

    it('should not count done tasks as overdue', () => {
      taskService.create({ title: 'Task 1', status: 'done', dueDate: '2000-01-01T00:00:00.000Z' });
      const stats = taskService.getStats();
      expect(stats.overdue).toBe(0);
    });
  });

  describe('assignTask', () => {
    it('should assign a task to a user', () => {
      const task = taskService.create({ title: 'Task 1' });
      const assigned = taskService.assignTask(task.id, 'Ravinder');
      expect(assigned.assignee).toBe('Ravinder');
    });

    it('should return null for a nonexistent task', () => {
      const result = taskService.assignTask('fake-id', 'Ravinder');
      expect(result).toBeNull();
    });

    it('should allow reassigning an already-assigned task', () => {
      const task = taskService.create({ title: 'Task 1' });
      taskService.assignTask(task.id, 'Ravinder');
      const reassigned = taskService.assignTask(task.id, 'Alex');
      expect(reassigned.assignee).toBe('Alex');
    });
  });
});
