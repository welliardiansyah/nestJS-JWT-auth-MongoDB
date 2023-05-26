import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import mongoose, { ObjectId } from 'mongoose';
import { Users } from 'src/users/schemas/users.scehma';

export type ProfileSchemas = Profile & Document;

@Schema({ timestamps: true })
export class Profile {
  @Prop()
  fullname: string;

  @Prop()
  address: string;

  @Prop()
  city: string;

  @Prop()
  zipCode: string;

  @Prop()
  state: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  })
  users: Users;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const ProfileSchemas = SchemaFactory.createForClass(Profile);
export { ProfileSchemas };
