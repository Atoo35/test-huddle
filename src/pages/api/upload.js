import { ethers } from "ethers"
import lighthouse from '@lighthouse-web3/sdk'
import axios from 'axios'
import fs from 'fs'
import path from "path";

const provider = ethers.getDefaultProvider();
const signer = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY, provider);

const signAuthMessage = async () => {
    const messageRequested = (await lighthouse.getAuthMessage(signer.address)).data.message;
    const signedMessage = await signer.signMessage(messageRequested);
    return (signedMessage)
}

const deployEncrypted = async () => {

    //for actually downloading the file
    // const resp = await axios.get('https://i.vimeocdn.com/video/700483891-a077670f02ed09a3309707112d6328111ac801e0e9bb772203875ff8d8cf97f5-d?mw=1600&mh=901&q=70', {
    //     decompress: false,
    //     // Ref: https://stackoverflow.com/a/61621094/4050261
    //     responseType: 'arraybuffer',
    // })
    // await fs.createWriteStream(path.resolve("./src/downloads/image.jpg").toString()).write(Buffer.from(resp.data));
    //Give absolute path
    const filePath = path.resolve("./fishes.mp4").toString();
    const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;
    const publicKey = signer.address;
    const signedMessage = await signAuthMessage();

    const response = await lighthouse.uploadEncrypted(
        filePath,
        apiKey,
        publicKey,
        signedMessage
    );
    /*
    data: {
        Name: 'flow1.png',
        Hash: 'QmQqfuFH77vsau5xpVHUfJ6mJQgiG8kDmR62rF98iSPRes',
        Size: '31735'
    }
    Note: Hash in response is CID.
    */

    // delete file
    // fs.unlinkSync(filePath);
    return response;
}

export default async function handler (req, res) {
    const response = await deployEncrypted()
    res.status(200).json({ response })
    // res.status(200).send(stream);
}
