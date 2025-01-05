import create from 'zustand';

interface UserState {
    user: UserInfo;
    setUser: (user: UserInfo) => void;
}

const getLocalStorage = (key: string): UserInfo => JSON.parse(window.localStorage.getItem(key) as string);
const setLocalStorage = (key: string, value: UserInfo) => window.localStorage.setItem(key, JSON.stringify(value));

const useStore = create<UserState>((set) => ({
    user: getLocalStorage('user') || "",
    setUser: (user: UserInfo) => set(() => {
        setLocalStorage('user', user);
        return { user: user };
    }),

}));

export const useUserStore = useStore;
