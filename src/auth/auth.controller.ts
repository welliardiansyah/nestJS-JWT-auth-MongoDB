import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/auth.dto';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/auth.login.dto';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { RMessage } from 'src/response/response.interface';
import { RequestValidationPipe } from './dto/request-validation.pipe';
import { GetCurrentUserId } from 'src/common/decorators';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('api/v1/auth')
export class AuthController {
  private LOG_CONTEXT = 'AuthController';
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  logger = new Logger();

  @Get('/profile/:id')
  async profile(@Param() id: string) {
    return await this.authService.getProfile(id);
  }

  @Get('')
  async getAll() {
    return await this.authService.getAllData();
  }

  @Post('register')
  async registerAccount(@Body() data: CreateAuthDto) {
    const registers = await this.authService.createNewUser(data);
    return registers;
  }

  @Post('login')
  async loginAccount(
    @Body(RequestValidationPipe(LoginDto))
    data: LoginDto,
  ) {
    const existUsers = await this.usersService.getByEmail(data.email);

    if (!existUsers) {
      const errors: RMessage = {
        value: data.email,
        property: 'email',
        constraint: ['Email data connot be found!.'],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }

    if (existUsers.status != 'ACTIVE') {
      throw new UnauthorizedException(
        this.responseService.error(
          HttpStatus.UNAUTHORIZED,
          {
            value: existUsers.status,
            property: 'status',
            constraint: ['Users status connot be actived!.'],
          },
          'Unauthorized',
        ),
      );
    }

    const validate: boolean = await this.authService.validatePassword(
      data.password,
      existUsers.password,
    );

    if (!validate) {
      const errors: RMessage = {
        value: data.password,
        property: 'password',
        constraint: ['Password connot be not match!.'],
      };
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          errors,
          'Bad Request',
        ),
      );
    }
    const getUSers: any = await this.authService.getAuthenticatedUser(
      data.email,
      data.password,
    );
    const token = await this.authService.getTokens(getUSers);
    const refreshToken = await this.authService.generateHashPassword(
      token.refresh_token,
    );
    await this.usersService.updateUser(getUSers._id, {
      refresh_token: refreshToken,
    });
    getUSers.token_reset_password = undefined;
    getUSers.refresh_token = undefined;

    return this.responseService.success(true, `Your account now is login!.`, {
      tokens: token,
      info: getUSers,
    });
  }

  @Put('/:id')
  async updateUsers(
    @Param() id: string,
    @Body() data: UpdateAuthDto,
  ): Promise<any> {
    return await this.authService.updateUsers(id, data);
  }

  @Post('logout')
  async logoutAccount(@GetCurrentUserId() userId: string) {
    const logout = await this.authService.logoutAccount(userId);
    return logout;
  }
}
