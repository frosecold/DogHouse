import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * User entity representing the users table in the database
 */
@Entity('users')
export class User {
  @ApiProperty({ description: 'Unique user identifier', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @Column()
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @Column()
  lastName: string;

  @ApiProperty({ description: 'User phone number', example: '+1234567890', required: false })
  @Column({ nullable: true })
  phoneNumber?: string;

  @Exclude() // Exclude password from API responses
  @Column()
  password: string;

  @ApiProperty({ description: 'User role', example: 'customer', enum: ['admin', 'staff', 'customer'] })
  @Column({ default: 'customer' })
  role: string;

  @ApiProperty({ description: 'Whether the user account is active', example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'User account creation date', example: '2023-01-01T00:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'User account last update date', example: '2023-01-01T00:00:00Z' })
  @UpdateDateColumn()
  updatedAt: Date;
} 