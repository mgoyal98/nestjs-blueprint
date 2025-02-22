import { SchemaOptions } from '@nestjs/mongoose';

export const DefaultSchemaOptions: SchemaOptions = {
  id: true,
  timestamps: true,
  toJSON: {
    getters: true,
    virtuals: true,
    versionKey: false,
  },
  toObject: {
    getters: true,
    virtuals: true,
    versionKey: false,
  },
};

export const DefaultSchemaOptionsForNested: SchemaOptions = {
  _id: false,
  id: false,
  timestamps: false,
};
