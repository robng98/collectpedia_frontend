import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Contribuicao } from '../../shared/models/contribuicao';
import { Observable } from 'rxjs';
import { Pagination } from '../../shared/models/pagination';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContribuidorService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  
  // getEdicoesBySerieId(edicaoId: number, params: HttpParams) {
  //   return this.http.get<Pagination<Edicao>>(this.baseUrl + 'edicao/edicaoId/' + edicaoId, { params });
  // }
  
  getContribuicoesByEdicaoId(edicaoId: number, options: {
    pageNumber?: number,
    pageSize?: number,
    sortBy?: string,
    isDescending?: boolean
  } = {}): Observable<Pagination<Contribuicao>> {
    let params = new HttpParams();
    
    // Add the edicaoId as a filter parameter
    params = params.append('EdicaoId', edicaoId.toString());
    
    // Add pagination parameters
    params = params.append('PageSize', options.pageSize?.toString() || '50');
    params = params.append('PageNumber', options.pageNumber?.toString() || '1');
    
    // Add sorting parameters
    params = params.append('SortBy', options.sortBy || 'funcao');
    params = params.append('IsDescending', options.isDescending?.toString() || 'false');

    return this.http.get<Pagination<Contribuicao>>(this.baseUrl + 'contribui/', {params});
  }
}
