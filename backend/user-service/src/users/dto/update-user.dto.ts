import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * Data Transfer Object for user update requests
 * Extends CreateUserDto but makes all fields optional
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {} 