import { IModuleModel } from "../models/ModuleModel";
import { ThemeModule } from "./ThemeModule";
import { ViewCounterModule } from "./ViewCounterModule";
import { IModule } from "./_IModule";

const _loadedModules: Array<{
    id: string,
    module: IModule
}> = [];



export const convertToModule = (moduleData: IModuleModel) => {
    const module = _loadedModules.find(ele => ele.id === moduleData.id);
    if(module)
        return module.module;


    switch (moduleData.module) {
        case 'Theme': {
            const newModule = new ThemeModule(moduleData)
            _loadedModules.push({
                id: moduleData.id,
                module: newModule
            });
            return newModule;
        }

        case 'ViewCounter': {
            const newModule = new ViewCounterModule(moduleData);
            _loadedModules.push({
                id: moduleData.id,
                module: newModule
            });
            return newModule;
        }

    
        default:
            return null;
    }

}