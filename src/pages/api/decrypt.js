// Decrypt file nodejs
import fs from "fs"
import { ethers } from "ethers"
import lighthouse from '@lighthouse-web3/sdk'
import path from "path";

const provider = ethers.getDefaultProvider();
const signer = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY, provider);

const signAuthMessage = async () => {
    const messageRequested = (await lighthouse.getAuthMessage(signer.address)).data.message
    const signedMessage = await signer.signMessage(messageRequested);
    return (signedMessage)
}

const decrypt = async (cid) => {
    const signedMessage = await signAuthMessage();
    const fileEncryptionKey = await lighthouse.fetchEncryptionKey(
        cid,
        signer.address,
        signedMessage
    );

    // Decrypt File
    const decrypted = await lighthouse.decryptFile(
        cid,
        fileEncryptionKey.data.key
    );
    console.log(decrypted)
    const url = Buffer.from(decrypted);
    console.log(url);
    await fs.createWriteStream(path.resolve(`./src/decrypt/${cid}.mp4`).toString()).write(Buffer.from(decrypted))
    // Save File

}
// QmQPsTLycvD7bCEvQp46DpRqmjF1YZ6Con24BZVpcXtiHq
export default async function handler (req, res) {
    const { cid } = req.query;
    await decrypt(cid)

    //send the file
    const filePath = await path.resolve(`./src/decrypt/${cid}.mp4`).toString();
    const imageBuffer = await fs.readFileSync(filePath)
    res.setHeader('Content-Type', 'video/mp4')
    res.send(imageBuffer)
}