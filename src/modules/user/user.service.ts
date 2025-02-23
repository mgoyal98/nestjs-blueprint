import { Injectable } from '@nestjs/common';
import { AppLoggerService } from 'src/common/helpers/logger';
import { User, UserRepository } from './db';
import { CreateUserDto } from './user.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: AppLoggerService,
  ) {}

  private logPrefix(funcName: string) {
    return `[${this.constructor.name}.${funcName}]`;
  }

  async findAllUsers(): Promise<User[]> {
    const logPrefix = this.logPrefix(this.findAllUsers.name);
    try {
      this.logger.debug(`${logPrefix} Finding all users`);
      const result = await this.userRepository.findAll();
      this.logger.debug(`${logPrefix} Found all users`, { result });
      return result;
    } catch (error) {
      this.logger.error(`${logPrefix} Failed to find all users`, { error });
      throw error;
    }
  }

  async createUser(user: CreateUserDto): Promise<User> {
    const logPrefix = this.logPrefix(this.createUser.name);
    try {
      this.logger.debug(`${logPrefix} Creating user`, { user });
      const result = await this.userRepository.create({
        userId: uuidv4(),
        ...user,
      });
      this.logger.debug(`${logPrefix} Created user`, { result });
      return result;
    } catch (error) {
      this.logger.error(`${logPrefix} Failed to create user`, { error });
      throw error;
    }
  }
}
