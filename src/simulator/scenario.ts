import { Position } from '../common/position'
import { RNG } from './random'
import { SimulatedGeofence } from './simfence'
import { SimulatedUser } from './user'
import { SimEvaluator } from './evaluator'
import { MQTTMessage, MQTTReceiver } from '../common/ireceiver';
import { SpatialMQTTBackEnd } from '../backend/backend'
import { PrivacyModel } from "../client/privacy/iprivacy";

export class Scenario implements MQTTReceiver {
    public leftCorner: Position;
    public rightCorner: Position;
    public listGeofence: Array<SimulatedGeofence>;
    public listUser: Array<SimulatedUser>;
    
    public rng: RNG;
    private numTopics: number;
    private evaluator: SimEvaluator;
    public cTime: number;
    public seed: number;

    private static DEFAULT_TOPIC_PREFIX="T";
    private static DEFAULT_GEOFENCE_PREFIX="GF";
    private static DEFAULT_USER_PREFIX="U";

   
    
    constructor (left: Position, right: Position, seed: number) {
        this.leftCorner=left;
        this.rightCorner=right;
        this.numTopics=0;
        this.rng=new RNG(seed);
        this.seed=seed;
        this.listGeofence=new Array<SimulatedGeofence>();
        this.listUser=new Array<SimulatedUser>();

    }
    

    public setEvaluator(evaluator: SimEvaluator) {
        this.evaluator=evaluator;
        if (this.listUser!=undefined)
            for (let i: number=0; i< this.listUser.length; i++) 
                this.listUser[i].setEvaluator(evaluator);
        if (this.listGeofence!=undefined)
            for (let i: number=0; i< this.listGeofence.length; i++) 
                this.listGeofence[i].setEvaluator(evaluator);
    
    }


    public async setGeofences(numgeofence: number, radius: number, numtopic: number, frequency: number) {
        this.numTopics=numtopic;
        const gfencePerTopic: number=Math.floor(numgeofence/numtopic);
        let ctopic: number=0;
        let counterTopic: number=0;
        let topicName: string;
        for (let i: number=0; i< numgeofence; i++) {
            const id:string=Scenario.DEFAULT_GEOFENCE_PREFIX+"_"+String(i);
            if (gfencePerTopic==counterTopic) {
                counterTopic=0;
                ctopic+=1;
            } else 
                counterTopic++;
            topicName=Scenario.DEFAULT_TOPIC_PREFIX+"_"+String(ctopic);
            let gfence:SimulatedGeofence=new SimulatedGeofence(id,topicName, frequency);
            gfence.setRandomPosition(this, radius);
            this.listGeofence.push(gfence); 
            await gfence.initialize();
        }
    }

    public async setUsers(numuser: number, maxSpeed: number, minSpeed: number, pausetime: number, frequency: number,  privacyModel: PrivacyModel, privacyParameters: string) {
        for (let i: number=0; i< numuser; i++) {
            const id:string=Scenario.DEFAULT_USER_PREFIX+"_"+String(i);
            let user:SimulatedUser=new SimulatedUser(id,maxSpeed, minSpeed, pausetime, frequency, privacyModel, privacyParameters, this);
            user.setRandomPosition();
            this.listUser.push(user); 
            await user.initialize();
        }
    }

    public async hackSubscriptions(backend: SpatialMQTTBackEnd) {
        for (let i: number=0; i< this.listUser.length; i++) {
            const topic: string=this.listUser[i].getTopicSubscribed();
            const id:string=this.listUser[i].getId();
            await backend.newSubscribeEvent(id,topic);
        } 
    }

    public async dispose() {
        for (let i: number=0; i< this.listUser.length; i++) 
            await this.listUser[i].dispose();
        for (let i: number=0; i< this.listGeofence.length; i++) 
            await this.listGeofence[i].dispose();
         
    }


    public createRandomPosition(): Position {
        let maxLat=Math.abs(this.leftCorner.latitude - this.rightCorner.latitude);
        let maxLong=Math.abs(this.leftCorner.longitude - this.rightCorner.longitude);
        let randomLat=this.rng.nextDouble()*maxLat+Math.min(this.leftCorner.latitude,this.rightCorner.latitude);
        let randomLong=this.rng.nextDouble()*maxLong+Math.min(this.leftCorner.longitude,this.rightCorner.longitude);
        let nPosition: Position=new Position(randomLat, randomLong);
        return nPosition;
        
    }
    public async update(timeAdvance: number, currentTime: number) {
       for (let i: number=0; i< this.listGeofence.length; i++) 
            await this.listGeofence[i].publishAdv(currentTime);
        for (let i: number=0; i< this.listUser.length; i++) 
            await this.listUser[i].move(timeAdvance, currentTime);
   
      	this.cTime=currentTime;
        // FOR STATS ONLY
        for (let i: number=0; i< this.listUser.length; i++) {
            for (let j: number=0; j< this.listGeofence.length; j++) {
                let isEntered: boolean=this.listGeofence[j].isAdvSpatialRelevant(this.listUser[i].getPosition());
                if (isEntered && (this.listGeofence[j].getTopic()==this.listUser[i].getTopicSubscribed()))
                    this.evaluator.setActiveUser(this.listGeofence[j].getSeqNo(), this.listUser[i].getId(), currentTime);
            }
        }
        
    }

    public generateRandomTopic(): string {
        const topicNo: number= this.rng.nextInt(0,this.numTopics);
        return (Scenario.DEFAULT_TOPIC_PREFIX+"_"+topicNo);
    }


    public messageRecv(msg: MQTTMessage) {
        //let payload: string=String(msg.message);
        let payload: string=msg.getContent();
        this.evaluator.eventAdvReceived(msg);
        let gfId: number=Number(payload.split("|")[2].split("_")[1]);
        let userId: number=Number(msg.topic.split("_")[3]);
        if ((userId < this.listUser.length) && (gfId < this.listGeofence.length)) { 
            this.evaluator.setNotifiedUser(this.listGeofence[gfId].getSeqNo(),this.listUser[userId].getId(),this.cTime);
            const isRelevant: boolean=this.listGeofence[gfId].isAdvSpatialRelevant(this.listUser[userId].getPosition());
            this.evaluator.eventAdvRelevant(isRelevant);
        }
    }

}
