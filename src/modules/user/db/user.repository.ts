import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModel } from './user.db';
import { FilterQuery } from 'mongoose';
import { objectToDotNotation } from 'src/common/utils';
import { AppLoggerService } from 'src/common/helpers/logger';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private user: UserModel,
    private readonly logger: AppLoggerService,
  ) {}

  private logPrefix(funcName: string) {
    return `[${this.constructor.name}.${funcName}]`;
  }

  async create(user: User): Promise<User> {
    const logPrefix = this.logPrefix(this.create.name);
    this.logger.debug(`${logPrefix} Creating user`, { user });
    const result = await this.user.create(user);
    this.logger.debug(`${logPrefix} Created user`, { result });
    return result;
  }

  async findAll(): Promise<User[]> {
    const logPrefix = this.logPrefix(this.findAll.name);
    this.logger.debug(`${logPrefix} Finding all users`);
    const result = await this.user.find().exec();
    this.logger.debug(`${logPrefix} Found all users`, { result });
    return result;
  }

  async findById(userId: string): Promise<User> {
    const logPrefix = this.logPrefix(this.findById.name);
    this.logger.debug(`${logPrefix} Finding user by ID`, { userId });
    const result = await this.user.findOne({ userId }).exec();
    this.logger.debug(`${logPrefix} Found user by ID`, { result });
    return result;
  }

  async findByEmail(email: string): Promise<User> {
    const logPrefix = this.logPrefix(this.findByEmail.name);
    this.logger.debug(`${logPrefix} Finding user by email`, { email });
    const result = await this.user.findOne({ email }).exec();
    this.logger.debug(`${logPrefix} Found user by email`, { result });
    return result;
  }

  async findOneByFilter(filter: FilterQuery<User>): Promise<User> {
    const logPrefix = this.logPrefix(this.findOneByFilter.name);
    this.logger.debug(`${logPrefix} Finding user by filter`, { filter });
    const result = await this.user.findOne(filter).exec();
    this.logger.debug(`${logPrefix} Found user by filter`, { result });
    return result;
  }

  async findByFilter(filter: FilterQuery<User>): Promise<User[]> {
    const logPrefix = this.logPrefix(this.findByFilter.name);
    this.logger.debug(`${logPrefix} Finding users by filter`, { filter });
    const result = await this.user.find(filter).exec();
    this.logger.debug(`${logPrefix} Found users by filter`, { result });
    return result;
  }

  async updateById(userId: string, user: User): Promise<User> {
    const logPrefix = this.logPrefix(this.updateById.name);
    this.logger.debug(`${logPrefix} Updating user by ID`, { userId, user });
    const result = await this.user
      .findOneAndUpdate({ userId }, { $set: user }, { new: true })
      .exec();
    this.logger.debug(`${logPrefix} Updated user by ID`, { result });
    return result;
  }

  async patchById(userId: string, user: User): Promise<User> {
    const logPrefix = this.logPrefix(this.patchById.name);
    this.logger.debug(`${logPrefix} Patching user by ID`, { userId, user });
    const result = await this.user
      .findOneAndUpdate(
        { userId },
        { $set: objectToDotNotation(user) },
        { new: true },
      )
      .exec();
    this.logger.debug(`${logPrefix} Patched user by ID`, { result });
    return result;
  }

  async deleteById(userId: string) {
    const logPrefix = this.logPrefix(this.deleteById.name);
    this.logger.debug(`${logPrefix} Deleting user by ID`, { userId });
    const result = await this.user.deleteOne({ userId }).exec();
    this.logger.debug(`${logPrefix} Deleted user by ID`, { result });
    return result;
  }
}
