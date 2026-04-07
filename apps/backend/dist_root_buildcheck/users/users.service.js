"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createStudent(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
            select: { id: true },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        const hashedPassword = await bcrypt_1.default.hash(dto.password, 10);
        try {
            return await this.prisma.user.create({
                data: {
                    email: dto.email,
                    password: hashedPassword,
                    fullName: dto.fullName,
                    role: client_1.Role.STUDENT,
                },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    createdAt: true,
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('Email already exists');
            }
            throw error;
        }
    }
    findAllStudents() {
        return this.prisma.user.findMany({
            where: { role: client_1.Role.STUDENT },
            select: {
                id: true,
                email: true,
                fullName: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async deleteStudent(id) {
        const student = await this.prisma.user.findFirst({
            where: {
                id,
                role: client_1.Role.STUDENT,
            },
            select: { id: true },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        await this.prisma.$transaction([
            this.prisma.submission.deleteMany({
                where: {
                    attempt: {
                        userId: id,
                    },
                },
            }),
            this.prisma.lessonAttempt.deleteMany({
                where: { userId: id },
            }),
            this.prisma.user.delete({
                where: { id },
            }),
        ]);
        return { deleted: true, id };
    }
    findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async findOrCreateByProvider(email, fullName, authProvider, providerId) {
        const existingByProvider = await this.prisma.user.findFirst({
            where: { authProvider, providerId },
        });
        if (existingByProvider) {
            return existingByProvider;
        }
        const existingByEmail = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingByEmail) {
            return this.prisma.user.update({
                where: { id: existingByEmail.id },
                data: { authProvider, providerId },
            });
        }
        return this.prisma.user.create({
            data: {
                email,
                fullName,
                role: client_1.Role.STUDENT,
                authProvider,
                providerId,
            },
        });
    }
    findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map