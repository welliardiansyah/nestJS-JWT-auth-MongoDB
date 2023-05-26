import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Profile, ProfileSchemas } from './schemas/profile.schema';
import { ResponseService } from 'src/response/response.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchemas }]),
    UsersModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService, ResponseService],
  exports: [MongooseModule, ProfileService],
})
export class ProfileModule {}
