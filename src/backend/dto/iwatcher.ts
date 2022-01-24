export interface ILogWatcher {
    start(callback: ILogCallback);
    stop();
}

export interface ILogCallback {
    newSubscribeEvent(clientId: string, topic: string);
}