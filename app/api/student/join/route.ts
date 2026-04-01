import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) return NextResponse.json({ error: 'Token missing' }, { status: 400 });

        // @ts-ignore
        const link = await prisma.classLink.findUnique({
            where: { token },
            include: { teacher: true }
        });

        if (!link || !link.active) {
            return NextResponse.json({ error: 'Invalid or inactive link' }, { status: 404 });
        }

        return NextResponse.json({
            teacherName: link.teacher.name,
            subject: link.subject,
            room: link.room,
            days: link.days,
            hour: link.hour,
            endHour: link.endHour
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

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

        if (!link || !link.active) {
            return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
        }

        const student = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

        // Linkar o estudante ao professor
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

        // --- Adicionar a classe ao UserSpaceData do Aluno ---
        const userSpaceData = await prisma.userSpaceData.findUnique({
            where: { userId: student.id }
        });

        const newClass = {
            id: Date.now(),
            name: link.subject,
            teacher: link.teacher.name,
            room: link.room,
            days: link.days,
            hour: link.hour,
            endHour: link.endHour,
            duration: link.endHour - link.hour,
            color: "from-blue-400 to-cyan-500",
            isDraft: false
        };

        if (userSpaceData) {
            // Se já tem userSpaceData, garantir que schedule é list
            let safeSchedule = [];
            if (Array.isArray(userSpaceData.schedule)) {
               safeSchedule = userSpaceData.schedule as any[];
            }
            // Não adicionar duplo
            if (!safeSchedule.some((c: any) => c.name === link.subject && c.teacher === link.teacher.name)) {
                safeSchedule.push(newClass);
                await prisma.userSpaceData.update({
                    where: { id: userSpaceData.id },
                    data: { schedule: safeSchedule }
                });
            }
        } else {
            // Se nao tem userSpaceData, cria
            await prisma.userSpaceData.create({
                data: {
                    userId: student.id,
                    schedule: [newClass]
                }
            });
        }

        return NextResponse.json({ success: true, message: 'Enrolled successfully!' });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
