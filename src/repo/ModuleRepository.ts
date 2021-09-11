import { ModuleModel } from "../models/ModuleModel";

export const findModuleData = async (id: string) => {
    const moduleData = await ModuleModel.findById(id);

    if(moduleData)
        return moduleData;

    throw('Moduledata not found!');
}

export const findClientState = async (id: string, ip: string, defaultVal = '') => {
    const clientState = await ModuleModel.findOne({
        _id: id,
        clientStates: {
            '$elemMatch': {ip}
        }
    }, {'clientStates.$': 1});

    if(clientState)
        return clientState.clientStates[0].state;
    
    return defaultVal;
}

export const findAllClientStates = async (id: string, defaultVal = []) => {
    const moduleData = await ModuleModel.findById(id);

    if(moduleData)
        return moduleData.clientStates;
    
    return defaultVal;
}

export const findGlobalState = async (id: string, defaultVal = '') => {
    const globalState = await ModuleModel.findById(id, {'globalState': 1});

    if(globalState)
        return globalState.globalState;
    
    return defaultVal;
}

export const updateModuleData = async (id: string, secret: string | null = null, globalState: string | null = null, clientState: {ip: string, state: string} | null = null) => {
    const moduleData = await ModuleModel.findById(id);

    if(!moduleData)
        return;


    if(globalState && secret === moduleData._secret){
        moduleData.globalState = globalState;
    }

    if(clientState){
        const oldClientState = moduleData.clientStates.find(ele => ele.ip === clientState.ip);

        if(!oldClientState){
            moduleData.clientStates.push(clientState);
        }else{
            oldClientState.state = clientState.state;
        }
    }

    moduleData.save();
}