import { Weekday } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

//Data transfer object
interface InputDto {
  userId: string;
  name: string;
  workoutDay: Array<{
    name: string;
    weekday: Weekday;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    exercises: Array<{
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }>;
  }>;
}

//export interface OutputDto {
//    id: string;
//}


export class CreateWorkoutPlan {
  async execute(dto: InputDto) {
    const existingWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        isActive: true,
      },
    });
    return prisma.$transaction(async (tx) => {
        if (existingWorkoutPlan) {
          await tx.workoutPlan.update({
            where: { id: existingWorkoutPlan.id },
            data: { isActive: false },
          });
        }
      
        const result = await tx.workoutPlan.create({
          data: {
            userId: dto.userId,
            name: dto.name,
            isActive: true,
            workoutday: {
              create: dto.workoutDay.map((workoutDay) => ({
                name: workoutDay.name,
                weekday: workoutDay.weekday,
                isRest: workoutDay.isRest,
                estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
                exercises: {
                  create: workoutDay.exercises.map((exercise) => ({
                    order: exercise.order,
                    name: exercise.name,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    restTimeInSeconds: exercise.restTimeInSeconds,
                  })),
                },
              })),
            },
          },
          include: {
            workoutday: {
              include: {
                exercises: true,
              },
            },
          },
        });

      return result;
    });
  }
}
