import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // 1. Fetch normal friends
        const connections = await prisma.connectionRequest.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { senderId: user.id },
                    { receiverId: user.id }
                ]
            },
            include: {
                sender: { select: { id: true, name: true, image: true } },
                receiver: { select: { id: true, name: true, image: true } }
            }
        });

        const friends = connections.map(conn => {
            const isSender = conn.senderId === user.id;
            const friendData = isSender ? conn.receiver : conn.sender;
            return {
                id: friendData.id,
                name: friendData.name || "Agente Desconhecido",
                image: friendData.image || "",
                connectionId: conn.id,
            };
        });

        // 2. Fetch Students (if teacher)
        let students: any[] = [];
        if (user.role === 'teacher' || user.role === 'professor') {
            const relations = await prisma.teacherStudent.findMany({
                where: { teacherId: user.id },
                include: { student: { select: { id: true, name: true, image: true } } }
            });
            students = relations.map(r => ({
                id: r.student.id,
                name: r.student.name || "Aluno Desconhecido",
                image: r.student.image || "",
            }));
        }

        // 3. Fetch Teachers (if student)
        let teachers: any[] = [];
        if (user.role === 'student' || user.role === 'user') {
            const relations = await prisma.teacherStudent.findMany({
                where: { studentId: user.id },
                include: { teacher: { select: { id: true, name: true, image: true } } }
            });
            teachers = relations.map(r => ({
                id: r.teacher.id,
                name: r.teacher.name || "Professor Desconhecido",
                image: r.teacher.image || "",
            }));
        }

        return NextResponse.json({ myId: user.id, friends, students, teachers });
    } catch (error) {
        console.error("Erro na API de Friends:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}