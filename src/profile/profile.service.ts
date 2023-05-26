import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { ResponseService } from 'src/response/response.service';
import { InjectModel } from '@nestjs/mongoose';
import { Profile } from './schemas/profile.schema';
import mongoose, { Model } from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { RMessage } from 'src/response/response.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  private LOG_CONTEXT = 'UsersService';
  constructor(
    @InjectModel(Profile.name)
    private readonly profileRepository: Model<Profile>,
    private readonly responseService: ResponseService,
    private readonly usersService: UsersService,
  ) {}

  logger = new Logger();

  async getById(profileId: string) {
    const userObjectId = new mongoose.Types.ObjectId(profileId);
    try {
      return this.profileRepository.findOne(userObjectId).exec();
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }

  async create(userId: string, data: CreateProfileDto) {
    const getUsers = await this.usersService.getById(userId);

    if (!getUsers) {
      const errors: RMessage = {
        value: userId,
        property: 'userId',
        constraint: ['User connot be found!.'],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    const objectData = {
      fullname: data.fullname,
      address: data.address,
      city: data.city,
      zipCode: data.zipCode,
      state: data.state,
      users: new mongoose.Types.ObjectId(getUsers._id),
    };
    const userObjectId = new mongoose.Types.ObjectId(getUsers._id);

    try {
      const createData = new this.profileRepository(objectData);
      const saved = await createData.save();

      await this.usersService.updateUser(userObjectId.toString(), {
        profile: saved._id.toString(),
      });

      return this.responseService.success(
        true,
        `Updated user profile successfully!.`,
        createData,
      );
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }

  async updateProfile(profileId: string, data: UpdateProfileDto) {
    const userObjectId = new mongoose.Types.ObjectId(profileId);
    const getUsers: any = await this.getById(profileId);

    if (getUsers == null) {
      return this.responseService.success(
        true,
        `Data profile id connot be found!.`,
        null,
      );
    }

    const checkUsers = await this.usersService.getById(getUsers.users);

    if (!checkUsers) {
      const errors: RMessage = {
        value: getUsers.users,
        property: 'getUsers.users',
        constraint: ['User connot be found!.'],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    try {
      const updateData = await this.profileRepository
        .updateOne({ _id: userObjectId }, { $set: data })
        .exec();

      return this.responseService.success(
        true,
        'Updated Profile data successfully!.',
        updateData,
      );
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }

  async updateProfileByUsers(profileId: string, data: UpdateProfileDto) {
    try {
      return this.profileRepository
        .updateOne({ _id: profileId }, { $set: data })
        .exec();
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }
}
