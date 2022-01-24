import { IGeofence, Geofence } from './model/geofence'
import { ISubscription, Subscription } from './model/subscription';

export interface IPersister {
    connect(): Promise<boolean>;
    disconnect();
    addUserPosition(userId: string, lat: number, long: number);
    addGeofence(name: string, idG: string, lat: number, long: number, rad: number, msg: string);
    addSubscription(id: string, top: string);
    getAllSubscriptions(id: string): Promise<Array<ISubscription>>;
    getGeofenceInfo(top: string): Promise<Array<IGeofence>>;

}

export enum PersisterType {
    MONGODB=0,
    MEMORY=1
}