import { Position } from "../../common/position";
import { Direction } from "../../common/direction";
import { IPrivacyMetrics, PrivacySet } from "./imetrics";

export class EntropyMetrics implements IPrivacyMetrics {

    private static DEFAULT_VALUE: number=0.0;
    private static DEFAULT_VARIANCE: number=500;
    private static MAX_SPEED: number=5.0;
    private static MIN_SPEED: number=1.0;
    
    private historian: PrivacySet;
    private interval: number;
    private mean: number;
    private variance: number;
    

    public constructor() {
        this.historian=undefined;
        this.mean=1.0;
    }

    public setParameters(parameters: JSON) {
        this.interval=parameters["interval"]*parameters["numdummy"];
        this.mean=((EntropyMetrics.MAX_SPEED+EntropyMetrics.MIN_SPEED)/2)*this.interval;
        this.variance=Math.pow(this.interval,2)*(EntropyMetrics.MAX_SPEED-EntropyMetrics.MIN_SPEED)/12.0;
    }


    public compute(ps:PrivacySet): number {
        let prob: Array<number>=new Array<number>();
        let tot: number=0.0;
        let entropy: number=0.0;
        if (this.historian==undefined)
            return EntropyMetrics.DEFAULT_VALUE;
        for (let i:number=0; i<ps.dummySet.length; i++)  {
            //console.log("Sample "+i);
            //console.log("------------");
            prob[i]=this.computeMaxProbability(ps.dummySet[i],this.historian);
            tot+=prob[i];
        }
        for (let i:number=0; i<ps.dummySet.length; i++) { 
            prob[i]=prob[i]/tot;
            if (prob[i]>0)
                entropy+=(Math.log2(prob[i])*prob[i]);
        }
        entropy=entropy*-1;
        return entropy;
    }


    public update(ps: PrivacySet) {
        this.historian=ps;
    }


    private computeAvgProbability(pos1: Position, ps: PrivacySet) {
        let avg: number=0.0;
        for (let i:number=0; i<ps.dummySet.length; i++) 
            avg+=this.computeLikelihood(pos1,ps.dummySet[i]);
        avg=avg/ps.dummySet.length;
        //console.log("AVG: "+avg+" "+ps.dummySet.length);
        return avg;
    }

    private computeMaxProbability(pos1: Position, ps: PrivacySet) {
        let max: number=undefined;
        for (let i:number=0; i<ps.dummySet.length; i++) {
            let val: number=this.computeLikelihood(pos1,ps.dummySet[i]);
            if ((max==undefined) || (val>max))
                max=val;
        }
        //console.log("MAX: "+max+" "+ps.dummySet.length);
       
        return max;
    }

    private computeLikelihood(pos1: Position, pos2: Position): number {
        let distance: number=Direction.computeDistanceGPS(pos1.latitude,pos1.longitude,pos2.latitude,pos2.longitude);
        let gle=(1/(Math.sqrt(2*Math.PI*EntropyMetrics.DEFAULT_VARIANCE)))*Math.exp(Math.pow(distance-this.mean,2)/(-2*this.variance));
        let ok: boolean=false;
        if (distance > this.interval* EntropyMetrics.MAX_SPEED)
            ok=true;

        //console.log("DIST: "+distance+" "+gle+" ok: "+ok+" bound: "+this.interval* EntropyMetrics.MAX_SPEED);
        return gle;
    }

}