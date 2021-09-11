import mongoose from 'mongoose';

export interface IModuleModel extends mongoose.Document {
    _id?: mongoose.Types.ObjectId,
    _secret: string,
    module: string,
    clientStates: Array<{
        ip: string,
        state: string
    }>,
    globalState: string
}

export const ModuleSchema = new mongoose.Schema({
    module: String,
    _secret: String,
    clientStates: [{
        ip: String,
        state: String
    }],
    globalState: String
});

export const ModuleModel = mongoose.model<IModuleModel>('modules', ModuleSchema);