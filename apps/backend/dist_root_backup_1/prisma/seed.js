"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHashAdmin = await bcryptjs_1.default.hash('Admin123!', 12);
    const passwordHashStudent = await bcryptjs_1.default.hash('Student123!', 12);
    await prisma.user.upsert({
        where: { email: 'admin@azubi.de' },
        update: {
            password: passwordHashAdmin,
            fullName: 'Azubi Admin',
            role: client_1.Role.ADMIN,
        },
        create: {
            email: 'admin@azubi.de',
            password: passwordHashAdmin,
            fullName: 'Azubi Admin',
            role: client_1.Role.ADMIN,
        },
    });
    await prisma.user.upsert({
        where: { email: 'student@azubi.de' },
        update: {
            password: passwordHashStudent,
            fullName: 'Azubi Student',
            role: client_1.Role.STUDENT,
        },
        create: {
            email: 'student@azubi.de',
            password: passwordHashStudent,
            fullName: 'Azubi Student',
            role: client_1.Role.STUDENT,
        },
    });
    const categories = ['Buồng phòng', 'Ẩm thực', 'Lễ tân'];
    for (const name of categories) {
        await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
}
main()
    .catch((error) => {
    console.error('Prisma seed failed:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map