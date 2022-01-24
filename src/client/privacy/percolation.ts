import { GeoProcessor } from "../../backend/geoprocesser";
import { Position } from "../../common/position";
import { Direction } from "../../common/direction";
import { RNG } from "../../simulator/random";
import { EntropyMetrics } from "./entropy";
import { IPrivacyMetrics, PrivacySet } from "./imetrics";
import { IPrivacyManager } from "./iprivacy";
import { GeoPerturbation } from "./perturbation";
import { DistanceMetrics } from "./dist";

export class Percolation implements IPrivacyManager {
    private numUpdates: number;
    private perturbation: GeoPerturbation;
    private rng: RNG;
    private trajectories: Array<Position>;
    private directions: Array<Direction>;
    private speed: Array<number>; 
    private sequenceNo: number;
    private interval: number;
    private metric: IPrivacyMetrics;
    private ps: PrivacySet;
    private metricValue: number;
    private initialized: boolean;
    private dest: Position;
    private cPerturbationIndex: number;

    private static MAX_SPEED: number=5.0;
    private static MIN_SPEED: number=2.0;
    private static MAX_TRAJECTORIES: number=12;
    
    constructor(rng: RNG) {
        this.perturbation=new GeoPerturbation(rng);
        this.rng=rng;
        this.trajectories=new Array<Position>();
        this.directions=new Array<Direction>();
        this.speed=new Array<number>();
        this.metric=new DistanceMetrics(); 
        this.sequenceNo=0;
        this.metricValue=PrivacySet.NO_METRIC_VALUE;
        this.ps=new PrivacySet();
        this.initialized=false;
    }
    

    public transform(cPosition: Position): Position {
        const prev: Position=this.trajectories[this.sequenceNo];
        this.updatePosition(cPosition);
        if (this.sequenceNo==0) {
            this.sequenceNo+=1;
            this.ps.add(cPosition);
            this.ps.realPosition=cPosition;
            if (this.sequenceNo>=this.numUpdates) {
                this.sequenceNo=0;
                this.metricValue=this.metric.compute(this.ps);
                this.metric.update(this.ps);
                this.ps=new PrivacySet();
            }
            return cPosition;
        } else {
            const retPos: Position= this.trajectories[this.sequenceNo];
            this.ps.add(retPos);
            this.sequenceNo+=1;
            if (this.sequenceNo>=this.numUpdates) {
                this.sequenceNo=0;
                this.metricValue=this.metric.compute(this.ps);
               // console.log(this.metricValue);
                this.metric.update(this.ps);
                this.ps=new PrivacySet();
            }
            return retPos;
        }
    }
    


    public setParameters(parameters: JSON) {
        this.perturbation.setParameters(JSON.parse("{\"digit\":"+parameters["digit"]+"}"));
        this.metric.setParameters(parameters);
        this.interval=parameters["interval"];
        if (parameters["numdummy"] < Percolation.MAX_TRAJECTORIES) 
            this.numUpdates=parameters["numdummy"];
        else    
            this.numUpdates=Percolation.MAX_TRAJECTORIES; 
        if (this.initialized==false) {
            for (let i: number=0; i<(Percolation.MAX_TRAJECTORIES); i++) {
                this.trajectories[i]=undefined;
                this.speed[i]=0;
            }
        } else if (parameters["digit"]!=this.cPerturbationIndex) {
                for (let i: number=0; i<(Percolation.MAX_TRAJECTORIES); i++) {
                    this.trajectories[i]=this.perturbation.transform(this.trajectories[i]);;
                    this.directions[i]= new Direction(this.trajectories[i], this.perturbation.transform(this.dest), this.speed[i]);
                }
        }
        this.cPerturbationIndex=parameters["digit"];
    }


    public setTrajectory(cPosition: Position, dPosition: Position) {
        this.trajectories[0]=new Position(cPosition.latitude, cPosition.longitude);
        for (let i: number=1; i<(Percolation.MAX_TRAJECTORIES); i++) {
            if (this.trajectories[i]==undefined)
                this.trajectories[i]=this.perturbation.transform(cPosition);
            this.speed[i]=this.rng.nextDouble() * (Percolation.MAX_SPEED - Percolation.MIN_SPEED)  + Percolation.MIN_SPEED; 
            this.directions[i]= new Direction(this.trajectories[i], this.perturbation.transform(dPosition), this.speed[i]);
        }
        this.dest=dPosition;
        this.initialized=true;
    }



    public updatePosition(cPosition: Position) {
        this.trajectories[0]=cPosition;
        for (let i: number=1; i<Percolation.MAX_TRAJECTORIES; i++) {
            this.trajectories[i]=this.directions[i].computeAdvance(this.speed[i], this.interval);
            if (this.directions[i].isDestinationReached()==true) {
                this.speed[i]=this.rng.nextDouble() * Percolation.MAX_SPEED + Percolation.MIN_SPEED; 
                this.directions[i]= new Direction(this.trajectories[i], this.perturbation.transform(cPosition), this.speed[i]);    
            }
        }   
       
    }

    public getPrivacyMetricValue() { 
        if (this.sequenceNo==0) {
            return this.metricValue;
        } else
            return PrivacySet.NO_METRIC_VALUE;
        
    }

  

}
