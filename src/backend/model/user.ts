import { model, Schema, Model, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  latitude: number;
  longitude: number;
}

const UserSchema: Schema = new Schema({
  id: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
});

export const User: Model<IUser> = model('User', UserSchema);