import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";
import { model } from "src/config/langChain.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { HttpMethod } from "generated/prisma/enums.js";
import SwaggerParser from "@apidevtools/swagger-parser";
import { extractTextFromPdfUrl } from "src/config/pdf.js";

interface ExtractedTool {
	name: string;
	description: string;
	method: HttpMethod;
	path: string;
	parameters: ToolParameter[];
	responseSchema: Record<string, any>;
}

interface ToolParameter {
	name: string;
	type: string;
	required: boolean;
	location: "path" | "query" | "body" | "header";
	description: string;
}

export async function extractToolsFromDocument(
	documentId: string,
	organizationId: string,
	fileUrlOrSwaggerUrl: string,
	documentType: string,
): Promise<void> {
	const apiConfig = await prisma.businessApiConfig.findUnique({
		where: { organizationId },
	});

	if (!apiConfig || !apiConfig.isVerified) {
		throw new AppError(
			"You must configure and verify your API connection before extracting tools.",
			400,
		);
	}

	let tools: ExtractedTool[] = [];

	if (documentType === "SWAGGER_URL") {
		tools = await extractFromSwaggerUrl(fileUrlOrSwaggerUrl);
	} else if (documentType === "API_DOC") {
		tools = await extractFromApiDocument(fileUrlOrSwaggerUrl);
	} else {
		throw new AppError(
			`Unsupported document type for tool extraction: ${documentType}`,
			400,
		);
	}

	if (tools.length === 0) {
		await prisma.knowledgeDocument.update({
			where: { id: documentId },
			data: { status: "FAILED" },
		});
		throw new AppError("No tools could be extracted from this document.", 400);
	}

	await saveTools(tools, documentId, organizationId, apiConfig.id);
}

async function extractFromSwaggerUrl(url: string): Promise<ExtractedTool[]> {
	let api: any;

	try {
		api = await SwaggerParser.validate(url);
	} catch (err) {
		throw new AppError(
			`Failed to parse Swagger/OpenAPI spec at ${url}. Make sure it is a valid OpenAPI JSON or YAML file.`,
			400,
		);
	}

	const tools: ExtractedTool[] = [];
	const paths = api.paths || {};

	for (const [path, pathItem] of Object.entries(paths) as [string, any][]) {
		const methods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

		for (const method of methods) {
			const operation = pathItem[method.toLowerCase()];
			if (!operation) continue;
			if (operation.deprecated === true) continue;

			const name = operation.operationId
				? sanitizeToolName(operation.operationId)
				: sanitizeToolName(`${method.toLowerCase()}_${path}`);

			const description =
				operation.summary || operation.description || `${method} ${path}`;

			const parameters: ToolParameter[] = [];

			const rawParams = operation.parameters || pathItem.parameters || [];
			for (const param of rawParams) {
				parameters.push({
					name: param.name,
					type: param.schema?.type || param.type || "string",
					required: param.required ?? false,
					location: param.in as ToolParameter["location"],
					description: param.description || "",
				});
			}

			if (operation.requestBody) {
				const content =
					operation.requestBody.content?.["application/json"] ||
					operation.requestBody.content?.["application/x-www-form-urlencoded"];

				if (content?.schema?.properties) {
					const required = content.schema.required || [];
					for (const [propName, propSchema] of Object.entries(
						content.schema.properties,
					) as [string, any][]) {
						parameters.push({
							name: propName,
							type: propSchema.type || "string",
							required: required.includes(propName),
							location: "body",
							description: propSchema.description || "",
						});
					}
				}
			}

			const responseSchema =
				operation.responses?.["200"]?.content?.["application/json"]?.schema ||
				operation.responses?.["201"]?.content?.["application/json"]?.schema ||
				{};

			tools.push({
				name,
				description,
				method: method as HttpMethod,
				path,
				parameters,
				responseSchema,
			});
		}
	}

	return tools;
}

async function extractFromApiDocument(
	fileUrl: string,
): Promise<ExtractedTool[]> {
	let documentText: string;
	try {
		documentText = await extractTextFromPdfUrl(fileUrl);
	} catch (err) {
		throw new AppError(
			"Failed to extract text from API documentation file.",
			400,
		);
	}

	if (!documentText || documentText.trim().length === 0) {
		throw new AppError("The uploaded document appears to be empty.", 400);
	}

	const truncated = documentText.slice(0, 12000);

	const response = await model.invoke([
		new SystemMessage(`
You are an API documentation parser. Your job is to extract all API endpoints from the provided documentation and return them as structured JSON.

For each endpoint extract:
- name: a camelCase function name describing what it does (e.g. "getOrderById", "createProduct")
- description: what this endpoint does in one sentence
- method: HTTP method (GET, POST, PUT, PATCH, DELETE)
- path: the URL path (e.g. "/orders/{orderId}")
- parameters: array of parameters with name, type, required (boolean), location ("path", "query", "body", "header"), description
- responseSchema: a simple object describing what the response looks like

Return ONLY a JSON array. No markdown, no explanation, no code fences.
Example:
[
  {
    "name": "getOrderById",
    "description": "Retrieves a specific order by its ID",
    "method": "GET",
    "path": "/orders/{orderId}",
    "parameters": [
      {
        "name": "orderId",
        "type": "string",
        "required": true,
        "location": "path",
        "description": "The unique order identifier"
      }
    ],
    "responseSchema": {
      "id": "string",
      "status": "string",
      "total": "number"
    }
  }
]
    `),
		new HumanMessage(
			`Extract all API endpoints from this documentation:\n\n${truncated}`,
		),
	]);

	const raw =
		typeof response.content === "string"
			? response.content
			: (response.content[0] as { text: string }).text;

	let parsed: any[];
	try {
		const cleaned = raw.replace(/```json|```/g, "").trim();
		parsed = JSON.parse(cleaned);
	} catch {
		throw new AppError(
			"Failed to parse tool definitions from document. The document may not contain valid API documentation.",
			400,
		);
	}

	if (!Array.isArray(parsed)) {
		throw new AppError(
			"Unexpected response format from extraction agent.",
			500,
		);
	}

	return parsed
		.filter((t) => t.name && t.method && t.path)
		.map((t) => ({
			name: sanitizeToolName(t.name),
			description: t.description || `${t.method} ${t.path}`,
			method: t.method.toUpperCase() as HttpMethod,
			path: t.path,
			parameters: Array.isArray(t.parameters) ? t.parameters : [],
			responseSchema: t.responseSchema || {},
		}));
}

async function saveTools(
	tools: ExtractedTool[],
	documentId: string,
	organizationId: string,
	apiConfigId: string,
): Promise<void> {
	await prisma.toolDefinition.deleteMany({
		where: { documentId },
	});

	await prisma.toolDefinition.createMany({
		data: tools.map((tool) => ({
			organizationId,
			apiConfigId,
			documentId,
			name: tool.name,
			description: tool.description,
			method: tool.method,
			path: tool.path,
			parameters: tool.parameters,
			responseSchema: tool.responseSchema,
			isActive: true,
		})),
	});

	const total = tools.length;
	await prisma.knowledgeDocument.update({
		where: { id: documentId },
		data: {
			status: "READY",
			toolCount: total,
			activeToolCount: total,
			disabledToolCount: 0,
		},
	});
}

function sanitizeToolName(name: string): string {
	return name
		.replace(/[^a-zA-Z0-9_\s-]/g, "")
		.replace(/[-\s]+(.)/g, (_, c) => c.toUpperCase())
		.replace(/^[^a-zA-Z]+/, "")
		.trim();
}
