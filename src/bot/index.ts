import TelegramBot from "node-telegram-bot-api";
import { allVMs, allVMsReplyMarkup, helpMessage, initOptions, welcomeMessage } from "../const";
import { db, receiverAddress } from "..";
import { isValidSolanaAddress } from "../solana";
import { createTnx } from "../tnx";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export async function botInit(bot: TelegramBot) {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            const telegramId = msg.from?.id;
            const firstName = msg.from?.first_name;
            const lastName = msg.from?.last_name;
            const username = msg.from?.username;
            const user = await db.user.upsert({
                where: { telegramId: BigInt(telegramId!) },
                update: {},
                create: {
                    telegramId: BigInt(telegramId!),
                    firstName: firstName!,
                    lastName: lastName!,
                    username: username!,
                },
            })
            console.log("User created or updated:", user);
            await bot.sendMessage(chatId, welcomeMessage, initOptions);

            const walletMsg = user.walletAddress
                ? `\n*Your Wallet:* \n\`${user.walletAddress}\``
                : `\n*No wallet found.*\nUse \`/wallet <address>\` to add one.`;

            await bot.sendMessage(chatId, walletMsg, { parse_mode: "Markdown" });


        } catch (error) {
            console.error("Error in /start command:", error);
            await bot.sendMessage(chatId, "An error occurred while processing your request. Please try again later.");
        }
    });

    bot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;
        await bot.sendMessage(chatId, helpMessage);
    });
}

export async function handleCallbackQuery(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    console.log("Callback query data:", action);

    if (!msg) return;
    const chatId = msg.chat.id;
    switchConditions(action!, chatId, bot);

    bot.answerCallbackQuery(callbackQuery.id);
}

export async function handleTextMessage(bot: TelegramBot, msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) {
        await bot.sendMessage(chatId, "I couldn't understand that message. Try using /help to see available commands.");
        return;
    }

    if (!text.startsWith('/')) {
        await bot.sendMessage(chatId, "I only understand commands that start with '/'. Try /help to see available options.");
        return;
    }

    let command = text.slice(1).toLowerCase();
    command = command.split(' ')[0];
    switchConditions(command, chatId, bot, text);
}

