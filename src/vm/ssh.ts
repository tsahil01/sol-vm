import { generateKeyPairSync } from 'crypto';

export function generateSSHKeyPair() {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    const formattedPublicKey = publicKey.replace('-----BEGIN PUBLIC KEY-----\n', '')
        .replace('\n-----END PUBLIC KEY-----\n', '')
        .trim();

    const sshPublicKey = `ssh-rsa ${formattedPublicKey} user`;

    return {
        privateKey,
        publicKey: sshPublicKey
    };
}