import fs, { ReadStream } from "fs";
import { getEmptyImage, getReadStreamImageDownload } from "../helper";
import { IModuleModel } from "../models/ModuleModel";
import { findClientState, findGlobalState, updateModuleData } from "../repo/ModuleRepository";
import { IModule } from "./_IModule";

// TODO make this stateless -> instead of saving the data inside the class make request to the database to fetch the data
// Shouldnt be bad for the performance, because both are on the same server.

export class ThemeModule implements IModule {
    _id?: string | undefined;
    readonly module: string = 'Theme';

    private lastCheck = 0;
    themes: Array<{
        themeName: string,
        pages: Array<{
            name: string,
            url: string
        }>
    }>;

    constructor(moduleData: IModuleModel){
        this.themes = [];
        this._id = moduleData._id?.toHexString() || '';
    }

    updateThemes = async() => {
        if(!this._id || +new Date() - this.lastCheck < 300000)
            return null;

        this.lastCheck = +new Date();
        findGlobalState(this._id)
            .then(state => {
                try {
                    this.themes = JSON.parse(state);
                } catch (error) {
                    console.warn('failed to load globalstate for', this._id);   
                }
            })
    }

    set = (ip: string, query: any) => {
        //const isGlobal = query?.isGlobal === 'true' ? true : false;
        const themeName = String(query?.theme) || null;
        
        if(!this._id || !themeName)
            return;
        
        updateModuleData(this._id, null, null, {ip, state: themeName});
    };

    get = async(ip: string, query: any) => {
        if(!this._id)
            return getEmptyImage();

        await this.updateThemes();

        const clientState = await findClientState(this._id, ip);
        let themeIndex = this.themes.findIndex(ele => ele.themeName === clientState);
        themeIndex = themeIndex === -1 ? 0 : themeIndex;

        const page = this.themes[themeIndex].pages.find(ele => ele.name === (query.page || ''));

        if(page)
            return getReadStreamImageDownload(page.url, ip);
        else
            return getEmptyImage();
    };
    
}