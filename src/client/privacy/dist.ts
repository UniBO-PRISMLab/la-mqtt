import { Direction } from "../../common/direction";
import { IPrivacyMetrics, PrivacySet } from "./imetrics";

export class DistanceMetrics implements IPrivacyMetrics {
    
    private static MAX_SPEED: number=5.0;
    private static MAX_PERTURBATION: number=6000;
    private static SMOOTH_FACTOR: number=0.5;
    private maxSpace: number;
    
    public compute(ps: PrivacySet): number {
        let distance: number=0;
        for (let i:number=0; i<ps.dummySet.length; i++) 
            distance+=Direction.computeDistanceGPS(ps.dummySet[i].latitude,ps.dummySet[i].longitude,ps.realPosition.latitude,ps.realPosition.longitude);
        distance=distance/ps.dummySet.length;
       // console.log("DIST "+distance+" "+ps.dummySet.length);
        distance=this.normalize(distance);
        return distance;
    }   


    private normalize(distance: number):number {
        let val: number=Math.pow(distance/this.maxSpace, DistanceMetrics.SMOOTH_FACTOR);
        if (val>1.0)
            val=1.0;
        return val;
    }

    public update(ps: PrivacySet) {
        
    }

    public setParameters(parameters: JSON) {
        this.maxSpace=parameters["interval"]*parameters["numdummy"]*DistanceMetrics.MAX_SPEED;
        this.maxSpace+=DistanceMetrics.MAX_PERTURBATION;
    }

}