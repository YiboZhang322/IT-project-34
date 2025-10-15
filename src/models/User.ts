import mongoose, { Document, Schema } from 'mongoose';

export interface IAttraction {
  id: string;
  name: string;
  description: string;
  image: string;
  category: 'Must go' | 'Popular';
  rating: number;
  lat: number;
  lng: number;
  city: string;
  addedAt: Date;
}

export interface IUser extends Document {
  _id: string;
  email: string;
  name: string;
  password: string;
  avatar?: string;
  favorites: IAttraction[];
  createdAt: Date;
  updatedAt: Date;
}

const AttractionSchema = new Schema<IAttraction>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, enum: ['Must go', 'Popular'], required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  city: { type: String, required: true },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  favorites: {
    type: [AttractionSchema],
    default: []
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret: any) {
      delete ret.password;
      return ret;
    }
  }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
