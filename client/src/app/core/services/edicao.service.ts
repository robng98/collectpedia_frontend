import { inject, Injectable } from '@angular/core';
import { SearchParams } from '../../shared/models/searchParams';
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
    // let params = new HttpParams();
    // if (searchParams.search) {
    //   params = params.append('NomeInter', searchParams.search);
    // }

    // params = params.append('PageSize', searchParams.pageSize);
    // params = params.append('PageNumber', searchParams.pageNumber);
    // params = params.append('SortBy', searchParams.sortBy);
    // params = params.append('IsDescending', searchParams.isDescending);
    // params = params.append('PageSize', 10);
    // params = params.append('PageNumber', 1);
    // params = params.append('SortBy', 'id');
    // params = params.append('IsDescending', false);

    return this.http.get<Pagination<Edicao>>(this.baseUrl + 'edicao/serieId/' + serieId, {params});
  }

  getEdicaoById(edicaoId: number) {
    return this.http.get<Edicao>(this.baseUrl + 'edicao/' + edicaoId);
  }

}
