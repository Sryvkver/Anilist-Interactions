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

    themeWrapper: {
        redirect: string,
        themes: Array<{
            themeName: string,
            pages: Array<{
                name: string,
                url: string
            }>
        }>
    };

    constructor(moduleData: IModuleModel){
        this.themeWrapper = {redirect: '', themes: []};
        this._id = moduleData._id?.toHexString() || '';
    }

    updateThemes = async() => {
        if(!this._id)
            return null;

        findGlobalState(this._id)
            .then(state => {
                try {
                    this.themeWrapper = JSON.parse(state);
                } catch (error) {
                    console.warn('failed to load globalstate for', this._id);   
                }
            })
    }

    set = (client_id: string, query: any) => {
        //const isGlobal = query?.isGlobal === 'true' ? true : false;
        const themeName = String(query?.theme) || null;
        
        if(!this._id || !themeName)
            return;
        
        updateModuleData(this._id, null, null, {client_id, state: themeName});
    };

    get = async(client_id: string, query: any, setEtag: (etag: string) => void) => {
        if(!this._id)
            return getEmptyImage();

        await this.updateThemes();

        const clientState = await findClientState(this._id, client_id);
        let themeIndex = this.themeWrapper.themes.findIndex(ele => ele.themeName === clientState);
        themeIndex = themeIndex === -1 ? 0 : themeIndex;

        const page = this.themeWrapper.themes[themeIndex].pages.find(ele => ele.name === (query.page || ''));

        setEtag(`${this._id}-${this.themeWrapper.themes[themeIndex].themeName}-${page?.name}`);

        if(page)
            return getReadStreamImageDownload(page.url, client_id);
        else
            return getEmptyImage();
    };
    
}