export class Position {
    public latitude: number;
    public longitude: number;

    public constructor(latitude: number, longitude: number) {
        this.latitude=latitude;
        this.longitude=longitude;
    }

    public toString(): string {
        const result: string= "\"latitude\": "+this.latitude+", \"longitude\": "+this.longitude;
        return result;
    }
}