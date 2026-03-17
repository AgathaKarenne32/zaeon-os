import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Não autorizado. Sessão não encontrada.' }, { status: 401 });
        }

        // 1. BLINDAGEM CONTRA SESSÃO FANTASMA
        const existingUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, course: true }
        });

        if (!existingUser) {
            // Se o usuário foi purgado, avisamos o frontend para deslogar ele
            return NextResponse.json(
                { error: 'GHOST_SESSION', message: 'Usuário inexistente no banco de dados. Faça logout e login novamente.' },
                { status: 404 }
            );
        }

        if (existingUser.course) {
            return NextResponse.json(
                { error: 'Acesso Negado: Este Nó já possui um perfil acadêmico registrado.' },
                { status: 403 }
            );
        }

        const data = await req.json();

        const initialSkills = {
            writing: { rank: "F", current: 0, next: 5, metricName: "Papers" },
            focus: { rank: "F", current: 0, next: 10, metricName: "Hours" },
            collab: { rank: "F", current: 0, next: 2, metricName: "Projects" },
            participation: { rank: "F", current: 0, next: 5, metricName: "Validations" }
        };

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                name: data.name || undefined,
                course: data.course,
                role: data.role,
                age: data.age,
                gender: data.gender,
                countryCode: data.countryCode,
                institution: data.institution,
                verificationDoc: data.verificationDoc,
                torsoImage: data.torsoImage || undefined,
                kycStatus: 'pending',
                academicLevel: 'Graduação',
                skills: initialSkills
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error: any) {
        console.error('ERRO NO ONBOARDING:', error);
        return NextResponse.json({ error: 'Falha ao sincronizar dados do nó.' }, { status: 500 });
    }
}