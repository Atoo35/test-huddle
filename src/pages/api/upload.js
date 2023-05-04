import { ethers } from "ethers"
import lighthouse from '@lighthouse-web3/sdk'
import axios from 'axios'
import fs from 'fs'
import path from "path";
import { FILE_ACCESS_CONTRACT_ABI, FILE_ACCESS_CONTRACT_ADDRESS } from '../../constants'

var urlInfo = {
    url: 'https://api.hyperspace.node.glif.io/rpc/v1'
};
var providerFileAccess = new ethers.providers.JsonRpcProvider(urlInfo, 3141);
const signerFileAccess = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY, providerFileAccess);
const provider = ethers.getDefaultProvider();
const signer = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY, provider);
const contract = new ethers.Contract(FILE_ACCESS_CONTRACT_ADDRESS, FILE_ACCESS_CONTRACT_ABI, signerFileAccess);
const signAuthMessage = async () => {
    const messageRequested = (await lighthouse.getAuthMessage(signer.address)).data.message;
    const signedMessage = await signer.signMessage(messageRequested);
    return (signedMessage)
}

const deployEncrypted = async (file, hostWallet) => {

    try {
        //for actually downloading the file
        const resp = await axios.get(file, {
            decompress: false,
            responseType: 'arraybuffer',
        })
        await fs.createWriteStream(path.resolve("./src/downloads/recording.mp4").toString()).write(Buffer.from(resp.data));

        const filePath = path.resolve("./src/downloads/recording.mp4").toString();
        const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;
        const publicKey = signer.address;
        const signedMessage = await signAuthMessage();

        const response = await lighthouse.uploadEncrypted(
            filePath,
            apiKey,
            publicKey,
            signedMessage
        );
        // const tx = await contract.getAllFilesByOwnerAddress(hostWallet);
        const tx = await contract.addFileList(hostWallet, 'recording', 'some details', response.data.Hash);
        await tx.wait();
        console.log("transaction", tx);
        /*
        data: {
            Name: 'flow1.png',
            Hash: 'QmQqfuFH77vsau5xpVHUfJ6mJQgiG8kDmR62rF98iSPRes',
            Size: '31735'
        }
        Note: Hash in response is CID.
        */

        // delete file
        fs.unlinkSync(filePath);
        return response;
    } catch (e) {
        console.log(e);
        fs.unlinkSync(filePath);
    }
}

export default async function handler (req, res) {
    const body = JSON.parse(req.body)
    const response = await deployEncrypted(body.file, body.hostWallet)
    // const response = await contract.getAllFilesByOwnerAddress("0x7935468Da117590bA75d8EfD180cC5594aeC1582");
    // console.log(response);
    res.status(200).json({ response })
    // res.status(200).send(stream);
}
