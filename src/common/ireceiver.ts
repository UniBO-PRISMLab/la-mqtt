import { Position } from "./position";

export interface MQTTReceiver {
    messageRecv(message: MQTTMessage);
}

export class MQTTMessage {
   
    public topic: string;
    public message: string;
   
    constructor (topic: string, message: string) {
        this.topic=topic;
        this.message=message;
    }

    public getPositionFromMessage(): Position {
        let jsonOb: any= JSON.parse(String(this.message));
        let pos: Position=new Position(jsonOb["latitude"],jsonOb["longitude"]);
        return pos;
    }

    public getContent(): string {
        let jsonOb: any= JSON.parse(String(this.message));
        return jsonOb["message"];
    }


}