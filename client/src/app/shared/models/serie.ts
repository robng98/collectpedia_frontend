import { Genero } from "./genero"
import { MangaStats } from "./mangaStats"

export type Serie = {
    id: number,
    estadoPubAtual: string,
    nomeInter: string,
    cicloNum: number,
    editoraId: number,
    generos: Genero[],
    mangaStats: MangaStats,
    numEdicoes: number,
}