import { BrokerConf, BrokerConnector } from '../common/iconnector'
import { MosquittoConnector } from '../common/mosquittoConnector';
import { MQTTReceiver, MQTTMessage } from '../common/ireceiver'
import { Position } from '../common/position';
import { MQTTSpatialMessages } from '../common/messages';
import { MQTTClient } from '../common/client';
import { MQTTClientMeasurer } from './measurer';
import { IPrivacyManager, PrivacyModel } from './privacy/iprivacy';
import { GeoPerturbation } from './privacy/perturbation';
import { DummyUpdates } from './privacy/dupdates';
import { Percolation } from './privacy/percolation';
import { RNG } from '../simulator/random';
import { PrivacySet } from './privacy/imetrics';
import { ParameterTuner } from './privacy/learning';

export class SpatialMQTTClient extends MQTTClient  {

    private mqttMeasurer: MQTTClientMeasurer;
    private pManager: IPrivacyManager;
    private pModel: PrivacyModel;
    private rng: RNG;
    
    private selfTuneMode: boolean;
    private tunerAlgorithm: ParameterTuner;
    private dummyOptions=[1,2,4,8];
    private perturbationOptions=[1,2,4];
   
    /** 
     * @param username: MQTT broker access credential
     * @param password: MQTT broker access credential
     * @param host: MQTT broker IP
     * @param port: MQTT broker port number (default 1883)
     * @param clientId: MQTT client name
     */
    constructor (username: string, password: string, host: string, port: number, clientId: string) {
        super(username,password,host,port, clientId);
        this.mqttMeasurer=new MQTTClientMeasurer();
        this.pModel=PrivacyModel.NONE;
        this.pManager=undefined;
        this.tunerAlgorithm=undefined;
        this.selfTuneMode=false;
    }

    /** 
     * Publish the GPS position on the MQTT broker (used by MCs only)
     * @param latitude: Current GPS latitude value (real one, no perturbation)
     * @param longitude: Current GPS latitude value (real one, no perturbation)
     * @returns position:  GPS position published on the MQTT broker (real + privacy mechanisms, if any)
     */
    public async publicPosition(latitude: number, longitude: number): Promise<Position> {
        let positionOrig: Position=new Position(latitude, longitude);
        let positionTsf: Position=positionOrig;
       
        if (this.pModel!=PrivacyModel.NONE) 
            positionTsf=this.pManager.transform(positionOrig);
          
        this.mqttMeasurer.trackGPSPublish(positionOrig);
            
        if ((this.pModel!=PrivacyModel.NONE) && (this.selfTuneMode==true))
                this.tunerAlgorithm.update(positionOrig);
        
        
        const topic: string = MQTTSpatialMessages.TOPIC_PUBLISH_POSITION;
        let message: string= "{ "+positionTsf.toString()+", \"id\": \""+this.clientId+"\" }";
        await this.publish(topic, message);
        return positionTsf;
    }


    /** 
     * Publish a content update from the LDS (IoT data producer)
     * NOTE: This method assumes circular geofence region
     * @param latitude: Current GPS latitude value of the producer
     * @param longitude: Current GPS longitude value of the producer
     * @param radius: Radius (in meters) of the dissemination area 
     * @param topic: Channel name/source data type (e.g. temperature)
     * @param message: Content to be disseminated (string)
     * @param geofenceId: unique id  of the LDS/data producer (e.g. sensor #10)
     */
    public async publicGeofence(latitude: number, longitude: number, radius: number, topic: string, message: string, geofenceId: string) {
        let position: Position=new Position(latitude, longitude);
        const topicN: string = MQTTSpatialMessages.TOPIC_PUBLISH_GEOFENCE;
        let messageN: string= "{ "+position.toString()+", \"id\": \""+geofenceId+"\"";
        messageN=messageN+", \"radius\": "+radius+", \"message\": \""+message+"\", \"topicGeofence\": \""+topic+'\" }';
	await this.publish(topic, messageN);
        //HHH
	//await this.publish(topicN, messageN);
        //this.mqttMeasurer.trackGeofencePublish();
    }


    /** 
     * Topic subscription (used by MC only)
     * @param topic: LDS channel name to subscribe to (e.g. temperature)
     * @param callback: MQTTReceiver object to notify when a new MQTT message has been received  
     */
    public async subscribeGeofence(topic: string, callback: MQTTReceiver) {
        const topicNew: string = this.generateGeofenceTopic(topic);
        this.setCallback(callback);
        this.setCallback(this.mqttMeasurer);
        await this.subscribe(topic);
        //HHH
	//await this.subscribe(topicNew);
        let messageN: string= "{ \"topic\": \""+topic+"\", \"id\": \""+this.clientId+"\"}";
        await this.publish(MQTTSpatialMessages.TOPIC_PUBLISH_SUBSCRIPTION,messageN)
    } 


    public setPrivacyModel(privacyModel: PrivacyModel, rng: RNG, params: string) {
        this.pModel=privacyModel;
        this.rng=rng;
        switch(privacyModel) {
            case PrivacyModel.PERTURBATION:
                this.pManager=new GeoPerturbation(this.rng);
                this.pManager.setParameters(JSON.parse(params));
                break;
            case PrivacyModel.DUMMY_UPDATES:
                this.pManager=new DummyUpdates(this.rng);
                this.pManager.setParameters(JSON.parse(params));
                //this.pAttacker=new PrivacyAttacker(JSON.parse(params)["numdummy"]);
                break;
            case PrivacyModel.DUMMY_UPDATES_WITH_PERCOLATION:
                this.pManager=new Percolation(this.rng);
                this.pManager.setParameters(JSON.parse(params));
                //this.pAttacker=new PrivacyAttacker(JSON.parse(params)["numdummy"]);
                break;
        }

        this.mqttMeasurer.setPrivacyModel(this.pManager);
   
        if (JSON.parse(params)["selfTune"]==true) {
            this.selfTuneMode=true;
            let alpha: number=JSON.parse(params)["alpha"];
            this.tunerAlgorithm=new ParameterTuner(this.dummyOptions,this.perturbationOptions,alpha,this.pManager,this.mqttMeasurer,this.rng,JSON.parse(params)["interval"], JSON.parse(params)["explorationFactor"]);
        }
        
    }

    public getMQTTStat(): MQTTClientMeasurer {
        return this.mqttMeasurer;
    }

    public setTrajectory(cPosition: Position, dPosition: Position) {
        if (this.pModel==PrivacyModel.DUMMY_UPDATES_WITH_PERCOLATION)
            this.pManager.setTrajectory(cPosition,dPosition);
    }


    private generateGeofenceTopic(topic:string): string {
        const newTopic: string=topic+"_"+this.clientId;
        return newTopic;
    }

}

