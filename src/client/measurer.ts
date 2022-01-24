import { MQTTMessage, MQTTReceiver } from "../common/ireceiver";
import { Position } from "../common/position";
import { Direction } from "../common/direction";
import { IPrivacyManager, PrivacyModel } from "./privacy/iprivacy";
import { PrivacySet } from "./privacy/imetrics";

export class MQTTClientMeasurer implements MQTTReceiver {

    private static RELEVANCE_DISTANCE: number = 300.0;
    private static DEFAULT_SPATIAL_ACCURACY: number = 0.30;

    private numPublishSent: number;
    private numNotificationRecv: number;
    private numNotificationRelevant: number;
    private spatialAccuracy: number;
    private pManager: IPrivacyManager;

    private numNotificationRecvPerSlot: number;
    private numNotificationRelevantPerSlot: number;
    private spatialAccuracyPerSlot: number;
    private privacyPerSlot: number;
    private numPrivacySamples: number;

    private cPosition: Position;

    public constructor() {
        this.numPublishSent=0;
        this.numNotificationRecv=0;
        this.numNotificationRelevant=0;
        this.spatialAccuracy=0;
        this.cPosition=undefined;
        this.numNotificationRecvPerSlot=0;
        this.numNotificationRelevantPerSlot=0;
        this.spatialAccuracyPerSlot=0;
        this.privacyPerSlot=0;
        this.numPrivacySamples=0;
        this.pManager=undefined;
    }


    public setPrivacyModel(pm: IPrivacyManager) {
        this.pManager=pm;
    }

    public messageRecv(message: MQTTMessage) {
        this.numNotificationRecv+=1;
        this.numNotificationRecvPerSlot+=1;
        let posGf: Position=message.getPositionFromMessage();
	if (this.cPosition!=undefined) {
            let distance: number=Direction.computeDistanceGPS(posGf.latitude, posGf.longitude, this.cPosition.latitude, this.cPosition.longitude);
	    if (distance<MQTTClientMeasurer.RELEVANCE_DISTANCE) {
                this.numNotificationRelevant+=1;
                this.numNotificationRelevantPerSlot+=1;
                this.spatialAccuracy=(this.numNotificationRelevant*1.0)/this.numNotificationRecv;
                this.spatialAccuracyPerSlot=(this.numNotificationRelevantPerSlot*1.0)/this.numNotificationRecvPerSlot;
            }
        }  
    }

    public trackGPSPublish(cPos: Position) {
        this.numPublishSent+=1;
	this.cPosition=cPos;
	if (this.pManager!=null)
	        this.updatePrivacyPerSlot();
    }

    public trackGeofencePublish() {
        this.numPublishSent+=1;
    }

    public getNumberPublishSent():number{
        return this.numPublishSent;
    }

    public getNumberNotificationRecv():number{
        return this.numNotificationRecv;
    }

    public getSpatialAccuracy():number{
        return this.spatialAccuracy;
    }

    public getNumberNotificationRecvPerSlot():number{
        return this.numNotificationRecvPerSlot;
    }

    public getSpatialAccuracyPerSlot():number{
        if (this.numNotificationRecvPerSlot>0)
            return this.spatialAccuracyPerSlot;
        else
            return MQTTClientMeasurer.DEFAULT_SPATIAL_ACCURACY;
    }

    public getPrivacyPerSlot():number {
        if (this.numPrivacySamples>0)
            return this.privacyPerSlot/this.numPrivacySamples;
        else
            return PrivacySet.NO_METRIC_VALUE; 
    }


    public updatePrivacyPerSlot() {
        let value: number=this.pManager.getPrivacyMetricValue(); 
        if (value != PrivacySet.NO_METRIC_VALUE) {
            this.privacyPerSlot+=value;
            this.numPrivacySamples+=1;
        }
    }

    public getIstantaneousPrivacyMetric() {
        if (this.pManager!=undefined)
            return this.pManager.getPrivacyMetricValue();
        else
            return PrivacySet.NO_METRIC_VALUE;
    }


    public resetLatest() {
        this.numNotificationRecvPerSlot=0;
        this.spatialAccuracyPerSlot=0;
        this.numNotificationRelevantPerSlot=0;
        this.privacyPerSlot=0;
        this.numPrivacySamples=0;
    }


}
