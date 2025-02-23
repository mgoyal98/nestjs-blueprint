import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { DefaultSchemaOptions } from 'src/common/database';
import { v4 as uuidv4 } from 'uuid';

export type UserDocument = HydratedDocument<User>;

@Schema({
  ...DefaultSchemaOptions,
})
export class User {
  @Prop({
    required: true,
    unique: true,
    index: true,
    default: () => uuidv4(),
  })
  userId?: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  ...DefaultSchemaOptions.toJSON,
  transform: function (_doc, ret) {
    delete ret._id;
    delete ret.password;
    return ret;
  },
});

export type UserModel = Model<User>;
