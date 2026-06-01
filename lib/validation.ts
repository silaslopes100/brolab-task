import { z } from "zod"

export const LoginSchema = z.object({
  email: z.string().min(1, "Email/username obrigatório"),
  password: z.string().min(1, "Senha obrigatória"),
})

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().optional().default(""),
  columnId: z.string().optional(),
  position: z.number().optional(),
  assignees: z.array(z.string()).optional().default([]),
  labels: z.array(z.object({ name: z.string(), color: z.string().optional() })).optional().default([]),
})

export const UpdateTaskSchema = z.object({
  id: z.string().uuid("ID inválido"),
  title: z.string().optional(),
  description: z.string().optional(),
  columnId: z.string().optional(),
  position: z.number().optional(),
  assignees: z.array(z.string()).optional(),
  labels: z.array(z.object({ name: z.string(), color: z.string().optional() })).optional(),
})

export const DeleteTaskSchema = z.object({
  id: z.string().uuid("ID inválido"),
})

export const CreateUserSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  username: z.string().min(1, "Username obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(4, "Senha deve ter no mínimo 4 caracteres"),
  role: z.string().optional(),
})

export const UpdateUserSchema = z.object({
  id: z.string().uuid("ID inválido"),
  name: z.string().optional(),
  username: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  password: z.string().min(4).optional(),
  role: z.string().optional(),
})

export const CreateCommentSchema = z.object({
  taskId: z.string().uuid("Task ID inválido").optional(),
  subtaskId: z.string().uuid("Subtask ID inválido").optional(),
  authorUsername: z.string().min(1, "Author obrigatório"),
  content: z.string().min(1, "Conteúdo obrigatório"),
}).refine((data) => data.taskId || data.subtaskId, {
  message: "taskId ou subtaskId obrigatório",
})

export const CreateColumnSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  position: z.number().optional(),
})

export const CreateLabelSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  color: z.string().optional(),
})

export const CreateSubtaskSchema = z.object({
  taskId: z.string().uuid("Task ID inválido"),
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().optional().default(""),
  estimatedHours: z.number().optional().default(0),
  position: z.number().optional().default(0),
})

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { data?: T; error?: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const firstError = result.error.errors[0]
    return { error: `ERRO: ${firstError.path.join(".")} - ${firstError.message}` }
  }
  return { data: result.data }
}
