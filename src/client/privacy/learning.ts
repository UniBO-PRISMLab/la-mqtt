import { IPrivacyManager } from "./iprivacy";
import { MQTTClientMeasurer } from "../measurer";
import { RNG } from "../../simulator/random";
import { Position } from "../../common/position";
import { PrivacySet } from "./imetrics";

export class ParameterTuner {
    
    private static MAX_TEMPERATURE: number=10.0;
    private static MIN_TEMPERATURE: number=0.10;
    private EXP_FOR_STATES: number=2.0;
    private static SLOT_DURATION: number=540.0;

    private cConf: Configuration;
    private cAction: number;
    private cReward: number;
    private qTable: QTable;
    private pManager: IPrivacyManager;
    private mqttMeasurer: MQTTClientMeasurer;
    private alpha: number;
    private temperature: number;
    private deltaTemperature: number;
    private frequency: number;
    private slotTime: number;
    private slotNumber: number;
    
    
    public constructor(dummyUpdateValues: Array<number>, perturbationValues: Array<number>, alpha: number, pm: IPrivacyManager, measurer: MQTTClientMeasurer, rng: RNG, frequency: number, exploration: number) {
        this.cConf=new Configuration(dummyUpdateValues,perturbationValues);
        this.pManager=pm;
        this.alpha=alpha;
        this.mqttMeasurer=measurer;
        this.qTable=new QTable(this.cConf, dummyUpdateValues,perturbationValues, rng);
        this.temperature=ParameterTuner.MAX_TEMPERATURE;
        this.cAction=this.cConf.getConfigNumber();
        this.frequency=frequency;
        this.implementAction();
        this.slotTime=0;
	this.slotNumber=0;
	this.EXP_FOR_STATES=exploration;
	this.deltaTemperature=(ParameterTuner.MAX_TEMPERATURE-ParameterTuner.MIN_TEMPERATURE)/(this.qTable.getNumEntries(this.cConf)*this.EXP_FOR_STATES);
	console.log("EXPLORATION "+this.EXP_FOR_STATES+" Delta "+this.deltaTemperature);

    }

    public getReward() {
        this.cReward=this.mqttMeasurer.getPrivacyPerSlot()*this.alpha+(1-this.alpha)*this.mqttMeasurer.getSpatialAccuracyPerSlot();
        console.log("[REW] TIME: "+this.slotNumber+" REWARD: "+this.cReward+" "+" P: "+this.mqttMeasurer.getPrivacyPerSlot()+" SA: "+this.mqttMeasurer.getSpatialAccuracyPerSlot()+" DU: "+this.cConf.cDummyValue+"  PE: "+this.cConf.cPerturbationValue+" NN: "+this.mqttMeasurer.getNumberNotificationRecvPerSlot());
        return this.cReward;
    }


    public update(cPosition: Position) {
        this.slotTime+=this.frequency;
        if ((this.mqttMeasurer.getPrivacyPerSlot() != PrivacySet.NO_METRIC_VALUE) && (this.slotTime >= ParameterTuner.SLOT_DURATION)) {
            this.qTable.update(this.cConf,this.cAction,cPosition,this.getReward());
            this.cAction=this.qTable.getBestAction(cPosition,this.cConf,this.temperature);
            this.implementAction();
            this.adjustTemperature();
            this.mqttMeasurer.resetLatest();
            this.slotTime=0;
            
        }
        this.slotNumber+=1;
    }


    private adjustTemperature() {
        
        if (this.temperature>ParameterTuner.MIN_TEMPERATURE)
            this.temperature-=this.deltaTemperature;
    }

    private implementAction() {
        this.cConf.setConfiguration(this.cAction);
        let privacyParameters: string="{\"digit\":"+this.cConf.cPerturbationValue+", \"numdummy\":"+this.cConf.cDummyValue+", \"interval\":"+this.frequency+" }";
        console.log(privacyParameters);
        this.pManager.setParameters(JSON.parse(privacyParameters));
    }
}



class QTable {
    
    private qTable: Map<string, number>;
    private static DEFAULT_VALUE: number=-1;
    private static GAMMA: number=0.5;
    private rng: RNG;
    private gr:GridRegion;
        
    
    public constructor(conf: Configuration, dummyUpdateValues: Array<number>,perturbationValues: Array<number>, rng: RNG) {
        this.qTable=new Map<string, number>();
        this.gr=new GridRegion();
        this.rng=rng;
        for (let i:number=0; i<conf.getNumConfigurations(); i++)
                for (let k:number=0; k<this.gr.getNumRegions(); k++) {
                        let stateVal: string=this.encode(k,i);
                        this.qTable.set(stateVal,QTable.DEFAULT_VALUE); 
                    } 
    } 
    

    public getNumEntries(conf:Configuration): number {
        return this.gr.getNumRegions() * conf.getNumConfigurations();
    }

