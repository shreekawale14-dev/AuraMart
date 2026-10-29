import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map(err => ({
          field: err.path.join('.').replace(/^(body|query|params)\.?/, ''),
          message: err.message
        }));

        res.status(400).json({
          success: false,
          message: issues[0]?.message || 'Validation failed',
          errors: issues
        });
        return;
      }
      next(error);
    }
  };
};

