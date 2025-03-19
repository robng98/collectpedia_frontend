import { Contribuicao } from "./contribuicao";

export type Edicao = {
    id: number,
    fotoCapa: string,
    numero: string,
    unMonetaria: string,
    preco: number,
    dataLancamento: string,
    serieId: number,
    serieNome: string,
    expanded?: boolean;
};