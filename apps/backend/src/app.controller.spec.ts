import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(() => {
    appController = new AppController();
  });

  describe('health', () => {
    it('should return healthy response payload', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
      expect(typeof result.timestamp).toBe('string');
    });
  });
});
