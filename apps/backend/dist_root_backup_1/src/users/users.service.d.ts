import { Role, User } from '@prisma/client';
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
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createStudent(dto: CreateStudentDto): Promise<StudentDetail>;
    findAllStudents(): Promise<StudentListItem[]>;
    deleteStudent(id: string): Promise<{
        deleted: true;
        id: string;
    }>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
}
export {};
