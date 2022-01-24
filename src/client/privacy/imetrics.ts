
import { Position } from "../../common/position";

export interface IPrivacyMetrics {
    compute(ps: PrivacySet): number;
    update(ps: PrivacySet);
    setParameters(parameters: JSON);
}


export class PrivacySet {

    public realPosition: Position;
    public dummySet: Array<Position>;
    public static NO_METRIC_VALUE: number=-1;

    public constructor() {
        this.dummySet=new Array<Position>(); 
    }

    public add(pos: Position) {
        this.dummySet.push(pos);
    }
}