import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.taskReview.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskActivity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.calendarEventAssignee.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.companySettings.deleteMany();

  const password = (value: string) => bcrypt.hash(value, 12);

  await Promise.all([
    prisma.user.create({
      data: {
        name: "Anjali",
        email: "admin",
        passwordHash: await password("Anjali11@@@"),
        role: "ADMIN",
        designation: "Admin",
        avatarUrl: "/avatars/anjali.png",
        status: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        name: "Muhammad Shaheer",
        email: "shaheer",
        passwordHash: await password("webdeveloper11"),
        role: "MANAGER",
        designation: "Project Manager",
        avatarUrl: "/avatars/shaheer.png",
        status: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        name: "Muhammad Umar",
        email: "umar",
        passwordHash: await password("graphics"),
        role: "EMPLOYEE",
        designation: "Video & Graphics",
        avatarUrl: "/avatars/umar.png",
        status: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        name: "Fatima Hassan",
        email: "fatima",
        passwordHash: await password("socialmedia11"),
        role: "EMPLOYEE",
        designation: "Social Media & Marketing",
        avatarUrl: "/avatars/fatima.png",
        status: "ACTIVE",
      },
    }),
  ]);

  await prisma.companySettings.create({
    data: {
      id: "default",
      name: "ZelQ Solutions",
      tagline: "Build. Automate. Scale.",
      email: "contact@zelq.com",
    },
  });

  console.log("Seeded ZelQ team accounts only.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
