import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateAuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { ResponseService } from 'src/response/response.service';
import { JwtService } from '@nestjs/jwt';
import { genSaltSync, hash } from 'bcrypt';
import { ProfileService } from 'src/profile/profile.service';
import { RMessage } from 'src/response/response.interface';
import mongoose from 'mongoose';

@Injectable()
export class AuthService {
  private LOG_CONTEXT = 'AuthService';
  constructor(
    private readonly usersService: UsersService,
    private readonly profileService: ProfileService,
    private readonly responseService: ResponseService,
    private readonly jwtService: JwtService,
  ) {}

  logger = new Logger();

  async generateHashPassword(password: string): Promise<string> {
    const defaultSalt: number =
      Number(process.env.HASH_PASSWORDSALTLENGTH) || 10;
    const salt = genSaltSync(defaultSalt);

    return hash(password, salt);
  }

  async validatePassword(
    passwordString: string,
    passwordHash: string,
  ): Promise<boolean> {
    return this.bcryptComparePassword(passwordString, passwordHash);
  }

  async bcryptComparePassword(
    passwordString: string,
    passwordHashed: string,
  ): Promise<boolean> {
    return bcrypt.compare(passwordString, passwordHashed);
  }

  async getTokens(user: any) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user._id,
          email: user.email,
        },
        {
          secret: 'at-secret',
          expiresIn: '24h',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: user._id,
          email: user.email,
        },
        {
          secret: 'rt-secret',
          expiresIn: '30d',
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async createNewUser(data: CreateAuthDto): Promise<any> {
    try {
      const createUsers = await this.usersService.newUser(data);
      createUsers.password = undefined;

      return this.responseService.success(
        true,
        `Created new users ${data.email} successfully!.`,
        createUsers,
      );
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }

  async updateUsers(userId: string, data: any) {
    const checkUsers = await this.usersService.getById(userId);

    if (!checkUsers) {
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

    const usersData = {
      email: data.email,
      phone: data.phone,
      password: await this.generateHashPassword(data.password),
    };
    const profileData = {
      fullname: data.fullname,
      address: data.address,
      city: data.city,
      zipCode: data.zipCode,
      state: data.state,
      users: new mongoose.Types.ObjectId(checkUsers._id),
    };

    const userObjectId: any = new mongoose.Types.ObjectId(userId);

    try {
      this.usersService.updateUser(userObjectId, usersData);

      if (checkUsers.profile) {
        const profileObjectId = checkUsers.profile.toString();
        const updateData = this.profileService.updateProfileByUsers(
          profileObjectId,
          profileData,
        );

        return this.responseService.success(
          true,
          'Updated users account successfully!.',
          updateData,
        );
      }
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }

  async getAuthenticatedUser(email: string, plainTextPassword: string) {
    const user = await this.usersService.getByEmail(email);
    await this.validatePassword(plainTextPassword, user.password);
    try {
      if (user.profile) {
        const getProfile = await this.profileService.getById(
          user.profile.toString(),
        );
        user.password = undefined;
        user.profile.users = undefined;
        user.profile = getProfile;

        return user;
      } else {
        user.password = undefined;
        return user;
      }
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }

  async logoutAccount(userId: string) {
    try {
      const logouts = await this.usersService.updateUser(userId, {
        hashdRt: null,
      });

      return this.responseService.success(
        true,
        `Your account has been logged out!.`,
        logouts,
      );
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }

  async getProfile(id: string) {
    try {
      const getOne = await this.usersService.getById(id);

      const profileId: any = getOne.profile.toString();
      const getProfile = await this.profileService.getById(profileId);

      getOne.password = undefined;
      getOne.token_reset_password = undefined;
      getOne.refresh_token = undefined;
      getOne.profile = getProfile;
      getProfile.users = undefined;

      return this.responseService.success(
        true,
        'Getting data profiles successfully!.',
        getOne,
      );
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }

  async getAllData() {
    try {
      const getOne: any = await this.usersService.getAll();

      return this.responseService.success(
        true,
        'Getting data profiles successfully!.',
        getOne,
      );
    } catch (e) {
      Logger.error(e.message, this.LOG_CONTEXT);
      throw e;
    }
  }
}
