interface User {
    id?: number;
    email?: string;
    first_name?: string;
    last_name?: string;
    image_filename?: string;
    password?: string;
    auth_token?: string;
}

interface Supporter {
    id?: number;
    petition_id?: number;
    support_tier_id?: number;
    first_name?: string;
    last_name?: string;
    user_id?: number;
    message?: string;
    timestamp?: string;
}
