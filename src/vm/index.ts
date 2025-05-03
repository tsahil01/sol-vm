import { InstancesClient } from '@google-cloud/compute';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { generateSSHKeyPair } from './ssh';

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const zone = 'us-central1-a';


export async function createUserVM(userId: string) {

    const { privateKey, publicKey } = generateSSHKeyPair();

    const instanceName = `user-vm-${userId}`;
    const instancesClient = new InstancesClient();

    const [response] = await instancesClient.insert({
        project: projectId,
        zone,
        instanceResource: {
            name: instanceName,
            labels: { user_id: userId },
            machineType: `zones/${zone}/machineTypes/e2-micro`,
            networkInterfaces: [
                {
                    network: 'global/networks/default',
                    accessConfigs: [
                        { name: 'External NAT', type: 'ONE_TO_ONE_NAT' },
                    ],
                },
            ],
            disks: [
                {
                    boot: true,
                    autoDelete: true,
                    initializeParams: {
                        sourceImage: 'projects/debian-cloud/global/images/family/debian-11',
                    },
                },
            ],
            serviceAccounts: [
                {
                    email: 'default',
                    scopes: [],
                },
            ],
            metadata: {
                items: [
                    {
                        key: 'block-project-ssh-keys',
                        value: 'true',
                    },
                    {
                        key: 'ssh-keys',
                        value: `user:${publicKey}`,
                    },
                ],
            },
            tags: {
                items: ['no-internal-traffic'],
            },
        },
    });

    await new Promise(resolve => setTimeout(resolve, 15000));

    const [vmDetails] = await instancesClient.get({
        project: projectId,
        zone,
        instance: instanceName,
    });

    const networkInterfaces = vmDetails.networkInterfaces;
    const externalIP = networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP;

    if (!externalIP) {
        throw new Error('Could not get external IP for the instance');
    }

    const tmpDir = os.tmpdir();
    const keyFilePath = path.join(tmpDir, `${userId}_id_rsa`);

    fs.writeFileSync(keyFilePath, privateKey);
    fs.chmodSync(keyFilePath, 0o600);

    return {
        ip: externalIP,
        keyFilePath,
        privateKey,
        instanceName,
        zone,
    };
}