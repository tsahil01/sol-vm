import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { db } from "..";
import { VM } from "../types";
import { VMType } from "../../generated/prisma";

export async function createTnx(chatId: number, vm: VM, hr: number) {
    const user = await db.user.findUnique({
        where: {
            telegramId: BigInt(chatId),
        },
    });
    if (!user || !user.walletAddress) {
        console.log('User not found. Cannot create transaction.');
        return null;
    }

    const type = vm.name[0] as VMType;
    const vmData = await db.vM.create({
        data: {
            type,
            cpu: vm.cpu,
            ram: vm.ram,
            disk: vm.disk,
            price: vm.price,
            status: 'pending',
            userId: user.id,
        }
    });

    if (!vmData) {
        console.log('VM data not found. Cannot create transaction.');
        return null;
    }

    const transaction = await db.transaction.create({
        data: {
            userId: user.id,
            lamports: vmData.price * LAMPORTS_PER_SOL * hr,
            status: 'pending',
            type: 'payment',
            paidFromAddress: user.walletAddress,
            webhookStatus: 'pending',
            vmId: vmData.id,
        },
    });

    return { transaction, user, vmData };
}
