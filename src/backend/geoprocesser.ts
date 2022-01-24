import { IPersister } from './ipersister';
import { ISubscription, Subscription } from './model/subscription';
import { IGeofence } from './model/geofence';
import { SpatialMQTTBackEnd } from './backend';

const geolib = require('geolib');
export class GeoProcessor {

    private persister: IPersister;
    private callback: SpatialMQTTBackEnd;

    constructor(persister: IPersister, callback: SpatialMQTTBackEnd) {
        this.persister=persister;
        this.callback=callback;
    }

    public async processUpdate(clientId: string, latitude: number, longitude: number) {
        let subList: Array<ISubscription>=await this.persister.getAllSubscriptions(clientId);
        for (let i:number=0; i<subList.length; i++) {
            let geofenceList: Array<IGeofence>=await this.persister.getGeofenceInfo(subList[i].topic);
            for (let j:number=0; j<geofenceList.length; j++) {
                let inGeofence:boolean=this.checkWithinGeofence(geofenceList[j], latitude, longitude);
                if (inGeofence==true) {
                    let msgJSON=this.buildMessageJSON(geofenceList[j]);
                    this.callback.advertiseClient(geofenceList[j].id, geofenceList[j].topic, clientId, msgJSON);
                }
            }
        }
    }

    
    private buildMessageJSON(geofence: IGeofence): string {
        let msg: string='{ "message": "'+geofence.message+'", "latitude": '+geofence.latitude+', "longitude": '+geofence.longitude+'}';
        return msg;
    } 


    private checkWithinGeofence(geofence: IGeofence, latitude: number, longitude: number) {
        let distance: number=GeoProcessor.computeDistanceGPS(geofence.latitude, geofence.longitude,latitude,longitude);
       // console.log("DISTANCE to gf:"+geofence.id+" D: "+distance);
	if (distance < geofence.radius)
            return true;
        else    
            return false;
    }

    
    public static computeDistanceGPS(lat1: number, long1: number, lat2: number, long2: number) {
        let distance=geolib.getDistance(
            { latitude: lat1, longitude: long1 },
            { latitude: lat2, longitude: long2 }
        );
        return distance;
    }

}
