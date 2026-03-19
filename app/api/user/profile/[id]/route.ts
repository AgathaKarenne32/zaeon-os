import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        // Busca apenas as informações seguras e públicas do usuário
        const user = await prisma.user.findUnique({
            where: { id },
            select: { 
                id: true, 
                name: true, 
                course: true, 
                gender: true, 
                image: true, 
                academicLevel: true, 
                kycStatus: true 
            }
        });

        if (!user) {
            return NextResponse.json({ error: "Agente não encontrado no sistema." }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Erro ao buscar perfil público:", error);
        return NextResponse.json({ error: "Erro de conexão no Matrix." }, { status: 500 });
    }
}