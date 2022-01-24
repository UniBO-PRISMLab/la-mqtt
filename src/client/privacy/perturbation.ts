import { stringify } from "querystring";
import { Position } from "../../common/position";
import { RNG } from "../../simulator/random";
import { PrivacySet } from "./imetrics";
import { IPrivacyManager } from "./iprivacy";

export class GeoPerturbation implements IPrivacyManager {
    
    private perturbationDigit: number;
    private rng: RNG;

    constructor(rng: RNG) {
        this.rng=rng;
    }

    public setParameters(parameters: JSON) {
        this.perturbationDigit=parameters["digit"];
        console.log("Changed: "+this.perturbationDigit);
    }

    public transform(cPosition: Position): Position {
        let latString:string= String(cPosition.latitude);
        let finalLat: string=latString.split('.')[0]+".";
        latString=latString.split('.')[1];
        let numDigit: number=latString.length;
        
        let longString:string= String(cPosition.longitude);
        let finalLong: string=longString.split('.')[0]+".";
        longString=longString.split('.')[1];
        

        let prefixString=latString.slice(0,this.perturbationDigit);
        finalLat=finalLat+prefixString;
        prefixString=longString.slice(0,this.perturbationDigit);
        finalLong=finalLong+prefixString;

        for (let i:number=0; i<(numDigit-prefixString.length); i++) {
            finalLat=finalLat+String(this.generateRandomDigit());
            finalLong=finalLong+String(this.generateRandomDigit());
        }
        return new Position(Number(finalLat), Number(finalLong));
    }

    private generateRandomDigit(): number {
        return this.rng.nextInt(0,10);
    }


    public setTrajectory(cPosition: Position, destPosition: Position) {
    }

    public getPrivacyMetricValue() {
        return PrivacySet.NO_METRIC_VALUE;
    }
}