async function switchConditions(cmd: string, chatId: number, bot: TelegramBot, msg?: string) {
    switch (cmd) {
        case 'help':
            await bot.sendMessage(chatId, helpMessage);
            break;

        case 'rent':
            await bot.sendMessage(chatId, 'Please choose a VM configuration to rent:', allVMsReplyMarkup);
            // TODO
            break;

        case 'my_vms':
            try {
                const user = await db.user.findUnique({
                    where: { telegramId: BigInt(chatId!) },
                    include: {
                        vms: true,
                    }
                });
                if (!user) {
                    await bot.sendMessage(chatId, "You need to register first. Use /start to register.");
                    break;
                }
                if (user.vms.length === 0) {
                    await bot.sendMessage(chatId, "You don't have any VMs rented. Use /rent to rent a new VM.");
                    break;
                }
                let message = `*Your VMs:*\n\n`;
                user.vms.forEach((vm) => {
                    const rentedSince = vm.rentedAt ? new Date(vm.rentedAt).toLocaleString() : 'Unknown';
                    const expiresAt = vm.expiresAt ? new Date(vm.expiresAt).toLocaleString() : 'Not set';
                    message += `*${vm.name ? vm.name.toUpperCase() : 'UNKNOWN'}*\n`;
                    message += `• Type: ${vm.type}\n`;
                    message += `• CPU: ${vm.cpu} cores\n`;
                    message += `• RAM: ${vm.ram} GB\n`;
                    message += `• IP: ${vm.ipAddress || 'Not assigned'}\n`;
                    message += `• Rented since: ${rentedSince}\n`;
                    message += `• Expires at: ${expiresAt}\n`;
                    message += `• Hourly cost: $${vm.price.toFixed(2)}/hr\n`;
                    message += `• Status: ${vm.status}\n\n`;
                });
                message += `*Total VMs rented: ${user.vms.length}*\n`;
                message += `*Total spent: $${user.vms.reduce((sum, vm) => sum + vm.price, 0).toFixed(2)}*\n`;
                await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

            } catch (error) {
                console.error("Error fetching VMs:", error);
                await bot.sendMessage(chatId, "An error occurred while fetching your VMs. Please try again later.");
            }
            break;

        case 'available':
            const message = `*Available VM Configurations:*\n\n${allVMs.map((vm) => `*${vm.name.toUpperCase()}* \n• CPU: ${vm.cpu} cores \n• RAM: ${vm.ram} GB \n• Disk: ${vm.disk} GB \n• Price: $${vm.price.toFixed(2)}/hr \n• Status: ${vm.status}`).join('\n\n')}`;

            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            break;

        case 'usage':
            try {
                const user = await db.user.findUnique({
                    where: { telegramId: BigInt(chatId!) },
                    include: {
                        vms: true,
                        transactions: {
                            where: { status: 'confirmed' },
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                });

                if (!user) {
                    await bot.sendMessage(chatId, "You need to register first. Use /start to register.");
                    break;
                }

                const totalSpent = user.transactions.reduce((sum, tnx) => {
                    return sum + Number(tnx.lamports) / Number(BigInt(LAMPORTS_PER_SOL));
                }, 0);
                const activeVMs = user.vms.filter(vm => vm.status === 'active');

                let usageMessage = `*Your Usage Statistics*\n\n`;
                usageMessage += `Active VMs: ${activeVMs.length}\n`;
                usageMessage += `Total VMs (all time): ${user.vms.length}\n`;
                usageMessage += `Total spent: ${totalSpent.toFixed(2)}SOL\n\n`;

                if (activeVMs.length > 0) {
                    usageMessage += `*Currently Active VMs:*\n`;
                    activeVMs.forEach(vm => {
                        const rentedSince = vm.rentedAt ? new Date(vm.rentedAt).toLocaleString() : 'Unknown';
                        const expiresAt = vm.expiresAt ? new Date(vm.expiresAt).toLocaleString() : 'Not set';

                        usageMessage += `\n*${vm.name ? vm.name.toUpperCase() : 'UNKNOWN'}*\n`;
                        usageMessage += `• CPU: ${vm.cpu} cores\n`;
                        usageMessage += `• RAM: ${vm.ram} GB\n`;
                        usageMessage += `• IP: ${vm.ipAddress || 'Not assigned'}\n`;
                        usageMessage += `• Rented since: ${rentedSince}\n`;
                        usageMessage += `• Expires at: ${expiresAt}\n`;
                        usageMessage += `• Hourly cost: $${vm.price.toFixed(2)}/hr\n`;
                    });
                } else {
                    usageMessage += `You don't have any active VMs right now.\n`;
                    usageMessage += `Use /rent to rent a new VM.`;
                }
                await bot.sendMessage(chatId, usageMessage, { parse_mode: 'Markdown' });

            } catch (error) {
                console.error("Error fetching usage statistics:", error);
                await bot.sendMessage(chatId, "An error occurred while fetching your usage statistics. Please try again later.");
            }
            break;

        case 'wallet':
            const walletAddress = msg?.split(' ')[1];
            if (!walletAddress || walletAddress.trim() === '' || walletAddress === 'undefined') {
                const user = await db.user.findUnique({
                    where: { telegramId: BigInt(chatId!) },
                    select: { walletAddress: true }
                });

                if (!user || !user.walletAddress) {
                    await bot.sendMessage(
                        chatId,
                        `*No wallet address found.*\nUse \`/wallet <your_address>\` to set one.`,
                        { parse_mode: 'Markdown' }
                    );
                    break;
                }

                await bot.sendMessage(
                    chatId,
                    `*Your wallet address:*\n\`${user.walletAddress}\`\n\n*Use /wallet <address> to update it.*`,
                    { parse_mode: 'Markdown' }
                );
                break;
            }

            try {
                if (isValidSolanaAddress(walletAddress)) {
                    const user = await db.user.update({
                        where: { telegramId: BigInt(chatId!) },
                        data: { walletAddress },
                    });

                    if (!user) {
                        await bot.sendMessage(
                            chatId,
                            `*Error updating wallet address.*\nPlease try again later.`,
                            { parse_mode: 'Markdown' }
                        );
                        break;
                    }

                    await bot.sendMessage(
                        chatId,
                        `*Wallet updated successfully!*\n\`${walletAddress}\``,
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    await bot.sendMessage(
                        chatId,
                        `*Invalid wallet address.*\nPlease provide a valid Solana address.`,
                        { parse_mode: 'Markdown' }
                    );
                }
            } catch (error) {
                console.error("Error updating wallet address:", error);
                await bot.sendMessage(
                    chatId,
                    `*Error updating wallet address.*\nPlease try again later.`,
                    { parse_mode: 'Markdown' }
                );
            }
            break;

        case 'select_vm_small':
            await bot.sendMessage(chatId, 'You selected the small VM configuration. Please confirm your selection.');
            const newTnx = await createTnx(chatId, 0.01);
            if (newTnx === null) {
                await bot.sendMessage(chatId, "Unable to get wallet address. Please set your wallet address using /wallet <address>.");
                break;
            }
            const { transaction, user } = newTnx;
            console.log('Transaction created:', transaction.lamports);

            const solAmount = Number(transaction.lamports) / LAMPORTS_PER_SOL;

            await bot.sendMessage(chatId,
                `*✅ Transaction Created!*\n\n` +
                `*Amount to Send:*\n\`➤ ${solAmount.toFixed(9)} SOL\`\n\n` +
                `*Your Registered Wallet:*\n\`${user.walletAddress}\`\n\n` +
                `*Recipient Address:*\n\`${receiverAddress}\`\n\n` +
                `_Please send the exact amount **only** from your registered wallet._\n` +
                `_Do not use any other wallet to avoid delays or failed verification._`,
                { parse_mode: 'Markdown' }
            );

            await bot.sendMessage(chatId,
                `📤 *Send* \n\`${solAmount.toFixed(9)} SOL\` \n*to:* \n\`${receiverAddress}\``,
                { parse_mode: 'Markdown' }
            );

            await bot.sendMessage(chatId,
                "⏳ Once the payment is confirmed on the blockchain, your virtual machine will be activated automatically.",
                { parse_mode: 'Markdown' }
            );

            break;

        case 'select_vm_medium':
            await bot.sendMessage(chatId, 'You selected the medium VM configuration. Please confirm your selection.');
            // TODO
            break;

        case 'select_vm_large':
            await bot.sendMessage(chatId, 'You selected the large VM configuration. Please confirm your selection.');
            // TODO
            break;
    }
}