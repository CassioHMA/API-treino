import { z } from "zod";

// Importação do arquivo de enums gerado pelo Prisma
import * as PrismaClientExports from "../generated/prisma/index.js";

const { $Enums } = PrismaClientExports;
const Weekday = $Enums.Weekday;

export const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
});

// Schema base para um dia de treino
const workoutDaySchema = z.object({
  name: z.string().trim().min(1),
  weekDay: z.nativeEnum(Weekday), // Uso correto para Enums
  isRest: z.boolean(),
  estimatedDurationInSeconds: z.number().min(1),
  coverImageUrl: z.string().trim().optional(),
  exercises: z.array(
    z.object({
      order: z.number().min(0),
      name: z.string().trim().min(1),
      sets: z.number().min(1),
      reps: z.number().min(1),
      restTimeInSeconds: z.number().min(1),
    }),
  ),
});

// Schema principal do Plano de Treino
export const workoutPlanSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
  workoutDays: z.array(workoutDaySchema),
});

// Schema específico para criação (omitindo o ID que o banco gera)
export const createWorkoutPlanSchema = workoutPlanSchema.omit({ id: true });

// Tipagens inferidas automaticamente do Zod para evitar duplicação
export type WorkoutPlanData = z.infer<typeof workoutPlanSchema>;
export type CreateWorkoutPlanData = z.infer<typeof createWorkoutPlanSchema>;
