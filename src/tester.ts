import { MQTTMessage, MQTTReceiver } from './common/ireceiver';
import { SpatialMQTTClient } from './client/smqttclient'
import { SpatialMQTTBackEnd } from './backend/backend'
import { Simulator, SimConfig } from './simulator/simulator'
import { Position } from './common/position';
import { GeoPerturbation } from './client/privacy/perturbation';
import { IPrivacyManager, PrivacyModel } from './client/privacy/iprivacy';

export class Tester implements MQTTReceiver {
    
    private static BOLOGNA_LEFT_CORNER_LAT:number=44.482789890501586;
    private static BOLOGNA_LEFT_CORNER_LONG:number=11.325016021728516;
    private static BOLOGNA_RIGHT_CORNER_LAT:number=44.50715706370573;
    private static BOLOGNA_RIGHT_CORNER_LONG:number=11.362781524658203;

    //TBF
    private static MQTT_USERNAME:string="XXX";
    private static MQTT_PASSWORD:string="XXX";
    private static MQTT_URL:string="XXX";


    private client: SpatialMQTTClient;
    private backend: SpatialMQTTBackEnd;
    private simConfig: SimConfig;
    private sim: Simulator;

    constructor() {
        
    }  


    private buildSimConfiguration(numUsers: number, seed: number, numgeofence: number, geofenceSize: number, privacyModel: PrivacyModel, digitPerturbation: number, numdummy: number, frequency: number, selfTune: boolean, alphaValue: number, explorationFactor: number) {
        this.simConfig=new SimConfig();
        this.simConfig.scenarioLeftCorner=new Position(Tester.BOLOGNA_LEFT_CORNER_LAT, Tester.BOLOGNA_LEFT_CORNER_LONG);
        this.simConfig.scenarioRightCorner=new Position(Tester.BOLOGNA_RIGHT_CORNER_LAT, Tester.BOLOGNA_RIGHT_CORNER_LONG);
        this.simConfig.simSlotLength=1.0;
        this.simConfig.simDuration=60*5;
        this.simConfig.numUsers=numUsers;
        this.simConfig.maxSpeed=5.0;
        this.simConfig.minSpeed=2.0;
        this.simConfig.maxPauseTime=10;
        this.simConfig.frequencyGPSPublish=frequency;
        this.simConfig.numGeofences=numgeofence;
        this.simConfig.numTopics=2;
        this.simConfig.frequencyAdvPublish=60;
        this.simConfig.radiusGeofence=geofenceSize;
        this.simConfig.seed=seed;
        this.simConfig.privacyModel=privacyModel;
        this.simConfig.privacyParameters="{\"digit\":"+digitPerturbation+", \"numdummy\":"+numdummy+", \"interval\":"+frequency+", \"selfTune\":"+selfTune+", \"alpha\":"+alphaValue+", \"explorationFactor\":"+explorationFactor+  "}";
    }


    public async testNodes() {
        let numgeofence=20;
        let radius=300;
        let userConfigurations=[ 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000 ];
        //let userConfigurations=[10000];
        
        let randomSeeds=[112];
        for (let i: number=0; i<userConfigurations.length; i++) {
            let numUsers: number=userConfigurations[i];
            for (let j: number=0; j<randomSeeds.length; j++) {
                let seed: number=randomSeeds[j];
                await this.singleRun(numUsers, seed, numgeofence, radius, PrivacyModel.NONE, 0, 0, 5, false, 0, 0);
            }
        }
    } 


    public async testNumGeofences() {
        let radius=300;
	let numUsers=500;
        let userConfigurations=[ 5, 10, 20, 50, 100, 200, 500 ];
        //let userConfigurations=[10000];
        
        let randomSeeds=[112];
        for (let i: number=0; i<userConfigurations.length; i++) {
            let numgeofence: number=userConfigurations[i];
            for (let j: number=0; j<randomSeeds.length; j++) {
                let seed: number=randomSeeds[j];
                await this.singleRun(numUsers, seed, numgeofence, radius, PrivacyModel.NONE, 0, 0, 5, false, 0, 0);
            }
        }
    } 


