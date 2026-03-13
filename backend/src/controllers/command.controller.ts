import { Request, Response } from 'express';
import { commandService } from "../services/command.service";

export const commandController = {
    handle: async (req: Request, res: Response) => {
        const { input, userId: bodyUserId } = req.body;
        const headerUserId = req.headers['x-user-id'] as string;

        
        const userId = bodyUserId || headerUserId || '000000000000000000000000';

        try {
            const result = await commandService.execute(input, userId);
            res.json(result);
        } catch (error) {
            console.error("CLI Error:", error);
            res.status(500).json({
                error: "Erro interno ao processar comando",
                details: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }
    }
};