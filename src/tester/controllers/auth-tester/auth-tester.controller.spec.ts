import { Test, TestingModule } from '@nestjs/testing';
import { AuthTesterController } from './auth-tester.controller';

describe('AuthTesterController', () => {
  let controller: AuthTesterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthTesterController],
    }).compile();

    controller = module.get<AuthTesterController>(AuthTesterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
