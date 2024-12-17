import express, { Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = express();
const router = Router();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Validation schemas
const TaskSchema = z.object({
  title: z.string().min(1),
  color: z.string().min(1),
  completed: z.boolean().optional(),
});

type RequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Define route handlers
const getTasks: RequestHandler = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

const createTask: RequestHandler = async (req, res, next) => {
  try {
    const validation = TaskSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const task = await prisma.task.create({
      data: validation.data,
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

const updateTask: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('Update request for id:', id);
    console.log('Update data:', req.body);

    // Validate the input
    const validation = TaskSchema.partial().safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error });
      return;
    }

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Create update data with type safety
    const updateData = {
      title: validation.data.title !== undefined 
        ? validation.data.title 
        : existingTask.title,
      color: validation.data.color !== undefined 
        ? validation.data.color 
        : existingTask.color,
      completed: validation.data.completed !== undefined 
        ? validation.data.completed 
        : existingTask.completed,
    };

    // Update the task with properly typed data
    const task = await prisma.task.update({
      where: { id },
      data: updateData
    });

    res.json(task);
  } catch (error) {
    next(error);
  }
};

const deleteTask: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if task exists before deleting
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    await prisma.task.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Apply routes to router, not directly to app
router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Mount router
app.use('/tasks', router);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;