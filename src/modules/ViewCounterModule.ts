import { getEmptyImage, getReadStreamImageDownload } from "../helper";
import { addTextToImage } from "../libs/ffmpeg";
import { IModuleModel } from "../models/ModuleModel";
import { findAllClientStates, findClientState, findGlobalState, updateModuleData } from "../repo/ModuleRepository";
import { IModule } from "./_IModule";

export class ViewCounterModule implements IModule {
    _id?: string | undefined;
    readonly module: string = 'ViewCounter';

    constructor(moduleData: IModuleModel){
        this._id = moduleData._id?.toHexString() || '';
    }

    set = (client_id: string, query: any) => {};

    get = async(client_id: string, query: any) => {
        const backgroundImage = query?.image || null;

        console.log(query);

        if(!backgroundImage)
            return getEmptyImage();

        if(!this._id || !query.x || !query.y || !query.text)
            return getReadStreamImageDownload(backgroundImage, client_id);

        const states = await findAllClientStates(this._id);
        let clientState = states.find(ele => ele.client_id === client_id);

        if(!clientState){
            clientState = {
                client_id,
                state: '1'
            };

            states.push(clientState);
        }else{
            clientState.state = String(+clientState.state + 1);
        }

        updateModuleData(this._id, null, null, clientState);


        if(query.shadow)
            query.shadow = JSON.parse(query.shadow);

        
        if(query.stroke)
            query.stroke = JSON.parse(query.stroke);

        const overallAmount = states.reduce((acc, ele) => acc+Number(ele.state), 0);
        const uniqueAmount = states.length;
        
        const text = String(query.text).replace(/<--ALL-->/g, String(overallAmount)).replace(/<--UNIQUE-->/g, String(uniqueAmount));

        return addTextToImage(client_id, backgroundImage, text, query);
        //return getReadStreamImageDownload(backgroundImage);
    };
    
}