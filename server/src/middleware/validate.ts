import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Middleware factory that enforces strict DTO whitelisting.
 * Any property not explicitly defined in the schema will be rejected (or stripped),
 * completely preventing Mass Assignment / Over-posting vulnerabilities.
 */
export const validateBody = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parse with strict validation
      const validatedData = await schema.parseAsync(req.body);
      // Replace req.body with the strictly sanitized and whitelisted object
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          rule: err.code,
        }));

        res.status(400).json({
          error: 'Validation Error: Invalid or forbidden payload fields provided.',
          details: formattedErrors,
        });
        return;
      }

      res.status(400).json({ error: 'Malformed request payload.' });
    }
  };
};

// ─── AUTH DTOs ─────────────────────────────────────────────────────────────
export const RegisterDTOSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
    email: z.string().trim().toLowerCase().email('Invalid email address format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(72, 'Password cannot exceed 72 characters (bcrypt limit)')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    companyName: z.string().trim().min(2).max(100).optional(),
  })
  .strict(); // Rejects any extra fields (e.g. role, points, isSuperAdmin)

export const LoginDTOSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Invalid email address format'),
    password: z.string().min(1, 'Password is required').max(100),
  })
  .strict();

// ─── SYNC DTOs ─────────────────────────────────────────────────────────────
export const SyncDTOSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    activeMinutes: z.number().int().min(0).max(1440, 'Active minutes cannot exceed 1440 per day'),
    idleMinutes: z.number().int().min(0).max(1440, 'Idle minutes cannot exceed 1440 per day'),
    breaksCompleted: z.number().int().min(0).max(100, 'Breaks completed cannot exceed 100 per day'),
    waterIntakeMl: z.number().int().min(0).max(15000, 'Water intake cannot exceed 15000ml per day'),
    pointsEarned: z.number().int().min(0).max(1000, 'Points earned cannot exceed 1000 per sync batch'),
  })
  .strict(); // Whitelist: user CANNOT update role, points balance directly, or other users' data!

// ─── LICENSE DTOs ──────────────────────────────────────────────────────────
export const VerifyLicenseDTOSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(10, 'License key too short')
      .max(40, 'License key too long')
      .regex(/^[A-Za-z0-9_-]+$/, 'License key contains invalid characters'),
  })
  .strict();

// ─── CHECKOUT DTOs ─────────────────────────────────────────────────────────
export const CreateCheckoutDTOSchema = z
  .object({
    plan: z.enum(['monthly', 'yearly', 'team'], {
      errorMap: () => ({ message: 'Plan must be one of: monthly, yearly, team' }),
    }),
  })
  .strict();
