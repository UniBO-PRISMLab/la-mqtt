export class God {

    private snapshotAdv: Map<string, GeofenceData>;
    private debugMode: boolean;
    private OPTIMIZED_MODE: boolean;

    constructor() {
        this.snapshotAdv=new Map<string, GeofenceData>();
        this.debugMode=false;
	this.OPTIMIZED_MODE=false;
    }

    public newAdvertisement(messageNo: number, geofenceId: string) {
        let messageS: string=String(messageNo);
        let gData: GeofenceData=new GeofenceData(geofenceId);
        this.snapshotAdv.set(messageS,gData);
        //console.log(this.snapshotAdv.keys());
        this.snapshotAdv.forEach((gEntry, key) => {
            if ((gEntry.id==geofenceId) && (key!=messageS)) {
                gEntry.active=false;
	    	if (this.OPTIMIZED_MODE)
			this.snapshotAdv.delete(key);
	    }
        });

        if (this.debugMode) 
            this.printSnapshot();

    }

    public setActiveUser(messageNo: number, userId: string, ctime: number) {
        let messageS: string=String(messageNo);
        let gData: GeofenceData=this.snapshotAdv.get(messageS);
        if ((gData!=undefined) && (gData.active==true)) {
            let found: boolean=false;
            for (let i: number=0; i<gData.userList.length; i++) {
                if (gData.userList[i].id==userId)
                    found=true;
            }
            if (found==false) {
                gData.userList.push(new ActiveUser(userId, ctime))
            }
        }

        if (this.debugMode) 
            this.printSnapshot();
    }


    public setNotifiedUser(messageNo: number, userId: string, ctime: number) {
        let messageS: string=String(messageNo);
        let gData: GeofenceData=this.snapshotAdv.get(messageS);
        if ((gData!=undefined) && (gData.active==true)) {
            for (let i: number=0; i<gData.userList.length; i++) {
                if (gData.userList[i].id==userId) {
                    gData.userList[i].notified=true;
                    gData.userList[i].timeNotified=ctime; 
                }
            }
        }

        if (this.debugMode) 
            this.printSnapshot();
        
    }

    public printSnapshot() {
        console.log("------GOD------");
        this.snapshotAdv.forEach((gEntry, key) => {
            console.log("Key: "+key+"GFence: "+gEntry.id+" active: "+gEntry.active+" numUsers: "+gEntry.userList.length);
            for (let i: number=0; i<gEntry.userList.length; i++) {
                console.log("User "+gEntry.userList[i].id+" Notified: "+gEntry.userList[i].notified+" Time enter: "+gEntry.userList[i].timeEnter+" Time notified: "+gEntry.userList[i].timeNotified);
            }
        });
    }

    public computePrecision(): number {
        let totUserEntered: number=0;
        let totUserNotified: number=0;
        this.snapshotAdv.forEach((gEntry, key) => {
            totUserEntered+=gEntry.userList.length;
            for (let i: number=0; i<gEntry.userList.length; i++) {
                if (gEntry.userList[i].notified==true)
                    totUserNotified+=1;
            }
        });
        const precision:number=totUserNotified/totUserEntered;
        return precision; 
    }


    public computeDelay(): number {
        let meanDelay: number=0;
        let totUserNotified: number=0;
        this.snapshotAdv.forEach((gEntry, key) => {
            for (let i: number=0; i<gEntry.userList.length; i++) {
                if (gEntry.userList[i].notified==true) {
                    totUserNotified+=1;
		    console.log(gEntry.userList[i].timeNotified);
                    if (gEntry.userList[i].timeNotified>= gEntry.userList[i].timeEnter)
                        meanDelay+=(gEntry.userList[i].timeNotified - gEntry.userList[i].timeEnter);
                }
            }
        });
        const delay:number=meanDelay/totUserNotified;
        return delay; 
    }
}


class GeofenceData {
    public userList:Array<ActiveUser>;
    public active: boolean;
    public id: string;
  
    public constructor(id: string) {
        this.userList=new Array<ActiveUser>();
        this.active=true;
        this.id=id;
    }
}

class ActiveUser {
    public id: string;
    public timeEnter: number;
    public timeNotified: number;
    public notified: boolean;

    public constructor(id: string, time: number) {
        this.id=id;
        this.timeEnter=time;
        this.timeNotified=undefined;
        this.notified=false;
    }

}
