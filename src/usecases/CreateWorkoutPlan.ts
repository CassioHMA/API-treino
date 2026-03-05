import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";
import { CreateWorkoutPlanData, WorkoutPlanData } from "../schemas/index.js";

export interface CreateWorkoutPlanInput extends CreateWorkoutPlanData {
  userId: string;
}

export class CreateWorkoutPlan {
  async execute(dto: CreateWorkoutPlanInput): Promise<WorkoutPlanData> {
    const existingWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: { isActive: true },
    });

    return prisma.$transaction(async (tx) => {
      // Inativa o plano atual se existir
      if (existingWorkoutPlan) {
        await tx.workoutPlan.update({
          where: { id: existingWorkoutPlan.id },
          data: { isActive: false },
        });
      }

      // Cria o novo plano de treino
      const workoutPlan = await tx.workoutPlan.create({
        data: {
          name: dto.name,
          userId: dto.userId,
          isActive: true,
          workoutDays: {
            create: dto.workoutDays.map((day) => ({
              name: day.name,
              weekday: day.weekDay,
              isRest: day.isRest,
              estimatedDurationInSeconds: day.estimatedDurationInSeconds,
              coverImageUrl: day.coverImageUrl,
              exercises: {
                create: day.exercises.map((exercise) => ({
                  name: exercise.name,
                  order: exercise.order,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  restTimeInSeconds: exercise.restTimeInSeconds,
                })),
              },
            })),
          },
        },
      });

      // Busca o resultado completo para retorno
      const result = await tx.workoutPlan.findUnique({
        where: { id: workoutPlan.id },
        include: {
          workoutDays: {
            include: { exercises: true },
          },
        },
      });

      if (!result) {
        throw new NotFoundError("Workout plan not found after creation");
      }

      // Mapeia o resultado para o DTO de saída
      return {
        id: result.id,
        name: result.name,
        workoutDays: result.workoutDays.map((day) => ({
          name: day.name,
          weekDay: day.weekday,
          isRest: day.isRest,
          estimatedDurationInSeconds: day.estimatedDurationInSeconds,
          coverImageUrl: day.coverImageUrl ?? undefined,
          exercises: day.exercises.map((ex) => ({
            name: ex.name,
            order: ex.order,
            sets: ex.sets,
            reps: ex.reps,
            restTimeInSeconds: ex.restTimeInSeconds,
          })),
        })),
      };
    });
  }
}
