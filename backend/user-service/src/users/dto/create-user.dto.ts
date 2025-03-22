import { IsEmail, IsString, MinLength, IsOptional, Matches, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for user creation requests
 * Includes validation rules for each field
 */
export class CreateUserDto {
  @ApiProperty({ 
    description: 'User email address', 
    example: 'john@example.com' 
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ 
    description: 'User first name', 
    example: 'John' 
  })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  firstName: string;

  @ApiProperty({ 
    description: 'User last name', 
    example: 'Doe' 
  })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  lastName: string;

  @ApiProperty({ 
    description: 'User phone number', 
    example: '+1234567890',
    required: false
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-\(\)]+$/, { 
    message: 'Phone number format is invalid' 
  })
  phoneNumber?: string;

  @ApiProperty({ 
    description: 'User password', 
    example: 'Password123!',
    minLength: 8 
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  password: string;

  @ApiProperty({ 
    description: 'User role', 
    example: 'customer',
    enum: ['admin', 'staff', 'customer'],
    required: false,
    default: 'customer'
  })
  @IsOptional()
  @IsEnum(['admin', 'staff', 'customer'], { 
    message: 'Role must be one of: admin, staff, customer' 
  })
  role?: string;
} 