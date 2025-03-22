import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, AfterLoad } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';

/**
 * User entity representing the users table in the database
 */
@Entity('users')
export class User {
  @ApiProperty({ description: 'Unique user identifier', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @ApiProperty({ description: 'User phone number', example: '+1234567890', required: false })
  @Column({ type: 'text', nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'boolean', default: false, select: false })
  isPhoneEncrypted: boolean;

  @Exclude() // Exclude password from API responses
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @ApiProperty({ description: 'User role', example: 'customer', enum: ['admin', 'staff', 'customer'] })
  @Column({ 
    type: 'enum', 
    enum: ['user', 'admin', 'business_owner'], 
    default: 'user' 
  })
  role: string;

  @ApiProperty({ description: 'Whether the user account is active', example: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'User account creation date', example: '2023-01-01T00:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'User account last update date', example: '2023-01-01T00:00:00Z' })
  @UpdateDateColumn()
  updatedAt: Date;

  private tempDecryptedPhone: string | null = null;

  /**
   * Handles password hashing before user is saved to database
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
  
  /**
   * Store the original phone number for later encryption
   */
  @AfterLoad()
  loadDecryptedPhone() {
    this.tempDecryptedPhone = this.phoneNumber;
  }
  
  /**
   * Helper method to check if a password is valid
   */
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
  
  /**
   * Helper method to decrypt the phone number using the DatabaseEncryptionService
   * This should be called by the service after loading an entity
   */
  decryptPhoneNumber(databaseEncryptionService: any) {
    if (this.isPhoneEncrypted && this.phoneNumber) {
      try {
        this.phoneNumber = databaseEncryptionService.decrypt(this.phoneNumber);
      } catch (error) {
        console.error('Failed to decrypt phone number', error);
        this.phoneNumber = '[Protected]';
      }
    }
    return this;
  }
  
  /**
   * Helper method to encrypt the phone number using the DatabaseEncryptionService
   * This should be called by the service before saving an entity
   */
  encryptPhoneNumber(databaseEncryptionService: any) {
    if (this.phoneNumber && 
        (!this.isPhoneEncrypted || this.phoneNumber !== this.tempDecryptedPhone)) {
      try {
        this.phoneNumber = databaseEncryptionService.encrypt(this.phoneNumber);
        this.isPhoneEncrypted = true;
      } catch (error) {
        console.error('Failed to encrypt phone number', error);
        this.phoneNumber = null;
        this.isPhoneEncrypted = false;
      }
    }
    return this;
  }
} 