    public async testPerturbation() {
        let numgeofence=20;
        let radius=300;
        let digit=[1,2,3,4,5,6];
        //let userConfigurations=[500];
        let randomSeeds=[112,234,456];
        let frequency=5;
        for (let j: number=0; j<randomSeeds.length; j++) {
            let numUsers: number=50;
            for (let i: number=0; i<digit.length; i++) {
                let seed: number=randomSeeds[j];
                await this.singleRun(numUsers, seed, numgeofence, radius, PrivacyModel.PERTURBATION, digit[i],0, frequency, false,0,0);
            }
        }
    }

    public async testDummyUpdates() {
        let numgeofence=20;
        let radius=300;
        let digit=1;
        let numDummies=[2,4,6,8,10,12];
        let randomSeeds=[112,234,456];
        let frequency=5;
        for (let j: number=0; j<randomSeeds.length; j++) {
            let numUsers: number=50;
            for (let i: number=0; i<numDummies.length; i++) {
                let seed: number=randomSeeds[j];
                await this.singleRun(numUsers, seed, numgeofence, radius, PrivacyModel.DUMMY_UPDATES, digit,numDummies[i], frequency, false,0,0);
            }
        }
    }

    public async testPercolation() {
        let numgeofence=20;
        let radius=300;
        let digit=1;
        let numDummies=[2,4,6,8,10,12];
        let randomSeeds=[112,234,456];
        let frequency=5;
        for (let j: number=0; j<randomSeeds.length; j++) {
            let numUsers: number=50;
            for (let i: number=0; i<numDummies.length; i++) {
                let seed: number=randomSeeds[j];
                await this.singleRun(numUsers, seed, numgeofence, radius, PrivacyModel.DUMMY_UPDATES, digit,numDummies[i], frequency, false, 0, 0);
            }
        }
    }

    public async testSelfTuning() {
        let numgeofence=50;
        let radius=300;
        let digit=1;
        let numDummies=1;
        let alphaValues=[0.8,0.6,0.4,0.2];
        let frequency=5;
        let numUsers: number=50;
        let seed: number=112;
        for (let j: number=0; j<alphaValues.length; j++) {
            await this.singleRun(numUsers, seed, numgeofence, radius, PrivacyModel.DUMMY_UPDATES_WITH_PERCOLATION, digit, numDummies, frequency, true, alphaValues[j], 2);
        }
    }

    
    public async testSelfTuningExploration() {
        let numgeofence=50;
        let radius=300;
        let digit=1;
        let numDummies=1;
	let alphaValues=[0.6, 0.4];
	let explorationValues=[0.5,4]   
        let frequency=5;
        let numUsers: number=50;
	let seed: number=112;
	 for (let i: number=0; i<alphaValues.length; i++) {
        	for (let j: number=0; j<explorationValues.length; j++) {
        	    await this.singleRun(numUsers, seed, numgeofence, radius, PrivacyModel.DUMMY_UPDATES_WITH_PERCOLATION, digit, numDummies, frequency, true, alphaValues[i], explorationValues[j]);
		}
	 }
    }



    public async singleRun(numUsers: number, seed: number, numgeofence: number, geofenceSize: number, privacyModel: PrivacyModel, digit: number, numdummy: number, frequency: number, selfTune: boolean, alpha: number, exploration: number) {
	
	this.backend=new SpatialMQTTBackEnd(Tester.MQTT_USERNAME,Tester.MQTT_PASSWORD,Tester.MQTT_URL,1883);    
        this.buildSimConfiguration(numUsers, seed, numgeofence, geofenceSize, privacyModel, digit, numdummy, frequency, selfTune, alpha, exploration);
        this.sim=new Simulator(this.simConfig, this.backend);

        await this.backend.start();
        await this.sim.run();
        await this.backend.stop();

    }



    public messageRecv(msg: MQTTMessage) {
        console.log("#Received message: "+msg.message+ " topic: "+msg.topic);
    }
    
}


if (require.main === module) {
    let tester: Tester=new Tester();
    tester.testNumGeofences();
}
