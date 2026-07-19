import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { encryptPhone } from "../src/server/crypto.ts";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = "admin@sportpark.md";
const ADMIN_PASSWORD = "sportpark2026";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function dateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dateStr(d);
}
function token() {
  return crypto.randomBytes(24).toString("base64url");
}

const SAMPLE_NAMES = [
  "Ana Grigoraș",
  "Ion Cebotari",
  "Cristina Munteanu",
  "Vasile Ceban",
  "Elena Rusu",
  "Mihai Popa",
  "Doina Lungu",
  "Andrei Sandu",
];

async function main() {
  console.log("Seeding sportpark database...");

  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.admin.deleteMany();

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.admin.create({ data: { email: ADMIN_EMAIL, passwordHash } });

  const categoryData = [
    { titleRo: "Fitness", titleRu: "Фитнес" },
    { titleRo: "CrossFit", titleRu: "Кроссфит" },
    { titleRo: "Pilates", titleRu: "Пилатес" },
    { titleRo: "Tenis", titleRu: "Теннис" },
    { titleRo: "Squash", titleRu: "Сквош" },
    { titleRo: "Kids Park", titleRu: "Кидс Парк" },
  ];
  const categories = await Promise.all(
    categoryData.map((c) => prisma.category.create({ data: c })),
  );
  const categoryIdByName = new Map(categories.map((c) => [c.titleRo, c.id]));

  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: "CrossFit — Antrenament de grup",
        categoryId: categoryIdByName.get("CrossFit")!,
        description: "Workout of the Day - intensitate ridicată, ritm alert. Vino pregătit!",
        date: daysFromNow(0),
        startTime: "18:00",
        endTime: "19:00",
        location: "Zona CrossFit",
        coach: "Ion Rusu",
        maxRegistrations: 12,
      },
    }),
    prisma.event.create({
      data: {
        title: "Fitness — Antrenament funcțional",
        categoryId: categoryIdByName.get("Fitness")!,
        description: "Antrenament de forță și cardio, potrivit pentru toate nivelurile.",
        date: daysFromNow(0),
        startTime: "19:30",
        endTime: "20:30",
        location: "Sala Fitness, Etaj 2",
        coach: "Andrei Munteanu",
        maxRegistrations: 15,
      },
    }),
    prisma.event.create({
      data: {
        title: "Pilates — Clasă de grup",
        categoryId: categoryIdByName.get("Pilates")!,
        description: "Sesiune relaxantă de Pilates, focus pe postură și respirație.",
        date: daysFromNow(1),
        startTime: "18:30",
        endTime: "19:30",
        location: "Sala Studio",
        coach: "Elena Ciobanu",
        maxRegistrations: 10,
      },
    }),
    prisma.event.create({
      data: {
        title: "Kids Park — Antrenament copii",
        categoryId: categoryIdByName.get("Kids Park")!,
        description: "Program pentru copii 6-10 ani. Jocuri, agilitate, coordonare.",
        date: daysFromNow(1),
        startTime: "16:00",
        endTime: "17:00",
        location: "Kids Park",
        coach: "Maria Lungu",
        maxRegistrations: 8,
      },
    }),
    prisma.event.create({
      data: {
        title: "Tenis — Antrenament de grup",
        categoryId: categoryIdByName.get("Tenis")!,
        description:
          "Antrenament pentru cei care descoperă tenisul. Rachete disponibile la fața locului.",
        date: daysFromNow(2),
        startTime: "10:00",
        endTime: "11:30",
        location: "Terenul de Tenis 1",
        coach: "Victor Popa",
        maxRegistrations: 6,
      },
    }),
    // Full: maxRegistrations matches the seeded registration count below, to demo "seats full".
    prisma.event.create({
      data: {
        title: "Squash — Sesiune de grup",
        categoryId: categoryIdByName.get("Squash")!,
        description: "Sesiune deschisă de squash, jucători rotativi.",
        date: daysFromNow(3),
        startTime: "19:00",
        endTime: "20:00",
        location: "Terenul de Squash",
        maxRegistrations: 4,
      },
    }),
    // Registration deadline already passed, event itself is still upcoming — demos "closed".
    prisma.event.create({
      data: {
        title: "CrossFit — Antrenament de seară",
        categoryId: categoryIdByName.get("CrossFit")!,
        description: "Sesiune avansată, doar pentru membri cu experiență.",
        date: daysFromNow(4),
        startTime: "20:00",
        endTime: "21:00",
        location: "Zona CrossFit",
        coach: "Ion Rusu",
        maxRegistrations: 12,
        registrationDeadline: new Date(Date.now() - 1000 * 60 * 60),
      },
    }),
    // Past event, for the admin dashboard's "Trecut" status.
    prisma.event.create({
      data: {
        title: "Fitness — Antrenament de dimineață (trecut)",
        categoryId: categoryIdByName.get("Fitness")!,
        description: "Antrenament matinal de forță și cardio.",
        date: daysFromNow(-2),
        startTime: "07:00",
        endTime: "08:00",
        location: "Sala Fitness, Etaj 2",
        coach: "Andrei Munteanu",
        maxRegistrations: 15,
      },
    }),
  ]);

  const squash = events[5];
  await Promise.all(
    Array.from({ length: squash.maxRegistrations }, (_, i) =>
      prisma.registration.create({
        data: {
          eventId: squash.id,
          name: SAMPLE_NAMES[i % SAMPLE_NAMES.length],
          phone: encryptPhone(`+373 6${900000 + i}`),
          token: token(),
        },
      }),
    ),
  );

  const crossfit = events[0];
  await Promise.all(
    SAMPLE_NAMES.slice(0, 4).map((name, i) =>
      prisma.registration.create({
        data: {
          eventId: crossfit.id,
          name,
          phone: encryptPhone(`+373 6${800000 + i}`),
          token: token(),
        },
      }),
    ),
  );

  console.log(`Seeded ${events.length} events and admin account.`);
  console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
