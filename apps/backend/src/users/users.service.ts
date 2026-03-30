import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';

type StudentListItem = {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
};

type StudentDetail = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: Date;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createStudent(dto: CreateStudentDto): Promise<StudentDetail> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          fullName: dto.fullName,
          role: Role.STUDENT,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  findAllStudents(): Promise<StudentListItem[]> {
    return this.prisma.user.findMany({
      where: { role: Role.STUDENT },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteStudent(id: string): Promise<{ deleted: true; id: string }> {
    const student = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.STUDENT,
      },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
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

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOrCreateByProvider(
    email: string,
    fullName: string,
    authProvider: string,
    providerId: string,
  ): Promise<User> {
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
        role: Role.STUDENT,
        authProvider,
        providerId,
      },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
