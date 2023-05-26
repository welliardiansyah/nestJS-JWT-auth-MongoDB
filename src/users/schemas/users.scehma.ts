import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import mongoose, { ObjectId } from 'mongoose';
import { Profile, ProfileSchemas } from 'src/profile/schemas/profile.schema';

export enum UsersStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REJECTED = 'REJECTED',
}

export type UsersSchemas = Users & Document;

@Schema({ timestamps: true })
export class Users {
  @Prop({ unique: true })
  email: string;

  @Prop()
  password: string;

  @Prop()
  token_reset_password: string;

  @Prop({ default: null })
  refresh_token: string;

  @Prop({
    type: String,
    enum: UsersStatus,
    default: UsersStatus.INACTIVE,
  })
  status: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
  })
  profile: Profile;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const UserSchema = SchemaFactory.createForClass(Users);
export { UserSchema };
