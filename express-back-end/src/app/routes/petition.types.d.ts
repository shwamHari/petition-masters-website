interface Petition {
    id?: number;
    title?: string;
    description?: string;
    creation_date?: string;
    image_filename?: string;
    owner_id?: number;
    category_id?: number;
}

interface SupportTier {
    id?: number;
    petition_id: number;
    title?: string;
    description?: string;
    cost: number;
}

interface Category {
    id?: number;
    name?: string;
}