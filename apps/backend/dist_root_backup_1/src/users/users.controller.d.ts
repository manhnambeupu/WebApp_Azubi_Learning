import { CreateStudentDto } from './dto/create-student.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAllStudents(): Promise<{
        id: string;
        email: string;
        fullName: string;
        createdAt: Date;
    }[]>;
    createStudent(dto: CreateStudentDto): Promise<{
        id: string;
        email: string;
        fullName: string;
        role: import(".prisma/client").Role;
        createdAt: Date;
    }>;
    deleteStudent(id: string): Promise<{
        deleted: true;
        id: string;
    }>;
}
