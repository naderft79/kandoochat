import "dotenv/config";
// seed علایق از پیش تعریف شده
import { prisma } from "@/lib/prisma";

const INTERESTS = [
  { name: "ورزش", icon: "Dumbbell" },
  { name: "موسیقی", icon: "Music" },
  { name: "سفر", icon: "Plane" },
  { name: "آشپزی", icon: "ChefHat" },
  { name: "سینما", icon: "Film" },
  { name: "کتاب خواندن", icon: "BookOpen" },
  { name: "هنر", icon: "Palette" },
  { name: "تکنولوژی", icon: "Laptop" },
  { name: "عکاسی", icon: "Camera" },
  { name: "طبیعت", icon: "Trees" },
  { name: "رقص", icon: "PartyPopper" },
  { name: "بازی", icon: "Gamepad2" },
  { name: "قهوه", icon: "Coffee" },
  { name: "ماشین", icon: "Car" },
  { name: "حیوانات", icon: "Cat" },
  { name: "مد و لباس", icon: "Shirt" },
  { name: "یوگا", icon: "Flower2" },
  { name: "کوهنوردی", icon: "Mountain" },
  { name: "شنا", icon: "Waves" },
  { name: "نقاشی", icon: "Brush" },
];

async function main() {
  console.log("Seeding interests...");
  for (const interest of INTERESTS) {
    await prisma.interest.upsert({
      where: { name: interest.name },
      update: { icon: interest.icon },
      create: interest,
    });
  }
  console.log(`Seeded ${INTERESTS.length} interests`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
