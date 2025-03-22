import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from '../users.service';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt'),
}));

// Mock user data
const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  password: 'hashed_password',
  role: 'customer',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock create user DTO
const mockCreateUserDto = {
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  password: 'Password123!',
};

// Mock update user DTO
const mockUpdateUserDto = {
  firstName: 'Jane',
};

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  // Setup before each test
  beforeEach(async () => {
    // Create a testing module with mocked repository
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    // Get the service and repository instances
    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  // Test that service is defined
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test the create method
  describe('create', () => {
    it('should successfully create a user', async () => {
      // Mock repository methods
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(repository, 'create').mockReturnValueOnce(mockUser as User);
      jest.spyOn(repository, 'save').mockResolvedValueOnce(mockUser as User);

      // Call the service method
      const result = await service.create(mockCreateUserDto);

      // Assert results
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: mockCreateUserDto.email } });
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      // Mock repository methods
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockUser as User);

      // Assert that it throws ConflictException
      await expect(service.create(mockCreateUserDto)).rejects.toThrow(ConflictException);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: mockCreateUserDto.email } });
    });
  });

  // Test the findAll method
  describe('findAll', () => {
    it('should return an array of users', async () => {
      // Mock repository methods
      jest.spyOn(repository, 'find').mockResolvedValueOnce([mockUser] as User[]);

      // Call the service method
      const result = await service.findAll();

      // Assert results
      expect(result).toEqual([mockUser]);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  // Test the findOne method
  describe('findOne', () => {
    it('should return a user if found', async () => {
      // Mock repository methods
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockUser as User);

      // Call the service method
      const result = await service.findOne(mockUser.id);

      // Assert results
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
    });

    it('should throw NotFoundException if user not found', async () => {
      // Mock repository methods
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      // Assert that it throws NotFoundException
      await expect(service.findOne(mockUser.id)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
    });
  });

  // Test the findByEmail method
  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      // Mock repository methods
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockUser as User);

      // Call the service method
      const result = await service.findByEmail(mockUser.email);

      // Assert results
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: mockUser.email } });
    });

    it('should return null if user not found', async () => {
      // Mock repository methods
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      // Call the service method
      const result = await service.findByEmail(mockUser.email);

      // Assert results
      expect(result).toBeNull();
      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: mockUser.email } });
    });
  });

  // Test the update method
  describe('update', () => {
    it('should update and return a user if found', async () => {
      // Create updated user
      const updatedUser = { ...mockUser, ...mockUpdateUserDto };

      // Mock repository methods
      jest.spyOn(repository, 'update').mockResolvedValueOnce({ affected: 1, raw: {}, generatedMaps: [] });
      jest.spyOn(repository, 'findOne')
        .mockResolvedValueOnce(updatedUser as User); // For the findOne after update

      // Call the service method
      const result = await service.update(mockUser.id, mockUpdateUserDto);

      // Assert results
      expect(result).toEqual(updatedUser);
      expect(repository.update).toHaveBeenCalledWith(mockUser.id, mockUpdateUserDto);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
    });

    it('should throw NotFoundException if user not found', async () => {
      // Mock repository methods
      jest.spyOn(repository, 'update').mockResolvedValueOnce({ affected: 0, raw: {}, generatedMaps: [] });

      // Assert that it throws NotFoundException
      await expect(service.update(mockUser.id, mockUpdateUserDto)).rejects.toThrow(NotFoundException);
      expect(repository.update).toHaveBeenCalledWith(mockUser.id, mockUpdateUserDto);
    });
  });

  // Test the remove method
  describe('remove', () => {
    it('should remove a user if found', async () => {
      // Mock repository methods
      jest.spyOn(repository, 'delete').mockResolvedValueOnce({ affected: 1, raw: {} });

      // Call the service method
      await service.remove(mockUser.id);

      // Assert results
      expect(repository.delete).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException if user not found', async () => {
      // Mock repository methods
      jest.spyOn(repository, 'delete').mockResolvedValueOnce({ affected: 0, raw: {} });

      // Assert that it throws NotFoundException
      await expect(service.remove(mockUser.id)).rejects.toThrow(NotFoundException);
      expect(repository.delete).toHaveBeenCalledWith(mockUser.id);
    });
  });
}); 