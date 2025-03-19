import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Pagination } from '../../shared/models/pagination';
import { Edicao } from '../../shared/models/edicao';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LastAddedIssuesService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient); 
  
  getLastAddedIssues(){
    return this.http.get<Pagination<Edicao>>(this.baseUrl + 'edicao?PageSize=5&SortBy=id&IsDescending=true')
  }
}
