export const welcomeMessage = `Hello!\nWelcome to Solana VM Bot.\nThis bot enables you to rent a cloud VM on Google Cloud Platform (GCP) and pay it via Solana.\n\nTo get started, please choose an option from the menu below.\nUse /help to see all commands.`;
export const initOptions = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: '💻 Rent VM', callback_data: 'rent' },
                { text: '📋 My VMs', callback_data: 'my_vms' }
            ],
            [
                { text: 'Available VMs', callback_data: 'available' },
                { text: '📊 Usage Stats', callback_data: 'usage' },
            ],
            [
                { text: '❓ Help', callback_data: 'help' },
            ]
        ]
    }
};
export const helpMessage = `Solana VM Bot lets you rent a GCP VM and pay with Solana.\nAvailable commands:\n\n` +
    `/start - Start a new Session\n` +
    `/end - End the current session\n` +
    `/rent - Rent a new VM\n` +
    `/my_vms - List your rented VMs\n` +
    `/available - Show available VMs\n` +
    `/usage - Show usage statistics\n` +
    `/help - Show this help message\n` +
    `\nFor more information, visit our website.`;

