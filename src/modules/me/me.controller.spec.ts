import { Test, TestingModule } from '@nestjs/testing';
import { MeController } from './me.controller';
import { UnauthorizedException } from '@nestjs/common';

describe('MeController', () => {
  let controller: MeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeController],
    }).compile();

    controller = module.get<MeController>(MeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('should return user profile when valid session exists', () => {
      const mockRequest = {
        cookies: {
          userEmail: 'user@example.com'
        }
      } as any;

      const result = controller.getMe(mockRequest);

      expect(result).toEqual({
        id: 'user-1',
        email: 'user@example.com',
        createdAt: expect.any(Date),
        tz: 'local',
        cadence: 'daily-09:00'
      });
    });

    it('should throw UnauthorizedException when no session exists', () => {
      const mockRequest = {
        cookies: {}
      } as any;

      expect(() => controller.getMe(mockRequest)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when userEmail is null', () => {
      const mockRequest = {
        cookies: {
          userEmail: null
        }
      } as any;

      expect(() => controller.getMe(mockRequest)).toThrow(UnauthorizedException);
    });
  });

  describe('getSessionHealth', () => {
    it('should return session health when valid session exists', () => {
      const mockRequest = {
        cookies: {
          userEmail: 'user@example.com'
        }
      } as any;

      const result = controller.getSessionHealth(mockRequest);

      expect(result).toEqual({
        hasValidSession: true,
        userEmail: 'user@example.com',
        timestamp: expect.any(String),
        sessionValid: true
      });
    });

    it('should return session health when no session exists', () => {
      const mockRequest = {
        cookies: {}
      } as any;

      const result = controller.getSessionHealth(mockRequest);

      expect(result).toEqual({
        hasValidSession: false,
        userEmail: null,
        timestamp: expect.any(String),
        sessionValid: false
      });
    });

    it('should return session health when userEmail is null', () => {
      const mockRequest = {
        cookies: {
          userEmail: null
        }
      } as any;

      const result = controller.getSessionHealth(mockRequest);

      expect(result).toEqual({
        hasValidSession: false,
        userEmail: null,
        timestamp: expect.any(String),
        sessionValid: false
      });
    });
  });
});

