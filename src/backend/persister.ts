import { Model, Mongoose, Schema } from 'mongoose'
import { IUser, User } from './model/user'
import { IGeofence, Geofence } from './model/geofence'
import * as mongoose from 'mongoose';
import { ISubscription, Subscription } from './model/subscription';
import { IPersister } from './ipersister';

var self;
export class Persister implements IPersister{

    private dbName: string;
    private connected: boolean;

    constructor(dbName: string) {
        this.dbName=dbName;
        this.connected=false;
    }

    public async connect(): Promise<boolean> {
        self=this;
        return new Promise((resolve, reject) => {
            let url="mongodb://localhost:27017/"+this.dbName;
            mongoose.connect(url, {useUnifiedTopology: true, useNewUrlParser: true});
            let db = mongoose.connection;
            db.on("error", function() {
                console.log("MongoDB Connection error");
                resolve(false);
            });
            db.on("open", function() {
                console.log("MongoDB Connection OK");
                self.connected=true;
                resolve(true);
            });
        });
    }

    public async disconnect() {
        await Geofence.deleteMany({});
        await User.deleteMany({}); 
        await Subscription.deleteMany({});
        await mongoose.disconnect();
    }

    public async addUserPosition(userId: string, lat: number, long: number) {
        if (this.connected) {
            const user: IUser= new User({id: userId, latitude: lat, longitude: long});
            try {
                const query = await User.findOne({ id: userId });
                if (query == null)
                    await user.save();
                else {
                    const filter = { id: userId };
                    const update = { latitude: lat, longitude: long };
                    await User.updateOne(filter,update);
                }
            } catch (err) {
                console.log("DB Insert Position error: "+err);
            }
        }
    }


    public async addGeofence(name: string, idG: string, lat: number, long: number, rad: number, msg: string) {
        if (this.connected) {
            const gfence: IGeofence= new Geofence({topic: name, id: idG, latitude: lat, longitude: long, radius: rad, message: msg});
            try {
                const query = await Geofence.findOne({ id: idG });
                if (query == null)
                    await gfence.save();
                else {
                    const filter = { id: idG };
                    const update = { latitude: lat, longitude: long, radius: rad, message: msg, topic: name };
                    await Geofence.updateOne(filter,update);
                }
            } catch (err) {
                console.log("DB Insert Geofence error: "+err);
            }
        }
    }

    public async addSubscription(id: string, top: string) {
        if (this.connected) {
            const subs: ISubscription= new Subscription({ clientId: id, topic: top});
            try {
                const query = await Subscription.findOne({ clientId: id, topic: top });
                if (query == null)
                    await subs.save();
            } catch (err) {
                console.log("DB Insert Subscription error: "+err);
            }
        }
    }

    public async getAllSubscriptions(id: string): Promise<Array<ISubscription>> {
        if (this.connected) {
            const query = await Subscription.find({clientId: id});
            return query;
        } 
    }

    public async getGeofenceInfo(top: string): Promise<Array<IGeofence>> {
        if (this.connected) {
            const query = await Geofence.find({topic: top});
            return query;
        } 
    }
}



