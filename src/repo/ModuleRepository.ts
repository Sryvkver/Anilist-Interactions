import { ModuleModel } from "../models/ModuleModel";

export const findModuleData = async (id: string) => {
    const moduleData = await ModuleModel.findById(id);

    if(moduleData)
        return moduleData;

    throw('Moduledata not found!');
}

export const findClientState = async (id: string, client_id: string, defaultVal = '') => {
    const clientState = await ModuleModel.findOne({
        _id: id,
        clientStates: {
            '$elemMatch': {client_id}
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

export const updateModuleData = async (id: string, secret: string | null = null, globalState: string | null = null, clientState: {client_id: string, state: string} | null = null) => {
    const moduleData = await ModuleModel.findById(id);

    if(!moduleData)
        return;


    if(globalState && secret === moduleData._secret){
        moduleData.globalState = globalState;
    }

    if(clientState){
        const oldClientState = moduleData.clientStates.find(ele => ele.client_id === clientState.client_id);

        if(!oldClientState){
            moduleData.clientStates.push(clientState);
        }else{
            oldClientState.state = clientState.state;
        }
    }

    moduleData.save();
}

const makeid = (length: number) => {
    let result           = '';
    const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

export const createModule = async (idWithSecret: string, moduleType: string, globalState: string) => {
    let module = null;
    
    if(!!idWithSecret){
        const id = idWithSecret.split('-')[0];
        const secret = idWithSecret.split('-')[1];
        module = await ModuleModel.findById(id);

        if(module?._secret !== secret){
            throw("Wrong secret supplied!");
        }
    }

    if(!module){
        module = new ModuleModel();
        module._secret = makeid(6);
    }

    module.globalState = globalState;
    module.module = moduleType;
    let data = await module.save();

    return data.id + '-' + data._secret;
}