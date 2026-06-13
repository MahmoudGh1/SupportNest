import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options: swaggerJsdoc.Options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "AI Customer Support Platform API",
			version: "1.0.0",
			description: "API documentation",
		},

		servers: [
			{
				url: "api-production-e60c.up.railway.app",
				description: "Development Server",
			},
		],

		components: {
			securitySchemes: {
				cookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: "accessToken",
				},
			},
		},
	},

	apis: [`${__dirname.replace(/\\/g, "/")}/*.ts`, `${__dirname.replace(/\\/g, "/")}/../routes/*.ts`],
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
