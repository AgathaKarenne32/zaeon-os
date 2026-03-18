import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Força o Next.js a sempre buscar dados frescos, nunca usar cache antigo
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Busca os usuários no banco de dados
        const users = await prisma.user.findMany({
            where: {
                // Filtro: Só traz quem já completou o onboarding (tem curso definido)
                course: { not: null },
                name: { not: null }
            },
            select: {
                id: true,
                name: true,
                course: true,
                level: true,
                image: true
            },
            orderBy: {
                level: 'desc' // Gamificação: Os níveis mais altos aparecem primeiro no Mural!
            },
            take: 15 // Limite de performance: Traz no máximo os 15 top perfis para não travar o 3D
        });

        // Formata os dados para o componente do Mural entender perfeitamente
        const formattedProfiles = users.map(user => ({
            id: user.id,
            name: user.name || "Unknown Agent",
            course: user.course || "Undeclared",
            level: user.level.toString(),
            image: user.image
        }));

        return NextResponse.json(formattedProfiles);
    } catch (error) {
        console.error("Erro ao escanear a rede:", error);
        return NextResponse.json({ error: "Falha ao acessar os nós globais." }, { status: 500 });
    }
}