const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const id = 'cmny3c0iw0000h8lhq1twwkbj';
    const project = await prisma.project.findUnique({ where: { id } });
    console.log("Project found:", project);
    
    if (!project) {
        console.log("ALL PROJECTS:");
        const all = await prisma.project.findMany();
        console.log(all);
    }
}
check().finally(() => prisma.$disconnect());
