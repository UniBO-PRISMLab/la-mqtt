
import { BrokerConf, BrokerConnector } from './iconnector'
import { MQTTMessage } from './ireceiver';
import { MQTTClient } from './client';

var mqtt = require('mqtt')

export class MosquittoConnector implements BrokerConnector {
    
    private connected: boolean;
    private client;
    private eventInitialized: boolean;
    private sclient: MQTTClient;

    constructor() {
        this.connected=false;
        this.eventInitialized=false;
        this.sclient=undefined;
    }
   

    public async connect(conf: BrokerConf) {
        return new Promise((resolve, reject) => {
			this.client  = mqtt.connect(conf.url,{clientId: conf.id, protocolId: 'MQTT', protocolVersion: 4, connectTimeout:5000, debug:true, username: conf.username, password: conf.password});
		//this.client  = mqtt.connect(conf.url,{clientId: conf.id, protocolId: 'MQIsdp', protocolVersion: 3, connectTimeout:5000, debug:true, username: conf.username, password: conf.password});
            this.client.on('connect', function () {
                console.log("Connected to MQTT Broker. Client id: "+conf.id);
                this.connected=true;
                resolve(true);
            }.bind(this));
            this.client.on('error', function (e) {
                console.log("Connection Error" +e);
                this.client.end();
                resolve(false);
            }.bind(this));
        });
    }


    public async publish(topic: string, message: string) {
        return new Promise((resolve, reject) => {
            if (this.connected) {
                this.client.publish(topic, message);
		resolve(true);
            } else
                resolve(false);
        });
    
    
    }



    public async subscribe(topic: string, mclient: MQTTClient) {
        this.sclient=mclient;
        return new Promise((resolve, reject) => {
            if (this.connected) {
                this.client.subscribe(topic);
                if (this.eventInitialized==false)
                    this.recvMessage();
                this.eventInitialized=true;
	     	resolve(true);
            } else
                resolve(false);
        });
    }

    private recvMessage() {
        this.client.on('message', async function (topic, message) {
		if (this.sclient != undefined)
                	await this.sclient.msgRecv(new MQTTMessage(topic, message));
        }.bind(this));
    }

    public async disconnect() {
        return new Promise((resolve, reject) => {
            if (this.connected==true)
                this.client.end();
            resolve(true);
        });
    }

}
