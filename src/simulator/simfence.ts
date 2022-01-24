import { Position } from '../common/position'
import { Scenario } from './scenario'
import { SpatialMQTTClient } from "../client/smqttclient";
import { GeoProcessor } from '../backend/geoprocesser';
import { SimEvaluator } from './evaluator';

export class SimulatedGeofence {
    
    private static msgCounter: number=0;
    private static MESSAGE_CONTENT_PREFIX: string="CONTENT";    

    public position: Position;
    public radius: number;
    public topic: string;
    public id: string;    
    public lastAdvSent: number;
    private frequencyAdv: number;
    private seqNo: number;
    private verboseMode: true;
    private sMQTTClient: SpatialMQTTClient;
    private evaluator: SimEvaluator;
    
    public constructor(id: string, topic: string, frequency: number) {
       this.id=id;
       this.topic=topic;
       this.lastAdvSent=undefined;
       this.frequencyAdv=frequency;
       this.sMQTTClient=new SpatialMQTTClient("iot2020","mqtt2020*","mqtt://iot2020.cs.unibo.it",1883,this.id);
    }


    public setEvaluator(evaluator: SimEvaluator) {
        this.evaluator=evaluator;
    }


    public async initialize() {
        await this.sMQTTClient.connect();
    }

    public async dispose() {
        await this.sMQTTClient.disconnect();
    }

    public getSeqNo(): number {
        return this.seqNo;
    }

    public getTopic(): string {
        return this.topic;
    }

    public setFixedPosition(position: Position, radius: number) {
        this.position=position;
        this.radius=radius;
    }

    public setRandomPosition(scenario: Scenario, radius: number) {
        this.radius=radius;
        this.position=scenario.createRandomPosition();
      //  this.position=new Position(44.49470097378098, 11.341306346499298);
        if (this.verboseMode)  
            console.log("[CREATED GEOFENCE] "+this.id+"<"+this.position.latitude+","+this.position.longitude+">");
    }

    public async publishAdv(ctime: number) {
        if ((this.lastAdvSent==undefined) || ((ctime-this.lastAdvSent) >= this.frequencyAdv)) {
            let content: string=SimulatedGeofence.MESSAGE_CONTENT_PREFIX+"|"+SimulatedGeofence.msgCounter+"|"+this.id;
            this.evaluator.newAdvertisement(SimulatedGeofence.msgCounter,this.id);
            this.seqNo=SimulatedGeofence.msgCounter;
            SimulatedGeofence.msgCounter+=1;
            this.lastAdvSent=ctime;
            if (this.verboseMode)
                console.log("[SIM PUBLISH ADV] Geofence: "+this.id+" Topic: "+this.topic+" Time: "+ctime+" Content: "+content);
            await this.sMQTTClient.publicGeofence(this.position.latitude, this.position.longitude, this.radius, this.topic, content, this.id);
        }
    }

    public isAdvSpatialRelevant(dest: Position): boolean {
        const distance: number=GeoProcessor.computeDistanceGPS(this.position.latitude, this.position.longitude, dest.latitude, dest.longitude);
        if (distance<this.radius)
            return true;
        else    
            return false;
    }

}