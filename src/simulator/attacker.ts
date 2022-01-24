import { GeoProcessor } from "../backend/geoprocesser";
import { Position } from "../common/position";

export class PrivacyAttacker {

    private lastKnown: Position;
    private trajectory: Array<Position>;
    private dummy: number;

    private static MAX_RADIUS: number= 50;
    private static MAX_HISTORY: number= 30;

    constructor(dummy: number) {
        this.lastKnown= undefined;
        this.trajectory=new Array<Position>();
        this.dummy=dummy;
    }

    public isFakeUpdate(pos: Position): boolean {
        this.addToTrajectory(pos);
        
        if (this.lastKnown==undefined) 
            return true;
        
        if (this.isWithinMaxDistance(this.lastKnown,pos,PrivacyAttacker.MAX_RADIUS*this.dummy)) {
            this.lastKnown=pos;
            return true;
        } else
            return false;
   
    }

    private addToTrajectory(dest: Position) {
        if (this.trajectory==undefined) {
            let aPos: Array<Position>=new Array<Position>();
            aPos.push(dest);
            this.trajectory=aPos;
            return;
        } 
        let aPos: Array<Position>=this.trajectory;
        if (aPos.length<PrivacyAttacker.MAX_HISTORY) 
            aPos.push(dest); 
        else {
            aPos.splice(0,1);
            aPos.push(dest);
            this.computeBestTrajectory();
        } 
         
    }

    private computeBestTrajectory() {
        let bLength: number=undefined;
        let candidate: Position=undefined;
        for (let i:number=0; i<this.trajectory.length; i++) {
            let start: Position=this.trajectory[i];
            let cLength: number=0;
           
            for (let j:number=i+this.dummy; j<this.trajectory.length; j+=this.dummy) {
                let end: Position=this.trajectory[j];
                let outcome: boolean=this.isWithinMaxDistance(start,end,PrivacyAttacker.MAX_RADIUS*this.dummy);
                if (outcome==true)
                    cLength+=1;
                if ((bLength==undefined) || (cLength>bLength)) {
                    candidate=this.trajectory[j];
                    bLength=cLength;
                    start=this.trajectory[j];  
                }
            }
               
        }
        if (candidate!=undefined) {
            this.lastKnown=candidate; 
        }
    }

    public isWithinMaxDistance( start: Position, dest: Position, radius: number): boolean {
        const distance: number=GeoProcessor.computeDistanceGPS(start.latitude, start.longitude, dest.latitude, dest.longitude);
        if (distance<radius)
            return true;
        else    
            return false;
    }

}