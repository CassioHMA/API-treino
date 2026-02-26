import "dotenv/config";

//ESM
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { z } from "zod";
const app = Fastify({
  logger: true,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/",
  schema: {
    description: "teste de rota",
    tags: ["hello"],
    response: {
      200: z.object({
        message: z.string().min(4),
      }),
    },
  },
  handler: () => {
    return { message: "Teste de rota" };
  },
});
// Run the server!
try {
  await app.listen({ port: Number(process.env.PORT || 8081) });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
