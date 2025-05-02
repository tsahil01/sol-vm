export interface VM {
    name: string;
    cpu: number;
    ram: number;
    disk: number;
    price: number;
    status: 'available' | 'rented' | 'terminated';
}

export interface WebhookEvent {
    webhookId: string;
    id: string;
    createdAt: string;
    type: string;
    event: {
        transaction: {
            signature: string;
            transaction: {
                signatures: string[];
                message: {
                    account_keys: string[];
                    recent_blockhash: string;
                }[];
            }[];
            meta: {
                fee: number;
                pre_balances: number[];
                post_balances: number[];
            }[]
        }[];
    };
}
