import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { DefaultSchemaOptions } from 'src/common/database';

export type UserDocument = HydratedDocument<User>;

@Schema({
  ...DefaultSchemaOptions,
})
export class User {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

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
    delete ret['password'];
    return ret;
  },
});

export type UserModel = Model<User>;
