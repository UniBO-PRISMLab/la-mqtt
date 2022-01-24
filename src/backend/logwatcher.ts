import { parseCommandLine } from 'typescript';
import { ILogWatcher } from './dto/iwatcher'
import { ILogCallback } from './dto/iwatcher';
import { MQTTSpatialMessages } from '../common/messages'

const fs = require('fs');
const Tail = require('tail').Tail;
var self;

export class MosquittoWatcher implements ILogWatcher {
    
    private fileLog: string;
    private nextIsSubscribe: boolean;
    private currentId: string;
    private currentTopic: string;
    private callback: ILogCallback;
    private tail;
    
    private static TOKEN_RECEIVED: string="Received";
    private static TOKEN_SUBSCRIBE: string="SUBSCRIBE";

    public constructor(path: string, fileName: string) {
        this.fileLog=path+'/'+fileName;
        this.tail = new Tail(this.fileLog);
        this.nextIsSubscribe=false;
        this.currentId=undefined;
        this.callback=undefined;
    }

    public async start(callback: ILogCallback) {
        this.tail.watch();
        this.callback=callback;
        self=this;
        this.tail.on("line", data => {
            self.parseLine(data);
        });
    }


    private parseLine(data: string) {
        data=data.replace(/\t/g, '');
        console.log(data);
        let splitted = data.split(/\s+/);
        console.log(splitted);
        if (this.nextIsSubscribe==true) {
            this.currentTopic=splitted[1];
            console.log(this.currentTopic);
            this.nextIsSubscribe=false;
            if ((this.currentTopic!=MQTTSpatialMessages.TOPIC_PUBLISH_POSITION) && 
                (this.currentTopic!=MQTTSpatialMessages.TOPIC_PUBLISH_GEOFENCE)) 
                this.callback.newSubscribeEvent(this.currentId,this.currentTopic);
        } else if ((splitted[1]==MosquittoWatcher.TOKEN_RECEIVED) && (splitted[2]==MosquittoWatcher.TOKEN_SUBSCRIBE)) {
            this.nextIsSubscribe=true;
            this.currentId=splitted[4];
        } else 
            this.nextIsSubscribe=false;
    }

    public stop() {
        this.tail.unwatch();
    }



}
