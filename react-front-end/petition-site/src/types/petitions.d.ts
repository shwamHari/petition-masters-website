interface Petition {
    petitionId: number;
    title: string;
    description: string;
    creationDate: string;
    categoryId: number;
    numberOfSupporters: number;
    supportingCost: number;

    ownerId: number;
    ownerFirstName: string;
    ownerLastName: string;

    moneyRaised: number;
    supportTiers: SupportTier[];
    image_filename: string;
}

interface Category {
    categoryId: number;
    name: string;
}

interface SupportTier {
    title: string;
    description: string;
    cost: number;
    supportTierId: number;
}

interface User {
    email: string;
    firstName: string;
    lastName: string;
}

interface UserInfo {
    userId: number;
    token: string;
}