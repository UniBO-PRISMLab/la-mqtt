import { Position } from "../common/position";
import { Scenario } from "./scenario";
import { Direction } from "../common/direction";
import { SpatialMQTTClient } from "../client/smqttclient";
import { SimEvaluator } from "./evaluator";
import { MQTTMessage, MQTTReceiver } from "../common/ireceiver";
import { IPrivacyManager, PrivacyModel } from "../client/privacy/iprivacy";
import { GeoPerturbation } from "../client/privacy/perturbation";
import { DummyUpdates } from "../client/privacy/dupdates";
import { PrivacyAttacker } from "./attacker";
import { Percolation } from "../client/privacy/percolation";
import { PrivacySet } from "../client/privacy/imetrics";

export class SimulatedUser implements MQTTReceiver {

    private id: string;
    private maxSpeed: number;
    private minSpeed: number;
    private pauseTime: number;
    private scenario: Scenario;
    private cSpeed: number;
    private cPosition: Position;
    private cDestination: Position;
    private cDirection: Direction;
    private cPauseTime: number;
    private frequencyGPSPublish: number;
    private lastGPSPublish: number;
    private cState: MobilityState;
    private sMQTTClient: SpatialMQTTClient;
    private evaluator: SimEvaluator;
    private topicSubscribed: string;
    private pManager: IPrivacyManager;
    private pAttacker: PrivacyAttacker;
    private pModel: PrivacyModel;

    private verboseMode: boolean;

      //TBF
    private static MQTT_USERNAME:string="XXX";
    private static MQTT_PASSWORD:string="XXX";
    private static MQTT_URL:string="XXX";

    constructor(id: string, maxSpeed: number, minSpeed: number, pauseTime: number, frequency: number, privacyModel: PrivacyModel, privacyParameters: string, scenario: Scenario) {
        this.id=id;
        this.maxSpeed=maxSpeed;
        this.minSpeed=minSpeed;
        this.pauseTime=pauseTime;
        this.scenario=scenario;
        this.frequencyGPSPublish=frequency;
        this.lastGPSPublish=undefined;
        this.evaluator=undefined;
        this.cState=MobilityState.IDLE;
	this.sMQTTClient=new SpatialMQTTClient(SimulatedUser.MQTT_USERNAME,SimulatedUser.MQTT_PASSWORD,SimulatedUser.MQTT_URL,1883,this.id);    
        
        this.pManager=undefined;
        this.setPrivacyModel(privacyModel, privacyParameters);
    }
    
    public setPrivacyModel(privacyModel: PrivacyModel, params: string) {
        this.pModel=privacyModel;
        this.sMQTTClient.setPrivacyModel(privacyModel, this.scenario.rng,params);
        /*
        switch(privacyModel) {
            case PrivacyModel.PERTURBATION:
                this.pManager=new GeoPerturbation(this.scenario.rng);
                this.pManager.setParameters(JSON.parse(params));
                break;
            case PrivacyModel.DUMMY_UPDATES:
                this.pManager=new DummyUpdates(this.scenario.rng);
                this.pManager.setParameters(JSON.parse(params));
                this.pAttacker=new PrivacyAttacker(JSON.parse(params)["numdummy"]);
                break;
            case PrivacyModel.DUMMY_UPDATES_WITH_PERCOLATION:
                this.pManager=new Percolation(this.scenario.rng);
                this.pManager.setParameters(JSON.parse(params));
                this.pAttacker=new PrivacyAttacker(JSON.parse(params)["numdummy"]);
                break;
        }*/
    }

    public async initialize() {
        await this.sMQTTClient.connect();
        const topicName: string=this.scenario.generateRandomTopic();
        //HHH
        await this.sMQTTClient.subscribeGeofence(topicName, this);
        //await this.sMQTTClient.subscribeGeofence(topicName, this.scenario);
        this.topicSubscribed=topicName;
        if (this.verboseMode)
            console.log("[SIM SUBSCRIBE] User: "+this.id+" Topic: "+this.topicSubscribed);
    }


    public getTopicSubscribed(): string {
        return this.topicSubscribed;
    }

    public getId(): string {
        return this.id;
    }

    public getPosition(): Position {
        return this.cPosition;
    }

    public async dispose() {
        await this.sMQTTClient.disconnect();
    }

    public setEvaluator(evaluator: SimEvaluator) {
        this.evaluator=evaluator;
    }

