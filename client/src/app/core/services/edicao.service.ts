import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Edicao } from '../../shared/models/edicao';
import { Pagination } from '../../shared/models/pagination';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EdicaoService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  
  getFirstCoverBySerieId(serieId: number){
    return this.http.get<Pagination<Edicao>>(this.baseUrl + 'edicao/serieId/' + serieId + '?PageSize=1&SortBy=id&IsDescending=false');
  }

  getEdicoesBySerieId(serieId: number, params: HttpParams) {
    return this.http.get<Pagination<Edicao>>(this.baseUrl + 'edicao/serieId/' + serieId, {params});
  }

  getEdicaoById(edicaoId: number) {
    return this.http.get<Edicao>(this.baseUrl + 'edicao/' + edicaoId);
  }

}
