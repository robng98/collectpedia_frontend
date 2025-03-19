import { Serie } from "./serie"

export type Publisher = {
    anoCriacao: string,
    id: number,
    logo: string | null,
    nome: string,
    series: Serie[]
    
}