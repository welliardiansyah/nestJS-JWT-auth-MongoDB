import {
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/response/response.service';
import mongoose, { Model } from 'mongoose';
import { UsersDto } from './dto/users.dto';
import { genSaltSync, hash } from 'bcrypt';
import { randomUUID } from 'crypto';
import { Users } from './schemas/users.scehma';

@Injectable()
export class UsersService {
  private LOG_CONTEXT = 'UsersService';
  constructor(
    @InjectModel(Users.name)
    private readonly userRepository: Model<Users>,
    private readonly responseService: ResponseService,
  ) {}

  logger = new Logger();

  async generateHashPassword(password: string): Promise<string> {
    const defaultSalt: number =
      Number(process.env.HASH_PASSWORDSALTLENGTH) || 10;
    const salt = genSaltSync(defaultSalt);

    return hash(password, salt);
  }

  //** PREVETION DUPLICATE */
  async getByEmail(email: string) {
    try {
      return this.userRepository.findOne({ email: email }).exec();
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }

  async getById(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    try {
      return this.userRepository.findOne(userObjectId).exec();
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }

  async getAll(): Promise<any> {
    try {
      const getAlls: Record<string, any> = await this.userRepository
        .find({})
        .exec();
      getAlls.password = undefined;

      return getAlls;
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }

  async newUser(data: UsersDto): Promise<any> {
    const checkExitEmail = await this.getByEmail(data.email);

    if (checkExitEmail) {
      throw new ConflictException(
        this.responseService.error(
          HttpStatus.CONFLICT,
          {
            value: data.email,
            property: 'email',
            constraint: ['Email address already use with other users!.'],
          },
          'Email User Already Exists',
        ),
      );
    }

    const token = randomUUID();
    const userData = {
      email: data.email,
      phone: data.phone,
      password: await this.generateHashPassword(data.password),
      token_reset_password: token,
      refresh_token: null,
    };

    try {
      const createUser: any = new this.userRepository(userData);
      return createUser.save();
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }

  async updateUser(userId: string, data: any) {
    try {
      const updateData = await this.userRepository
        .updateOne({ _id: userId }, { $set: data })
        .exec();

      return updateData;
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }
}
