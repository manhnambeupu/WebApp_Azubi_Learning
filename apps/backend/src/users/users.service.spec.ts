import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let usersService: UsersService;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
    submission: {
      deleteMany: jest.Mock;
    };
    lessonAttempt: {
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      submission: {
        deleteMany: jest.fn(),
      },
      lessonAttempt: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    usersService = moduleRef.get(UsersService);
  });

  it('Tạo student thành công: password được hash, role = STUDENT', async () => {
    const dto: CreateStudentDto = {
      email: 'student1@azubi.de',
      password: 'Password123!',
      fullName: 'Student One',
    };

    prismaService.user.findUnique.mockResolvedValue(null);
    prismaService.user.create.mockResolvedValue({
      id: 'student-1',
      email: dto.email,
      fullName: dto.fullName,
      role: Role.STUDENT,
      createdAt: new Date(),
    });

    const result = await usersService.createStudent(dto);

    expect(result.role).toBe(Role.STUDENT);
    const createArgs = prismaService.user.create.mock.calls[0][0] as {
      data: { email: string; password: string; fullName: string; role: Role };
    };
    expect(createArgs.data.role).toBe(Role.STUDENT);
    expect(createArgs.data.password).not.toBe(dto.password);
    await expect(
      bcrypt.compare(dto.password, createArgs.data.password),
    ).resolves.toBe(true);
  });

  it('Tạo student email trùng: throw ConflictException', async () => {
    const dto: CreateStudentDto = {
      email: 'student1@azubi.de',
      password: 'Password123!',
      fullName: 'Student One',
    };

    prismaService.user.findUnique.mockResolvedValue({ id: 'existing-id' });

    await expect(usersService.createStudent(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });

  it('findAllStudents: chỉ trả STUDENT, không trả password', async () => {
    const students = [
      {
        id: 'student-1',
        email: 'student1@azubi.de',
        fullName: 'Student One',
        createdAt: new Date(),
      },
      {
        id: 'student-2',
        email: 'student2@azubi.de',
        fullName: 'Student Two',
        createdAt: new Date(),
      },
    ];

    prismaService.user.findMany.mockResolvedValue(students);

    const result = await usersService.findAllStudents();

    expect(prismaService.user.findMany).toHaveBeenCalledWith({
      where: { role: Role.STUDENT },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual(students);
    for (const student of result) {
      expect('password' in student).toBe(false);
    }
  });

  it('createStudent handle P2002 -> ConflictException', async () => {
    const dto: CreateStudentDto = {
      email: 'student2@azubi.de',
      password: 'Password123!',
      fullName: 'Student Two',
    };
    prismaService.user.findUnique.mockResolvedValue(null);
    prismaService.user.create.mockRejectedValue(
      new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );

    await expect(usersService.createStudent(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('deleteStudent không tồn tại -> NotFoundException', async () => {
    prismaService.user.findFirst.mockResolvedValue(null);

    await expect(usersService.deleteStudent('missing-student')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deleteStudent thành công và chạy transaction cascade', async () => {
    prismaService.user.findFirst.mockResolvedValue({ id: 'student-1' });
    prismaService.submission.deleteMany.mockResolvedValue({ count: 2 });
    prismaService.lessonAttempt.deleteMany.mockResolvedValue({ count: 2 });
    prismaService.user.delete.mockResolvedValue({ id: 'student-1' });
    prismaService.$transaction.mockResolvedValue([]);

    const result = await usersService.deleteStudent('student-1');

    expect(prismaService.submission.deleteMany).toHaveBeenCalledWith({
      where: {
        attempt: {
          userId: 'student-1',
        },
      },
    });
    expect(prismaService.lessonAttempt.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'student-1' },
    });
    expect(prismaService.user.delete).toHaveBeenCalledWith({
      where: { id: 'student-1' },
    });
    expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ deleted: true, id: 'student-1' });
  });

  it('findByEmail delegates to prisma', async () => {
    prismaService.user.findUnique.mockResolvedValue({ id: 'user-1' });

    await usersService.findByEmail('student@azubi.de');

    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'student@azubi.de' },
    });
  });

  it('findById delegates to prisma', async () => {
    prismaService.user.findUnique.mockResolvedValue({ id: 'user-1' });

    await usersService.findById('user-1');

    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });
});
