import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Publisher } from '../../shared/models/publisher';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Pagination } from '../../shared/models/pagination';
import { Serie } from '../../shared/models/serie';
import { SearchParams } from '../../shared/models/searchParams';

@Injectable({
  providedIn: 'root'
})
export class PublisherService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getPublisherById(publisherId: number) {
    return this.http.get<Publisher>(this.baseUrl + 'editora/' + publisherId);
  }

  getPublishers(searchParams: SearchParams): Observable<Pagination<Publisher>> {
    let params = new HttpParams()
      .set('PageNumber', searchParams.pageNumber.toString())
      .set('PageSize', searchParams.pageSize.toString())
      .set('SortBy', searchParams.sortBy.toString())
      .set('IsDescending', searchParams.isDescending);

    if (searchParams.search) {
      params = params.append('Nome', searchParams.search);
    }

    return this.http.get<Pagination<Publisher>>(this.baseUrl + 'editora', { params });
  }

  getPublisherSeries(publisherId: number, search: string, page: number = 1, pageSize: number = 20, sortBy: string = 'nomeInter', isDescending: boolean = false): Observable<Pagination<Serie>> {
    const params = new HttpParams()
      .set('editoraId', publisherId.toString())
      .set('nomeInter', search.toString())
      .set('PageNumber', page.toString())
      .set('PageSize', pageSize.toString())
      .set('SortBy', sortBy.toString())
      .set('IsDescending', isDescending);

    return this.http.get<Pagination<Serie>>(this.baseUrl + 'serie', { params });
  }
}
