const geolib = require('geolib');
import { Position } from './position'

export class Direction {
    private mCoef: number;
    private nCoef: number;
    private source: Position;
    private dest: Position;
    private cPosition: Position;
    private destReached: boolean;


    public constructor(source: Position, destination: Position, speed: number) {
        this.source=source;
        this.dest=destination;
        this.cPosition=new Position(source.latitude,source.longitude);
        this.destReached=false;
        this.computeCoefficients();
    }


    public computeCoefficients() {
        this.mCoef=(this.source.longitude-this.dest.longitude)/(this.source.latitude-this.dest.latitude);
        this.nCoef=this.source.longitude-this.mCoef*this.source.latitude;
    }

    public isDestinationReached():boolean {
        return this.destReached;
    }

    public computeDistanceToNextGoal() {
        return Direction.computeDistanceGPS(this.cPosition.latitude, this.cPosition.longitude, this.dest.latitude, this.dest.longitude);
    }

    public computeAdvance(speed: number, timeAdvance: number): Position {
        let distanceToGoal=Direction.computeDistanceGPS(this.source.latitude, this.source.longitude, this.dest.latitude, this.dest.longitude);
        let distanceNow=Direction.computeDistanceGPS(this.cPosition.latitude, this.cPosition.longitude, this.dest.latitude, this.dest.longitude);
        let distanceE=Direction.computeEDistance(this.source.latitude, this.source.longitude, this.dest.latitude, this.dest.longitude);
        let realAdvance=speed*timeAdvance;
        let advance=realAdvance*distanceE/distanceToGoal;
        if ((distanceNow<=realAdvance)) {
            let p: Position=new Position(this.dest.latitude, this.dest.longitude);
            this.cPosition.latitude=this.dest.latitude;
            this.cPosition.longitude=this.dest.longitude;
            this.destReached=true;
            return p;
        } else {
            let newX=this.cPosition.latitude;
            let val=advance*Math.sqrt(1/(1+this.mCoef*this.mCoef));
            if (newX>this.dest.latitude)
                newX=newX-val;
            else
                newX=newX+val;
            let newY=newX*this.mCoef+this.nCoef;
            this.cPosition.latitude=newX;
            this.cPosition.longitude=newY;
            let p: Position=new Position(newX, newY)
            return p;
        }
    }


    public static computeEDistance(lat1: number, long1: number, lat2: number, long2: number): number {
        let latE=Math.pow(Math.abs(lat1-lat2),2);
        let longE=Math.pow(Math.abs(long1-long2),2);
        let distance=Math.sqrt(latE+longE);
        return distance;
    }


    public static computeDistanceGPS(lat1: number, long1: number, lat2: number, long2: number) {
        let distance=geolib.getDistance(
            { latitude: lat1, longitude: long1 },
            { latitude: lat2, longitude: long2 }
        );
        return distance;
    }
}    
