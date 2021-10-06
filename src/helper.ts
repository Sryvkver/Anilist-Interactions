import got from 'got';

export const getReadStreamImageDownload = async(imageUrl: string, client_id: string = '') => {
    if(process.env.FELIXIRE_CLOUD_IP)
        imageUrl = imageUrl.replace('https://cloud.felixire.com', process.env.FELIXIRE_CLOUD_IP)

    if(process.env.FELIXIRE_THIS_IP)
        imageUrl = imageUrl.replace('https://test.felixire.com', process.env.FELIXIRE_THIS_IP)

    return got.stream(imageUrl, {
        headers: {
            passthrough_client: client_id
        }
    });
}

export const getEmptyImage = async() => {
    return getReadStreamImageDownload('https://cloud.felixire.com/index.php/s/ZfxYMifEJXEows8/preview')
}
