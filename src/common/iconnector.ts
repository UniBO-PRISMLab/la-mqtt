import { MQTTClient } from './client';

export interface BrokerConnector {
    connect(conf: BrokerConf);
    publish(topic: string, message: string);
    subscribe(topic: string, client: MQTTClient);
    disconnect();
}

export class BrokerConf {
    username: string;
    password: string;
    url: string;
    port: number;
    id: string;

    public constructor(username: string, password: string, url: string, port: number, id: string) {
        this.username=username;
        this.password=password;
        this.url=url;
        this.port=port;
        this.id=id;
    }
}