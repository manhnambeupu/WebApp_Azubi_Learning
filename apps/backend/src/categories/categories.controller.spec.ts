import { CategoriesController } from './categories.controller';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    categoriesService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    controller = new CategoriesController(categoriesService as never);
  });

  it('findAll delegates to service', async () => {
    categoriesService.findAll.mockResolvedValue([{ id: 'cat-1', name: 'Ẩm thực' }]);

    const result = await controller.findAll();

    expect(categoriesService.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'cat-1', name: 'Ẩm thực' }]);
  });

  it('findById delegates to service', async () => {
    categoriesService.findById.mockResolvedValue({ id: 'cat-1', name: 'Ẩm thực' });

    const result = await controller.findById('cat-1');

    expect(categoriesService.findById).toHaveBeenCalledWith('cat-1');
    expect(result).toEqual({ id: 'cat-1', name: 'Ẩm thực' });
  });

  it('create delegates to service', async () => {
    categoriesService.create.mockResolvedValue({ id: 'cat-1', name: 'Lễ tân' });

    const result = await controller.create({ name: 'Lễ tân' });

    expect(categoriesService.create).toHaveBeenCalledWith({ name: 'Lễ tân' });
    expect(result).toEqual({ id: 'cat-1', name: 'Lễ tân' });
  });

  it('update delegates to service', async () => {
    categoriesService.update.mockResolvedValue({ id: 'cat-1', name: 'Buồng phòng' });

    const result = await controller.update('cat-1', { name: 'Buồng phòng' });

    expect(categoriesService.update).toHaveBeenCalledWith('cat-1', {
      name: 'Buồng phòng',
    });
    expect(result).toEqual({ id: 'cat-1', name: 'Buồng phòng' });
  });

  it('delete delegates to service', async () => {
    categoriesService.delete.mockResolvedValue({ deleted: true, id: 'cat-1' });

    const result = await controller.delete('cat-1');

    expect(categoriesService.delete).toHaveBeenCalledWith('cat-1');
    expect(result).toEqual({ deleted: true, id: 'cat-1' });
  });
});
