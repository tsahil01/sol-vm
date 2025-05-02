import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";   

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export async function createNewKeypair() {
    const keypair = await Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const privateKey = keypair.secretKey.toString();
    return { publicKey, privateKey };
}

async function signTnx(message: string, signatureBase64: string, solAddr: string) {
    const msg = new TextEncoder().encode(message);
    const signature = Uint8Array.from(Buffer.from(signatureBase64, 'base64'));
    const publicKey = new PublicKey(solAddr);

    return nacl.sign.detached.verify(
        msg,
        signature,
        publicKey.toBuffer()
    );
}

export function isValidSolanaAddress(address: string): boolean {
    try {
        const pubkey = new PublicKey(address);
        return PublicKey.isOnCurve(pubkey.toBuffer());
    } catch (e) {
        return false;
    }
}