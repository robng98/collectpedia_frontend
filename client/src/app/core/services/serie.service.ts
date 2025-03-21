import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Serie } from '../../shared/models/serie';
import { SearchParams } from '../../shared/models/searchParams';
import { Pagination } from '../../shared/models/pagination';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SerieService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient); 

  searchByType(searchParams: SearchParams): Observable<Pagination<Serie>> {
    let params = new HttpParams();
    let type = searchParams.type;
    if (searchParams.search) {
      params = params.append('NomeInter', searchParams.search);
    }

    params = params.append('PageSize', searchParams.pageSize);
    params = params.append('PageNumber', searchParams.pageNumber);
    params = params.append('SortBy', searchParams.sortBy);
    params = params.append('IsDescending', searchParams.isDescending);

    return this.http.get<Pagination<Serie>>(this.baseUrl + 'serie/' + type, {params});
  }

  getSerieById(id: number): Observable<Serie> {
    return this.http.get<Serie>(this.baseUrl + 'serie/' + id);
  }
}
