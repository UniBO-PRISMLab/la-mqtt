import { MQTTMessage } from "../common/ireceiver";
import { Position } from "../common/position";
import { God } from "./god";
import { GeoProcessor } from '../backend/geoprocesser';

const fs = require('fs');

export class SimEvaluator {

    private mqttTotMessages: number;
    private mqttAdvMessages: number;
    private mqttRelevantAdvMessages: number;
    private label: string;
    private god: God;
    private delay: number;
    private precision: number;
    private meanDistance: number;
    private meanDistanceSmart: number;
    private privacyMetric: number;
    private privacyMetricUpdate: number;

    private static SIM_RESULT_FILE:string="mqttstat.txt";
    private static SAVE_TO_FILE_MODE: boolean=true;

    public constructor(label: string) {
        this.mqttTotMessages=0;
        this.mqttAdvMessages=0;
        this.mqttRelevantAdvMessages=0;
        this.delay=0;
        this.precision=0;
        this.god=new God();
        this.label=label;
        this.meanDistance=0;
        this.meanDistanceSmart=0;
        this.privacyMetric=0;
        this.privacyMetricUpdate=0;
    }
   


    public eventGPSSent() {
        this.mqttTotMessages=this.mqttTotMessages+1;
    }

    public eventAdvReceived(message: MQTTMessage) {
        this.mqttAdvMessages=this.mqttAdvMessages+1;
    }

    public eventAdvRelevant(isRelevant: boolean) {
        if (isRelevant==true)
            this.mqttRelevantAdvMessages+=1;
    }


    public newAdvertisement(messageNo: number, geofenceId: string) {
        this.god.newAdvertisement(messageNo,geofenceId);
    }


    public setActiveUser(messageNo: number, userId: string, ctime: number) {
        this.god.setActiveUser(messageNo, userId, ctime);
    } 


    public setNotifiedUser(messageNo: number, userId: string, ctime: number) {
        this.god.setNotifiedUser(messageNo, userId, ctime);
    } 

    public updatePrivacyMetric(value: number) {
        this.privacyMetric+=value;
        this.privacyMetricUpdate++;
    }

    public computeMean() {
        this.mqttRelevantAdvMessages=(this.mqttRelevantAdvMessages*100.0/this.mqttAdvMessages);
        this.precision=this.god.computePrecision()*100.0;
        this.delay=this.god.computeDelay();
        this.meanDistance=this.meanDistance/this.mqttTotMessages;
        this.meanDistanceSmart=this.meanDistanceSmart/this.mqttTotMessages;
        this.privacyMetric=this.privacyMetric/this.privacyMetricUpdate;
    }


    public computePositionPrivacy(realPos: Position, sentPos: Position)  {
        let distance: number=GeoProcessor.computeDistanceGPS(realPos.latitude, realPos.longitude, sentPos.latitude, sentPos.longitude);
        this.meanDistance+=distance;
    }

    public computePositionPrivacySmart(realPos: Position, sentPos: Position)  {
        let distance: number=GeoProcessor.computeDistanceGPS(realPos.latitude, realPos.longitude, sentPos.latitude, sentPos.longitude);
        this.meanDistanceSmart+=distance;
    }


    public printStat() {
        this.computeMean();
        console.log("Simulation Run Statistics");
        console.log("#MQTT_Messages_sent(total): "+this.mqttTotMessages);
        console.log("#MQTT_Advertisement_recv(total): "+this.mqttAdvMessages);
        console.log("#MQTT_Advertisement_relevant(%): "+this.mqttRelevantAdvMessages);
        console.log("#MQTT_Precision (%): "+this.precision);
        console.log("#MQTT_Delay (sec): "+this.delay);
        console.log("Privacy_distance_Mean_model (met): "+this.meanDistance);
        console.log("Privacy_distance_Trajectory_model (met): "+this.meanDistanceSmart);
       console.log("Privacy_metric_value: "+this.privacyMetric);
         
        if (SimEvaluator.SAVE_TO_FILE_MODE)
            this.saveResult();
    }


    private getStatRow(): string {
        let row: string=this.label+","+this.mqttTotMessages+","+this.mqttAdvMessages+","+this.mqttRelevantAdvMessages+","+this.precision+","+this.delay+","+this.meanDistance+","+this.meanDistanceSmart+","+this.privacyMetric+"\n";
        return row;
    }


    private saveResult() {
        fs.appendFileSync(SimEvaluator.SIM_RESULT_FILE, this.getStatRow());
    }

}


