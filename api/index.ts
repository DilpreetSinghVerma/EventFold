import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
    try {
        // Dynamically import the express app to catch any top-level initialization errors
        const { default: app } = await import("../server/index.js");
        return app(req, res);
    } catch (error: any) {
        console.error("FATAL API BOOT ERROR:", error);

        // Send the crash directly to the client instead of dying inside Vercel's lambda container
        return res.status(500).json({
            error: "API Initialization Failed",
            message: error.message || String(error),
            stack: error.stack,
            type: "BootCrash"
        });
    }
}
