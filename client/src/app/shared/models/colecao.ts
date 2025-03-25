export type Collection = {
    id: number;
    nomeColecao: string;  
    exemplares?: Exemplar[]; 
  }
  
  export type Exemplar = {
    id: number;
    estadoConservacao: string;  
    dataAquisicao: string;      
    edicaoId: number;           
    colecaoId: number;          
  }
  
  export type ExemplarRequest = {
    estadoConservacao: string;
    dataAquisicao: string;
    edicaoId: number;
    colecaoId: number;  
  }