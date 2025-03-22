import { Injectable, ConflictException, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * Service responsible for user-related operations
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Creates a new user
   * @param createUserDto - Data for creating a new user
   * @returns Newly created user
   * @throws ConflictException if email already exists
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Attempting to create user with email: ${createUserDto.email}`);
    
    // Check if email already exists
    const existingUser = await this.usersRepository.findOne({ 
      where: { email: createUserDto.email } 
    });
    
    if (existingUser) {
      this.logger.warn(`User creation failed: Email already exists - ${createUserDto.email}`);
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(createUserDto.password);
    
    // Create new user with hashed password
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    
    this.logger.log(`User created successfully: ${user.email}`);
    return this.usersRepository.save(user);
  }

  /**
   * Finds all users in the system
   * @returns Array of users
   */
  async findAll(): Promise<User[]> {
    this.logger.log('Retrieving all users');
    return this.usersRepository.find();
  }

  /**
   * Finds a specific user by ID
   * @param id - User ID to find
   * @returns User if found
   * @throws NotFoundException if user not found
   */
  async findOne(id: string): Promise<User> {
    this.logger.log(`Retrieving user with ID: ${id}`);
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  /**
   * Finds a user by email
   * @param email - Email to search for
   * @returns User if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`Searching for user by email: ${email}`);
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Updates a user's information
   * @param id - ID of user to update
   * @param updateUserDto - Data to update
   * @returns Updated user
   * @throws NotFoundException if user not found
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user with ID: ${id}`);
    
    // Hash password if it's being updated
    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }
    
    const result = await this.usersRepository.update(id, updateUserDto);
    
    if (result.affected === 0) {
      this.logger.warn(`Update failed: User not found - ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    this.logger.log(`User updated successfully: ${id}`);
    return this.findOne(id);
  }

  /**
   * Removes a user from the system
   * @param id - ID of user to remove
   * @throws NotFoundException if user not found
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Attempting to delete user with ID: ${id}`);
    const result = await this.usersRepository.delete(id);
    
    if (result.affected === 0) {
      this.logger.warn(`Deletion failed: User not found - ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    this.logger.log(`User deleted successfully: ${id}`);
  }

  /**
   * Validates user credentials
   * @param email - User email
   * @param password - User password (plain text)
   * @returns User if validation successful
   * @throws UnauthorizedException if credentials invalid
   */
  async validateUser(email: string, password: string): Promise<User> {
    this.logger.log(`Validating credentials for user: ${email}`);
    const user = await this.findByEmail(email);
    
    if (!user) {
      this.logger.warn(`Authentication failed: User not found - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isPasswordValid = await this.comparePasswords(password, user.password);
    
    if (!isPasswordValid) {
      this.logger.warn(`Authentication failed: Invalid password for ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    
    this.logger.log(`User authenticated successfully: ${email}`);
    return user;
  }

  /**
   * Hashes a plain text password
   * @param password - Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a plain text password with a hashed password
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password
   * @returns True if match, false otherwise
   */
  private async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
} 