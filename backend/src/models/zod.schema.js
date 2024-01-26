// Custom schemas for the form-data received from the client (Using Zod)
import { z } from "zod";

const UserZodSchema = z.object({
  firstname: z.string(),
  lastname: z.string().optional().or(z.undefined()),
  email: z.string().email(),
  password: z.string(),
});

export { UserZodSchema };
