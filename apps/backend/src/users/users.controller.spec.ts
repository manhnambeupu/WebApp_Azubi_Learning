import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    findAllStudents: jest.Mock;
    createStudent: jest.Mock;
    deleteStudent: jest.Mock;
  };

  beforeEach(() => {
    usersService = {
      findAllStudents: jest.fn(),
      createStudent: jest.fn(),
      deleteStudent: jest.fn(),
    };
    controller = new UsersController(usersService as never);
  });

  it('findAllStudents delegates to service', async () => {
    usersService.findAllStudents.mockResolvedValue([{ id: 'student-1' }]);

    const result = await controller.findAllStudents();

    expect(usersService.findAllStudents).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'student-1' }]);
  });

  it('createStudent delegates to service', async () => {
    const dto = {
      email: 'student@azubi.de',
      password: 'Password123!',
      fullName: 'Student Name',
    };
    usersService.createStudent.mockResolvedValue({
      id: 'student-1',
      email: dto.email,
      fullName: dto.fullName,
    });

    const result = await controller.createStudent(dto);

    expect(usersService.createStudent).toHaveBeenCalledWith(dto);
    expect(result).toEqual({
      id: 'student-1',
      email: dto.email,
      fullName: dto.fullName,
    });
  });

  it('deleteStudent delegates to service', async () => {
    usersService.deleteStudent.mockResolvedValue({ deleted: true, id: 'student-1' });

    const result = await controller.deleteStudent('student-1');

    expect(usersService.deleteStudent).toHaveBeenCalledWith('student-1');
    expect(result).toEqual({ deleted: true, id: 'student-1' });
  });
});
