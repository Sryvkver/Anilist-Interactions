import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { getReadStreamImageDownload } from '../helper';

const fontPath = path.join(__dirname, '..', 'assets', 'fonts');
const tempGifPath = path.join(__dirname, 'ffmpeg-temp');


const defaultFontPath = path.join(fontPath, 'TheNorth-Regular.ttf');

//https://stackoverflow.com/questions/10725225/ffmpeg-single-quote-in-drawtext
const replaceSpecialFfmpegChars = (text: string) => {
    return text
        .replace(/:/g, "\\:")
        .replace(/%/g, '\\%')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\\/g, '\\\\\\')
    }

export const addTextToImage = async(ip: string, url: string, text: string, opts: {
    x: number,
    y: number,
    height?: number,
    width?: number,
    fontSize?: number,
    fontColor?: string,
    stroke?: {
        color: string,
        width: number
    },
    shadow?: {
        color: string,
        offset: {
            x: number,
            y: number
        }
    }
}): Promise<fs.ReadStream> => {
    const extensionReg = /\.(gif|jpe?g|tiff?|png|webp|bmp)/i
    const extensionMatches = extensionReg.exec(url);
    
    if(extensionMatches === null || extensionMatches.length < 1)
        throw('Invalid extension');

    const extension = extensionMatches[0];

    return new Promise(async (res, rej) => {
        const gifName = uuidv4();
        const gifPath = path.join(tempGifPath, gifName + extension);
        const ouputPath = path.join(tempGifPath, gifName + '-done' + extension);
        const gifWriteStream = fs.createWriteStream(gifPath);
    
        const readStream = await getReadStreamImageDownload(url, ip);
        readStream.pipe(gifWriteStream).once('close', () => {
            let createGif = `"${ffmpegPath}" -i "${gifPath}" -vf drawtext="`;
            createGif += `fontfile='${defaultFontPath}':`;
            createGif += `text='${replaceSpecialFfmpegChars(text)}':`;
            createGif += `x='${opts.x}':`;
            createGif += `y='${opts.y}':`;
            createGif += opts.fontSize ? `fontsize=${opts.fontSize}:` : '';
            createGif += opts.fontColor ? `fontcolor=${opts.fontColor}:` : '';

            if(opts.stroke){
                createGif += `borderw=${opts.stroke.width}:bordercolor=${opts.stroke.color}:`;
            }

            if(opts.shadow){
                createGif += `shadowcolor=${opts.shadow.color}:shadowx=${opts.shadow.offset.x}:shadowy=${opts.shadow.offset.y}:`;
            }

            // MUST BE LAST
            createGif += `" "${ouputPath}"`;
            exec(createGif, err => {
                fs.unlinkSync(gifPath);
                if(err) throw err;

                const readStream = fs.createReadStream(ouputPath);
                res(readStream);

                readStream.once('close', () => fs.unlinkSync(ouputPath));
            })

        })
    })
}

(() => {
    if(!fs.existsSync(tempGifPath))
        fs.mkdirSync(tempGifPath);
})();