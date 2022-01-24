import { IUser, User } from './model/user'
import { IGeofence, Geofence } from './model/geofence'
import { ISubscription, Subscription } from './model/subscription';
import { IPersister } from './ipersister'

var self;
export class MemPersister implements IPersister{

    private memUser: Map<string,IUser>;
    private memGeofence: Map<string,IGeofence>;
    private memSubscription: Map<string,ISubscription>;

    constructor() {
        this.memUser=new Map<string,IUser>();
        this.memGeofence=new Map<string,IGeofence>();
        this.memSubscription=new Map<string,ISubscription>();
    }

    public async connect(): Promise<boolean> {
        self=this;
        return true;
    }

    public async disconnect() {
        
    }

    public async addUserPosition(userId: string, lat: number, long: number) {
        let user:IUser=this.memUser.get(userId);
        if (user==undefined) {
            const user:IUser=new User({id: userId, latitude: lat, longitude: long});
            this.memUser.set(userId,user);
        } else {
            user.latitude=lat;
            user.longitude=long;
        }
    }

    public async addGeofence(name: string, idG: string, lat: number, long: number, rad: number, msg: string) {
        const gfence: IGeofence=this.memGeofence.get(idG);
        if (gfence==undefined) {
            const gfence: IGeofence= new Geofence({topic: name, id: idG, latitude: lat, longitude: long, radius: rad, message: msg});  
            this.memGeofence.set(idG,gfence); 
        }      
    }

    public async addSubscription(id: string, top: string) {
        const key:string=id+"!"+top;
        const subs: ISubscription=this.memSubscription.get(key);

        if (subs==undefined) {
            const subs: ISubscription= new Subscription({ clientId: id, topic: top});
            this.memSubscription.set(key,subs);
 
        }
    }

    public async getAllSubscriptions(id: string): Promise<Array<ISubscription>> {
        let res: Array<ISubscription>=new Array<ISubscription>();
        this.memSubscription.forEach((gEntry, key) => {
            const idEntry: string=key.split("!")[0];
            if (idEntry==id)
                res.push(gEntry);
        });
        return res;
    }

    public async getGeofenceInfo(top: string): Promise<Array<IGeofence>> {
        let res: Array<IGeofence>=new Array<IGeofence>();
        this.memGeofence.forEach((gEntry, key) => {
            if (gEntry.topic==top)
                res.push(gEntry);
        });
        return res;
    }
}



