// Custom schemas for the form-data received from the client (Using Zod)
import { z } from "zod";

const UserSignUpZodSchema = z.object({
  firstname: z.string(),
  lastname: z.string().optional().or(z.undefined()),
  email: z.string().email(),
  password: z.string(),
});

const UserSignInZodSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export { UserSignUpZodSchema,UserSignInZodSchema };
