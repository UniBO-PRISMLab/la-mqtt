import { SpatialMQTTBackEnd } from "../backend/backend";
import { PrivacyModel } from "../client/privacy/iprivacy";
import { Position } from "../common/position";
import { SimEvaluator } from "./evaluator";
import { Scenario } from "./scenario";

export class Simulator {

    private scenario: Scenario;
    private config: SimConfig;
    private simTime: number;
    private evaluator: SimEvaluator;
    private backend: SpatialMQTTBackEnd;

    constructor(config: SimConfig, backend: SpatialMQTTBackEnd) {
        this.config=config;
        this.simTime=0;
        this.backend=backend;
    }

    private async loadConfig() {
        this.evaluator=new SimEvaluator(String(this.config.numGeofences));
        this.scenario=new Scenario(this.config.scenarioLeftCorner, this.config.scenarioRightCorner, this.config.seed);
        await this.scenario.setGeofences(this.config.numGeofences, this.config.radiusGeofence, this.config.numTopics, this.config.frequencyAdvPublish);
        await this.scenario.setUsers(this.config.numUsers,this.config.maxSpeed,this.config.minSpeed,this.config.maxPauseTime, this.config.frequencyGPSPublish, this.config.privacyModel, this.config.privacyParameters);
        //await this.scenario.hackSubscriptions(this.backend);
        this.scenario.setEvaluator(this.evaluator);
    }


    public async run() {
        console.log("--- SIMULATION START ---");
        await this.loadConfig();
        for ( ; this.simTime< this.config.simDuration; this.simTime+=this.config.simSlotLength) {
            await this.scenario.update(this.config.simSlotLength, this.simTime);
            await new Promise(resolve => setTimeout(resolve, 1000));
	}
        await this.scenario.dispose();
        console.log("--- SIMULATION END ---");
        this.evaluator.printStat();
    }
}


export class SimConfig {
    public scenarioLeftCorner: Position;
    public scenarioRightCorner: Position;
    public simSlotLength: number;
    public simDuration: number;
    public numUsers: number;
    public minSpeed: number;
    public maxSpeed: number;
    public maxPauseTime: number;
    public frequencyGPSPublish: number;
    public numGeofences: number;
    public radiusGeofence: number;
    public frequencyAdvPublish: number;
    public seed: number;
    public numTopics: number;
    public privacyModel: PrivacyModel;
    public privacyParameters: string;

    public constructor() {

    }
}
