import { Controller, Post, Body, Param, Put } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('api/v1/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('/:id')
  create(@Param() id: string, @Body() data: CreateProfileDto) {
    return this.profileService.create(id, data);
  }

  @Put('/:id')
  async updateProfile(@Param() id: string, @Body() data: UpdateProfileDto) {
    return this.profileService.updateProfile(id, data);
  }
}
