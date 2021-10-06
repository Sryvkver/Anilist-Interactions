require('dotenv').config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser'; 
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { createModule, findGlobalState, findModuleData } from './repo/ModuleRepository';
import { convertToModule } from './modules/_ModuleConvert';
import { getEmptyImage, getReadStreamImageDownload } from './helper';
import { getMimeType } from 'stream-mime-type'

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', true);
app.set('etag', 'strong')

export const CLIENT_ID_COOKIE = 'ai_client_id';

app.get('/set/:moduleId', (req, res) => {
    const moduleId = req.params.moduleId.replace('.png', '').replace('.jpg', '');
    let client_id = req.cookies[CLIENT_ID_COOKIE] ? String(req.cookies[CLIENT_ID_COOKIE]) : uuidv4();

    if(req.headers?.passthrough_client){
        client_id = String(req.headers?.passthrough_client);
    }else{
        res.setHeader('Set-Cookie', `${CLIENT_ID_COOKIE}=${client_id}; Max-Age=31536000; Http-Only; Path=/; SameSite=None; Secure`)
    }
    
    const dest = req.query?.dest ? String(req.query.dest) : 'https://anilist.co/home';
    console.log(`[${client_id}] updating ${moduleId}`);

    findModuleData(moduleId)
        .then(data => convertToModule(data))
        .then(modul => {
            if(modul){
                modul.set(client_id, req.query);
            }
        })
        .finally(() => res.redirect(dest));
});

app.get('/get/:moduleId', (req, res) => {
    const moduleId = req.params.moduleId.replace('.png', '').replace('.jpg', '');
    let client_id = req.cookies[CLIENT_ID_COOKIE] ? String(req.cookies[CLIENT_ID_COOKIE]) : uuidv4();

    if(req.headers?.passthrough_client){
        client_id = String(req.headers?.passthrough_client);
    }else{
        res.setHeader('Set-Cookie', `${CLIENT_ID_COOKIE}=${client_id}; Max-Age=31536000; Http-Only; Path=/; SameSite=None; Secure`)
    }

    const ignoreCache = !!req.query?.noCache;
    console.log(`[${client_id}] getting ${moduleId}`);


    if(!ignoreCache)
        res.setHeader('Cache-Control', 'no-cache');

    findModuleData(moduleId)
        .then(data => convertToModule(data))
        .then(modul => modul ? modul.get(client_id, req.query, (etag) => res.setHeader('ETag', etag)) : getEmptyImage())
        .then(stream => getMimeType(stream))
        .then(result => {
            if(ignoreCache){
                res.removeHeader('ETag');
                res.removeHeader('Cache-Control');
            }

            if(!!req.headers['if-none-match'] && req.headers['if-none-match'] === res.getHeader('ETag')){
                console.log(`[${client_id}] Using cached version of ${moduleId}`);
                res.sendStatus(304);
                return;
            }


            res.setHeader('content-type', result.mime);
            result.stream.pipe(res)
        })
        .catch(err => {
            console.error(`[${client_id}] Error`, err);   
            return getEmptyImage().then(stream => stream.pipe(res))
        });
});

app.get('/cache/:imageURL', (req, res) => {
    let client_id = req.cookies[CLIENT_ID_COOKIE] ? String(req.cookies[CLIENT_ID_COOKIE]) : uuidv4();
    res.setHeader('Cache-Control', 'no-cache');

    if(req.headers?.passthrough_client){
        client_id = String(req.headers?.passthrough_client);
    }else{
        res.setHeader('Set-Cookie', `${CLIENT_ID_COOKIE}=${client_id}; Max-Age=31536000; Http-Only; Path=/; SameSite=None; Secure`)
    }

    getReadStreamImageDownload(req.params.imageURL)
        .then(stream => getMimeType(stream))
        .then(result => {
            res.setHeader('ETag', req.params.imageURL);

            if(!!req.headers['if-none-match'] && req.headers['if-none-match'] === res.getHeader('ETag')){
                console.log(`[${client_id}] Using cached version of ${req.params.imageURL}`);
                res.sendStatus(304);
                return;
            }

            res.setHeader('content-type', result.mime);
            result.stream.pipe(res);
        })
        .catch(err => {
            console.error(`[${client_id}] Error`, err);   
            return getEmptyImage().then(stream => stream.pipe(res))
        });
})


app.post('/', (req, res) => {
    let id = req.body.moduleId;
    const moduleType = req.body.module;
    let globalState: any = null;

    switch (moduleType) {
        case 'Theme':
            globalState = {...req.body.moduleData};
            break;
    
        default:
            res.sendStatus(433);
            break;
    }


    createModule(id, moduleType, JSON.stringify(globalState))
        .then(idWithSecret => res.send({idWithSecret}))
        .catch(err => {
            res.status(400).send({err});
            console.log(err);
        });
});

app.get('/data/:moduleId', (req, res) => {
    let id = req.params.moduleId.split('-')[0];
    findModuleData(id)
        .then(data => {
            const globalState = JSON.parse(data.globalState);
            res.send({
                data: globalState,
                module: data.module
            })
        });
})

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