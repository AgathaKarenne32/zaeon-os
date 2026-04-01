import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { token } = await req.json();
        if (!token) return NextResponse.json({ error: 'Token missing' }, { status: 400 });

        // @ts-ignore
        const link = await prisma.classLink.findUnique({
            where: { token },
            include: { teacher: true }
        });

        if (!link) {
            return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
        }

        const student = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

        // Oficializa o vínculo
        const existingRel = await prisma.teacherStudent.findUnique({
            where: { teacherId_studentId: { teacherId: link.teacherId, studentId: student.id } }
        });

        if (!existingRel) {
            // @ts-ignore
            await prisma.teacherStudent.create({
                data: {
                    teacherId: link.teacherId,
                    studentId: student.id,
                    subjects: [link.subject]
                }
            });
        } else {
            // @ts-ignore
            if (!existingRel.subjects.includes(link.subject)) {
                // @ts-ignore
                await prisma.teacherStudent.update({
                    where: { id: existingRel.id },
                    // @ts-ignore
                    data: { subjects: { push: link.subject } }
                });
            }
        }

        // Tentar limpar a lista de "pending" se quisermos, mas a princípio
        // só o fato de oficializar já ativa o chat.
        // A rota agora só cuida do vínculo do chat / grupo,
        // a agenda já foi salva pelo frontend via api "user-space-data"!

        return NextResponse.json({ success: true, message: 'Class officially joined and verified!' });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
