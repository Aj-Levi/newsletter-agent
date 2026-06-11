import { create } from "zustand";

export interface ZustandStoreInterface{
    currentTheme: string;
    toggleTheme: ()=>void;
}

export const useZustandStore = create<ZustandStoreInterface>((set)=>({
    currentTheme: "abyss",
    toggleTheme: ()=>{set((state)=>{
        return state.currentTheme==="abyss"?{currentTheme: "bumblebee"}:{currentTheme: "abyss"}
    })},
}))