    public async publishPosition(ctime: number) {
        if ((this.lastGPSPublish==undefined) || ((ctime-this.lastGPSPublish) >= this.frequencyGPSPublish)) {
            this.lastGPSPublish=ctime;
            let posPrivacy: Position;
            if (this.pModel!=PrivacyModel.NONE) {
                posPrivacy=await this.sMQTTClient.publicPosition(this.cPosition.latitude, this.cPosition.longitude);
                if (this.evaluator!=undefined) {
                    this.evaluator.eventGPSSent();
                    this.evaluator.computePositionPrivacy(this.cPosition, posPrivacy);
                    if (this.pAttacker!=undefined) {
                        if (this.pAttacker.isFakeUpdate(posPrivacy)==false)
                            this.evaluator.computePositionPrivacySmart(this.cPosition, posPrivacy);
                    }
                    let privacyValue: number=this.sMQTTClient.getMQTTStat().getIstantaneousPrivacyMetric();
                    if (privacyValue!=PrivacySet.NO_METRIC_VALUE)
                        this.evaluator.updatePrivacyMetric(privacyValue);
                     
                }
            } else  {
                await this.sMQTTClient.publicPosition(this.cPosition.latitude, this.cPosition.longitude);
                if (this.evaluator!=undefined) 
                    this.evaluator.eventGPSSent();
            }
        }
    }


    /*public async publishPosition(ctime: number) {
        if ((this.lastGPSPublish==undefined) || ((ctime-this.lastGPSPublish) >= this.frequencyGPSPublish)) {
            this.lastGPSPublish=ctime;
            let posPrivacy: Position;
            if (this.pManager!=undefined) {
                posPrivacy=this.pManager.transform(this.cPosition);
                await this.sMQTTClient.publicPosition(posPrivacy.latitude, posPrivacy.longitude);
                if (this.evaluator!=undefined) {
                    this.evaluator.eventGPSSent();
                    this.evaluator.computePositionPrivacy(this.cPosition, posPrivacy);
                    if (this.pAttacker!=undefined) {
                        if (this.pAttacker.isFakeUpdate(posPrivacy)==false)
                            this.evaluator.computePositionPrivacySmart(this.cPosition, posPrivacy);
                    }
                    let privacyValue: number=this.pManager.getPrivacyMetricValue();
                    if (privacyValue!=PrivacySet.NO_METRIC_VALUE)
                        this.evaluator.updatePrivacyMetric(privacyValue);
                     
                }
            } else  {
                await this.sMQTTClient.publicPosition(this.cPosition.latitude, this.cPosition.longitude);
                if (this.evaluator!=undefined) 
                    this.evaluator.eventGPSSent();
            }
        }
    }
*/
    public setRandomPosition() {
        this.cPosition=this.scenario.createRandomPosition();
        //this.cPosition=new Position(44.50374616853628, 11.345168727453526);
        if (this.verboseMode)
            console.log("[CREATED USER] Id: "+this.id+" <"+this.cPosition.latitude+","+this.cPosition.longitude+">");
    }

    private setRandomDestination() {
        this.cSpeed=this.scenario.rng.nextDouble()*Math.abs(this.maxSpeed-this.minSpeed)+this.minSpeed;
        this.cDestination=this.scenario.createRandomPosition();
        this.cDirection=new Direction(this.cPosition,this.cDestination,this.cSpeed);
    //    if (this.pModel==PrivacyModel.DUMMY_UPDATES_WITH_PERCOLATION)
      //      this.pManager.setTrajectory(this.cPosition,this.cDestination);
        if (this.pModel==PrivacyModel.DUMMY_UPDATES_WITH_PERCOLATION)
            this.sMQTTClient.setTrajectory(this.cPosition,this.cDestination);
      
    }

    
    public async move(timeAdvance: number, currentTime: number) {
        if (this.cState==MobilityState.IDLE) {
            this.setRandomDestination();
            this.cPosition=this.cDirection.computeAdvance(this.cSpeed, timeAdvance);
            this.cState=MobilityState.MOVING;
        } else if (this.cState==MobilityState.MOVING) {
            if (this.cDirection.isDestinationReached()) {
                this.cState=MobilityState.PAUSED;
                this.cPauseTime=Math.floor(this.scenario.rng.nextDouble()* this.pauseTime)+timeAdvance;
            } else {
                this.cPosition=this.cDirection.computeAdvance(this.cSpeed, timeAdvance);
                this.publishPosition(currentTime);
            }
        } else if (this.cState==MobilityState.PAUSED) {
            this.cPauseTime-=timeAdvance;
            if (this.cPauseTime<=0) {
                this.setRandomDestination();
                this.cState=MobilityState.MOVING;
                this.cPauseTime=0;
            }
        }
    }

    public messageRecv(msg: MQTTMessage) {
        let payload: string=String(msg.message);
        this.evaluator.eventAdvReceived(msg);
        let jsonOb=JSON.parse(payload);
        let gfId: number=Number(jsonOb["message"].split("|")[2].split("_")[1]);
        this.evaluator.setNotifiedUser(this.scenario.listGeofence[gfId].getSeqNo(),this.getId(),this.scenario.cTime);
        const isRelevant: boolean=this.scenario.listGeofence[gfId].isAdvSpatialRelevant(this.getPosition());
        this.evaluator.eventAdvRelevant(isRelevant);
    }

}

enum MobilityState {
    IDLE=0,
    PAUSED=1,
    MOVING=2
}
