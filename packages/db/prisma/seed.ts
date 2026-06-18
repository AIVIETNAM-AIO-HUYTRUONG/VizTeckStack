import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const frontend = await prisma.roadmap.upsert({
    where: { slug: 'frontend' },
    update: {},
    create: {
      slug: 'frontend',
      title: 'Frontend Developer',
      description: 'Step by step guide to becoming a frontend developer',
    },
  });

  const backend = await prisma.roadmap.upsert({
    where: { slug: 'backend' },
    update: {},
    create: {
      slug: 'backend',
      title: 'Backend Developer',
      description: 'Step by step guide to becoming a backend developer',
    },
  });

  await prisma.roadmap.upsert({
    where: { slug: 'fullstack' },
    update: {},
    create: {
      slug: 'fullstack',
      title: 'Fullstack Developer',
      description: 'Step by step guide to becoming a fullstack developer',
      nodes: {
        create: [
          {
            type: 'ROADMAP',
            title: 'Frontend',
            positionX: 100,
            positionY: 100,
            targetRoadmapId: frontend.id,
          },
          {
            type: 'ROADMAP',
            title: 'Backend',
            positionX: 400,
            positionY: 100,
            targetRoadmapId: backend.id,
          },
        ],
      },
    },
  });

  console.log('Seed complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
