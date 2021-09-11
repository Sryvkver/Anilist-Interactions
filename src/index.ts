require('dotenv').config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { findModuleData } from './repo/ModuleRepository';
import { convertToModule } from './modules/_ModuleConvert';
import { getEmptyImage } from './helper';
import { getMimeType } from 'stream-mime-type'

const app = express();

app.use(helmet());
app.use(cors());
app.set('trust proxy', true);



app.get('/set/:moduleId', (req, res) => {
    const moduleId = req.params.moduleId.replace('.png', '').replace('.jpg', '');
    const ip = req.headers?.passthrough_client ? String(req.headers?.passthrough_client) : req.ip;
    console.log(`[${ip}] updating ${moduleId}`);

    findModuleData(moduleId)
        .then(data => convertToModule(data))
        .then(modul => {
            if(modul){
                modul.set(ip, req.query);
            }
        })
        .finally(() => res.redirect(String(req.query?.dest) || 'https://anilist.co/home'));
});

app.get('/get/:moduleId', (req, res) => {
    const moduleId = req.params.moduleId.replace('.png', '').replace('.jpg', '');
    const ip = req.headers?.passthrough_client ? String(req.headers?.passthrough_client) : req.ip;
    console.log(`[${ip}] getting ${moduleId}`);

    findModuleData(moduleId)
        .then(data => convertToModule(data))
        .then(modul => modul ? modul.get(ip, req.query) : getEmptyImage())
        .then(stream => getMimeType(stream))
        .then(result => {
            res.setHeader('content-type', result.mime);
            result.stream.pipe(res)
        })
        .catch(err => {
            console.error(`[${ip}] Error`, err);   
            return getEmptyImage().then(stream => stream.pipe(res))
        });
});



const PORT = process.env.PORT || 443;
mongoose.connect(process.env.MONGO_URI || '')
    .then(() => {
        console.log('Connected to mongoDB!');
        app.listen(PORT, () => {
            console.log('App listeing on Port:', PORT);
        })
    })
    .catch(err => {
        console.error(err);
        process.exit(-1);
    })