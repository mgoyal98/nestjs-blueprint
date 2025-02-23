import { SchemaOptions } from '@nestjs/mongoose';

export const DefaultSchemaOptions: SchemaOptions = {
  id: false,
  timestamps: true,
  toJSON: {
    getters: true,
    virtuals: true,
    versionKey: false,
    transform: function (_doc, ret) {
      delete ret._id;
      return ret;
    },
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
