import { BrokerConf, BrokerConnector } from './iconnector'
import { MosquittoConnector } from './mosquittoConnector';
import { MQTTReceiver, MQTTMessage } from './ireceiver'

export class MQTTClient {

    protected brokerConf: BrokerConf;
    protected mconnector: BrokerConnector;
    protected mcallback: Array<MQTTReceiver>;
    protected clientId: string;
    private static DEFAULT_CLIENT_NAME: string="tester";
    
    constructor (username: string, password: string, host: string, port: number, id: string) {
        
        if (id==undefined)
            this.clientId=MQTTClient.DEFAULT_CLIENT_NAME;
        else 
            this.clientId=id;
        
            this.brokerConf=new BrokerConf(username,password,host,port,this.clientId);
        
        this.mconnector=new MosquittoConnector();
        this.mcallback=new Array<MQTTReceiver>();
      
    }


    public setCallback(mcallback: MQTTReceiver) {
        this.mcallback.push(mcallback);
    }


    public async connect(): Promise<boolean> {
        let res: boolean=await this.mconnector.connect(this.brokerConf);
        return res;
    }

    public async publish(topic: string, message: string): Promise<boolean> {
        let res: boolean=await this.mconnector.publish(topic, message);
        return res; 
    }

    public async subscribe(topic: string): Promise<boolean> {
        let res: boolean=await this.mconnector.subscribe(topic, this);
        return res; 
    }


    public async disconnect() {
        let res: boolean=await this.mconnector.disconnect();
        return res;
    }


    public async msgRecv(msg: MQTTMessage) {
        for (let i:number=0; i<this.mcallback.length; i++)
            await this.mcallback[i].messageRecv(msg);    
    }

}



