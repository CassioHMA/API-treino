import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { NotFoundError } from "../errors/index.js";
import { auth } from "../lib/auth.js";
import { ErrorSchema, createWorkoutPlanSchema, workoutPlanSchema } from "../schemas/index.js";
import { CreateWorkoutPlan } from "../usecases/CreateWorkoutPlan.js";

const workoutPlanRoutes = async (app: FastifyInstance) => {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: "POST",
        url: "/",
        schema: {
          body: createWorkoutPlanSchema,
          response: {
            201: workoutPlanSchema,
            400: ErrorSchema,
            401: ErrorSchema,
            404: ErrorSchema,
            500: ErrorSchema,
          },
        },
        handler: async (request, reply) => {
          try {
            const session = await auth.api.getSession({
              headers: fromNodeHeaders(request.headers)
            });

            if (!session) {
              return reply.status(401).send({
                error: "Unauthorized",
                code: "UNAUTHORIZED",
              });
            }

            const { name, workoutDays } = request.body;

            const createWorkoutPlan = new CreateWorkoutPlan();
            const result = await createWorkoutPlan.execute({
              userId: session.user.id,
              name,
              workoutDays,
            });
        
            return reply.status(201).send(result);
          } catch (error) {
            app.log.error(error);
            if (error instanceof NotFoundError){
              return reply.status(404).send({
                error: error.message,
                code: "NOT_FOUND_ERROR",
              });
            }
            return reply.status(500).send({
              error: "Internal server error",
              code: "INTERNAL_SERVER_ERROR",
            });
          }
        },
    });
};

export default workoutPlanRoutes;
