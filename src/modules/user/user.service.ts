import { Injectable } from '@nestjs/common';
import { AppLoggerService } from 'src/common/helpers/logger';
import { User, UserRepository } from './db';
import { CreateUserDto } from './user.dto';
import { hashPassword } from 'src/common/utils/crypto';
import { EXCEPTION_MESSAGE, exceptionMapper } from 'src/common/exception';

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

  async findUserById(userId: string, suppressError = false): Promise<User> {
    const logPrefix = this.logPrefix(this.findUserById.name);
    try {
      const result = await this.userRepository.findById(userId);
      if (!result && !suppressError) {
        this.logger.error(`${logPrefix} User not found`, { userId });
        throw exceptionMapper(EXCEPTION_MESSAGE.USER_NOT_FOUND);
      }
      this.logger.debug(`${logPrefix} Found user by id`, { result });
      return result;
    } catch (error) {
      this.logger.error(`${logPrefix} Failed to find user by id`, { error });
      throw error;
    }
  }

  async findUserByEmail(email: string, suppressError = false): Promise<User> {
    const logPrefix = this.logPrefix(this.findUserByEmail.name);
    try {
      const result = await this.userRepository.findByEmail(email);
      if (!result && !suppressError) {
        this.logger.error(`${logPrefix} User not found`, { email });
        throw exceptionMapper(EXCEPTION_MESSAGE.USER_NOT_FOUND);
      }
      this.logger.debug(`${logPrefix} Found user by email`, { result });
      return result;
    } catch (error) {
      this.logger.error(`${logPrefix} Failed to find user by email`, { error });
      throw error;
    }
  }

  async createUser(user: CreateUserDto): Promise<User> {
    const logPrefix = this.logPrefix(this.createUser.name);
    try {
      this.logger.debug(`${logPrefix} Creating user`, { user });

      const existingUser = await this.findUserByEmail(user.email, true);
      if (existingUser) {
        this.logger.error(`${logPrefix} User already exists`);
        throw exceptionMapper(EXCEPTION_MESSAGE.USER_ALREADY_EXISTS);
      }
      user.password = await hashPassword(user.password);
      const result = await this.userRepository.create({
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
