// Collection model
export type Collection = {
    id: number;
    nomeColecao: string;  // Collection name
    exemplares?: Exemplar[]; // Optional array of exemplars
  }
  
  // Exemplar model (physical copy of a comic)
  export type Exemplar = {
    id: number;
    estadoConservacao: string;  // Condition/grade
    dataAquisicao: string;      // Acquisition date
    edicaoId: number;           // Comic issue ID
    colecaoId: number;          // Collection ID
  }
  
  // Request to create an exemplar
  export type ExemplarRequest = {
    estadoConservacao: string;
    dataAquisicao: string;
    edicaoId: number;
    colecaoId: number;  
  }