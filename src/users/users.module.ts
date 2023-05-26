import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, Users } from './schemas/users.scehma';
import { ResponseService } from 'src/response/response.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
  ],
  providers: [UsersService, ResponseService],
  exports: [MongooseModule, UsersService],
})
export class UsersModule {}