    private encode(gridCell: number, configNumber: number): string {
        let str:string=String(gridCell)+"_"+String(configNumber);
        return str;
    }

   
    public update(conf: Configuration, action: number, cPosition: Position, reward: number) {
        let gridCell: number=this.gr.getCurrentRegion(cPosition);
        let state:string=this.encode(gridCell, conf.getConfigNumber());
        let val: number=0;
        if (this.qTable.get(state)==QTable.DEFAULT_VALUE)
            val=reward;
        else
            val=QTable.GAMMA*reward + (1-QTable.GAMMA)*this.qTable.get(state);
        console.log("State: "+state+" Qtable: "+val+" "+"Reward: "+reward);
        this.qTable.set(state, val);
    }


    public getBestAction(cPosition: Position, conf: Configuration, temperature: number): number {
        let gridCell: number=this.gr.getCurrentRegion(cPosition);
        let probAction: Array<number>=new Array<number>();
        let bestAction:number=undefined;
        let probTot: number=0;
        for (let action:number=0; action<conf.getNumConfigurations(); action++) {
            let state:string=this.encode(gridCell, action);
            let value: number=this.qTable.get(state);
            probAction[action]=Math.exp(value/temperature);
            probTot+=probAction[action];
        }
        for (let action:number=0; action<conf.getNumConfigurations(); action++) {
            probAction[action]= probAction[action] / probTot;
        }
        
        let ranValue: number=this.rng.nextDouble();
        let end: boolean=false;
        let base: number=0;
        for (let action:number=0; ((action<conf.getNumConfigurations()) && (end==false)); action++) {
            base=base+probAction[action];
            if (ranValue<=base) {
                end=true;
                bestAction=action;
            }
        }
        console.log("BestAction: "+bestAction+" DU: "+conf.getDummiesFromConfigNumber(bestAction)+" PE: "+conf.getPerturbationFromConfigNumber(bestAction));
        return bestAction;
    }

}

class GridRegion {

    private static LEFT_CORNER_LAT:number=44.482789890501586;
    private static LEFT_CORNER_LONG:number=11.325016021728516;
    private static RIGHT_CORNER_LAT:number=44.50715706370573;
    private static RIGHT_CORNER_LONG:number=11.362781524658203;
    private static NUM_REGIONS_PER_SIZE: number=2;
    private regionSizeLat: number;
    private regionSizeLong: number;

    public constructor() {
        this.regionSizeLat=(GridRegion.RIGHT_CORNER_LAT-GridRegion.LEFT_CORNER_LAT)/GridRegion.NUM_REGIONS_PER_SIZE;
        this.regionSizeLong=(GridRegion.RIGHT_CORNER_LONG-GridRegion.LEFT_CORNER_LONG)/GridRegion.NUM_REGIONS_PER_SIZE;
    }

    public getNumRegions(): number {
        return GridRegion.NUM_REGIONS_PER_SIZE*GridRegion.NUM_REGIONS_PER_SIZE;
    }

    public getCurrentRegion(cPosition: Position) {
        let gridX: number=Math.floor((cPosition.latitude-GridRegion.LEFT_CORNER_LAT)/this.regionSizeLat);
        let gridY: number=Math.floor((cPosition.longitude-GridRegion.LEFT_CORNER_LONG)/this.regionSizeLong);
        return gridX*GridRegion.NUM_REGIONS_PER_SIZE+gridY;
    }

}

class Configuration {
    public cDummyValue: number;
    public cDummyIndex: number;
    public cPerturbationValue: number;
    public cPerturbationIndex: number; 
   
    private dummyUpdateValues: Array<number>;
    private perturbationValues: Array<number>;
   
    public constructor(dummyUpdateValues: Array<number>,perturbationValues: Array<number>) {
        this.dummyUpdateValues=dummyUpdateValues;
        this.perturbationValues=perturbationValues;
        this.cDummyIndex=0;
        this.cPerturbationIndex=0;
        this.cDummyValue=this.dummyUpdateValues[this.cDummyIndex];
        this.cPerturbationValue=this.perturbationValues[this.cPerturbationIndex];
    }

    public getNumConfigurations(): number {
        return this.dummyUpdateValues.length*this.perturbationValues.length;
    }

    public setConfiguration(action: number) {
        this.cDummyIndex = action % this.dummyUpdateValues.length;
        this.cPerturbationIndex = Math.floor(action / this.dummyUpdateValues.length);
        this.cDummyValue=this.dummyUpdateValues[this.cDummyIndex];
        this.cPerturbationValue=this.perturbationValues[this.cPerturbationIndex];
    }

    public getConfigNumber(): number {
        return ((this.cPerturbationIndex*this.dummyUpdateValues.length) + this.cDummyIndex);
    }

    public getDummiesFromConfigNumber(val: number): number {
        let index: number = val % this.dummyUpdateValues.length;
        return this.dummyUpdateValues[index];
    }

    public getPerturbationFromConfigNumber(val: number): number {
        let index: number = Math.floor(val / this.dummyUpdateValues.length);
        return this.perturbationValues[index];
    }


}
    
