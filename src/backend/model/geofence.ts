import { model, Schema, Model, Document } from 'mongoose';

export interface IGeofence extends Document {
    topic: string;
    id: string;
    latitude: number;
    longitude: number;
    radius: number;
    message: string;
}

const GeofenceSchema: Schema = new Schema({
    topic: { type: String, required: true },
    id: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radius: { type: Number, required: true },
    message: { type: String, required: true },  
});

export const Geofence: Model<IGeofence> = model('Geofence', GeofenceSchema);