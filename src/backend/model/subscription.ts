import { model, Schema, Model, Document } from 'mongoose';

export interface ISubscription extends Document {
    clientId: string;
    topic: string;
}

const SubscriptionSchema: Schema = new Schema({
    clientId: { type: String, required: true },
    topic: { type: String, required: true },  
});

export const Subscription: Model<ISubscription> = model('Subscription', SubscriptionSchema);