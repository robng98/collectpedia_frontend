import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { ExemplarRequest, Collection, Exemplar } from "../../shared/models/colecao";
import { ColecaoStatistics } from '../../shared/models/colecao-statistics.model';
import { Pagination } from '../../shared/models/pagination';
import { environment } from '../../../environments/environment';

interface SearchParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isDescending?: boolean;
  nomeColecao?: string;
  colecaoId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private baseUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getUserCollections(params: SearchParams = {}): Observable<Pagination<Collection>> {
    let httpParams = new HttpParams();
    
    if (params.pageNumber) httpParams = httpParams.append('PageNumber', params.pageNumber.toString());
    if (params.pageSize) httpParams = httpParams.append('PageSize', params.pageSize.toString());
    
    if (params.sortBy) httpParams = httpParams.append('SortBy', params.sortBy);
    if (params.isDescending !== undefined) httpParams = httpParams.append('IsDescending', params.isDescending.toString());
    
    if (params.nomeColecao) httpParams = httpParams.append('NomeColecao', params.nomeColecao);
    
    return this.http.get<Pagination<Collection>>(`${this.baseUrl}colecao`, { params: httpParams });
  }

  getCollectionIssuesById(params: SearchParams = {}): Observable<Pagination<Exemplar>> {
    let httpParams = new HttpParams();

    if (params.pageNumber) httpParams = httpParams.append('PageNumber', params.pageNumber.toString());
    if (params.pageSize) httpParams = httpParams.append('PageSize', params.pageSize.toString());
    
    if (params.sortBy) httpParams = httpParams.append('SortBy', params.sortBy);
    if (params.isDescending !== undefined) httpParams = httpParams.append('IsDescending', params.isDescending.toString());
    if (params.colecaoId) httpParams = httpParams.append('ColecaoId', params.colecaoId.toString());

    return this.http.get<Pagination<Exemplar>>(`${this.baseUrl}exemplar`, {params: httpParams});
  }

  addIssuesToCollection(request: ExemplarRequest): Observable<Exemplar[]> {
    return this.http.post<Exemplar[]>(`${this.baseUrl}exemplar/create`, request);
  }

  createCollection(name: string): Observable<Collection> {
    const params = {
      nomeColecao: name
    };
    return this.http.post<Collection>(`${this.baseUrl}colecao/create`, params);
  }

  deleteCollection(collectionId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}colecao/delete/${collectionId}`);
  }

  getCollectionStatistics(collectionId: number): Observable<ColecaoStatistics> {
    return this.http.get<ColecaoStatistics>(`${this.baseUrl}colecao/${collectionId}/statistics`);
  }

  deleteExemplar(exemplarId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}exemplar/delete/${exemplarId}`);
  }

  deleteMultipleExemplars(exemplarIds: number[]): Observable<any[]> {
    const requests = exemplarIds.map(id => this.deleteExemplar(id));
    return forkJoin(requests);
  }
}