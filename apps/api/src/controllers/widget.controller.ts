import type { Request, Response } from "express";
import { widgetInitService } from "src/services/widget.service.js";

export const widgetInitController = async (req: Request, res: Response) => {
  try {
    const rawApiKey = req.headers["x-api-key"] as string;
    const origin = req.headers["origin"] as string;
    const { customerToken } = req.body;

    if (!rawApiKey) {
      return res.status(401).json({ error: "Missing API key" });
    }

    const result = await widgetInitService({
      rawApiKey,
      origin,
      customerToken,
    });
    console.log(result);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status)
      return res.status(error.status).json({ error: error.message });
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
