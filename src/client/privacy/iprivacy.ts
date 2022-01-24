import { Position } from "../../common/position";

export interface IPrivacyManager {
    transform(cPosition: Position): Position;
    setParameters(parameters: JSON);
    setTrajectory(cPosition: Position, destPosition: Position);
    getPrivacyMetricValue(): number;
}

export enum PrivacyModel {
    NONE=0,
    PERTURBATION=1,
    DUMMY_UPDATES=2,
    DUMMY_UPDATES_WITH_PERCOLATION=3
}