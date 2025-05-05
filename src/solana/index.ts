import { mnemonicToSeedSync } from "bip39";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { solDerivePath } from "../const";
import { derivePath } from "ed25519-hd-key";
import bs58 from "bs58";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export async function generateNewAccount(account: number) {
    const seed = process.env.SOLANA_SEED!;
    const seedBuffer = mnemonicToSeedSync(seed);
    const solanaPath = solDerivePath(account - 1);
    const solanaDerivedSeed = derivePath(
        solanaPath,
        seedBuffer.toString("hex"),
    ).key;

    const solanaKeypair = Keypair.fromSeed(solanaDerivedSeed);
    const solanaPublicKey = solanaKeypair.publicKey.toBase58();
    const solanaSecretKey = bs58.encode(solanaKeypair.secretKey);

    return {
        walletNumber: account,
        derivePath: {
            solana: solanaPath,
        },
        keysValue: {
            solana: {
                publicKey: solanaPublicKey,
                secretKey: solanaSecretKey,
            },
        },
    };
}

export async function signTnx(message: string, signatureBase64: string, solAddr: string) {
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