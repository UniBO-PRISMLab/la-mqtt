import { Position } from "../../common/position";
import { IPrivacyManager } from "./iprivacy";
import { GeoPerturbation } from "./perturbation";
import { RNG } from "../../simulator/random";
import { Scenario } from "../../simulator/scenario";
import { IPrivacyMetrics, PrivacySet } from "./imetrics";
import { EntropyMetrics } from "./entropy";

export class DummyUpdates implements IPrivacyManager {
    
    private numUpdates: number;
    private perturbation: GeoPerturbation;
    private sequenceNo: number;
    private numWithinSequence: number;
    private rng: RNG;
    private metric: IPrivacyMetrics;
    private ps: PrivacySet;
    private metricValue: number;
   
    
    constructor(rng: RNG) {
        this.perturbation=new GeoPerturbation(rng);
        this.rng=rng;
        this.numWithinSequence=this.generatePosition();
        this.sequenceNo=0;
        this.metricValue=PrivacySet.NO_METRIC_VALUE;
        this.ps=new PrivacySet();
        this.metric=new EntropyMetrics();
    }

    public transform(cPosition: Position): Position {
        if ((this.sequenceNo==this.numWithinSequence)) {
            this.sequenceNo+=1;
            this.ps.add(cPosition);
            if (this.sequenceNo>=this.numUpdates) {
                this.sequenceNo=0;
                this.numWithinSequence=this.generatePosition();
                this.metricValue=this.metric.compute(this.ps);
                //console.log(this.metricValue);
                this.metric.update(this.ps);
                this.ps=new PrivacySet();
            } 
            return cPosition;
        } else {
            let newPos: Position=this.perturbation.transform(cPosition);
            this.sequenceNo+=1;
            this.ps.add(newPos);
            if (this.sequenceNo>=this.numUpdates) {
                this.sequenceNo=0;
                this.numWithinSequence=this.generatePosition();
                this.metricValue=this.metric.compute(this.ps);
                //console.log(this.metricValue);
                this.metric.update(this.ps);
                this.ps=new PrivacySet();
            }
            return newPos;
        }
    }

    public setParameters(parameters: JSON) {
        this.perturbation.setParameters(JSON.parse("{\"digit\":"+parameters["digit"]+"}"));
        this.numUpdates=parameters["numdummy"];
        this.metric.setParameters(parameters);
    }


    private generatePosition(): number {
        return this.rng.nextInt(0,this.numUpdates);
    }

    public setTrajectory(cPosition: Position, destPosition: Position) {
        
    }

    public getPrivacyMetricValue() {
        if (this.sequenceNo==0) {
            return this.metricValue;
        } else
            return PrivacySet.NO_METRIC_VALUE;
    }
}