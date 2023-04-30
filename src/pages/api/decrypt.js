// Decrypt file nodejs
import { ethers } from "ethers"
import lighthouse from '@lighthouse-web3/sdk'

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
    return Buffer.from(decrypted);

}
// QmQPsTLycvD7bCEvQp46DpRqmjF1YZ6Con24BZVpcXtiHq
export default async function handler (req, res) {
    const { cid } = req.query;
    const t = await decrypt(cid)
    res.setHeader('Content-Type', 'video/mp4')
    res.send(t)
}