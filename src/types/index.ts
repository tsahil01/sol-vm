export interface VM {
    name: string;
    cpu: number;
    ram: number;
    disk: number;
    price: number;
    status: 'available' | 'rented' | 'terminated';
}