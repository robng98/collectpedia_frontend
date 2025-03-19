import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExemplarRequest, Collection, Exemplar } from "../../shared/models/colecao";
import { ColecaoStatistics } from '../../shared/models/colecao-statistics.model';
import { Pagination } from '../../shared/models/pagination';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private baseUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Updated to support pagination and sorting
  getUserCollections(params: {
    pageNumber?: number;
    pageSize?: number;
    sortBy?: string;
    isDescending?: boolean;
    nomeColecao?: string;
  } = {}): Observable<Pagination<Collection>> {
    let httpParams = new HttpParams();
    
    // Add pagination parameters
    if (params.pageNumber) httpParams = httpParams.append('PageNumber', params.pageNumber.toString());
    if (params.pageSize) httpParams = httpParams.append('PageSize', params.pageSize.toString());
    
    // Add sorting parameters
    if (params.sortBy) httpParams = httpParams.append('SortBy', params.sortBy);
    if (params.isDescending !== undefined) httpParams = httpParams.append('IsDescending', params.isDescending.toString());
    
    // Add filter parameters
    if (params.nomeColecao) httpParams = httpParams.append('NomeColecao', params.nomeColecao);
    
    return this.http.get<Pagination<Collection>>(`${this.baseUrl}colecao`, { params: httpParams });
  }

  getCollectionById(collectionId: number): Observable<Collection> {
    return this.http.get<Collection>(`${this.baseUrl}colecao/${collectionId}`);
  }

  addIssuesToCollection(request: ExemplarRequest): Observable<Exemplar[]> {
    return this.http.post<Exemplar[]>(`${this.baseUrl}exemplar/create`, request);
  }

  createCollection(name: string): Observable<Collection> {
    return this.http.post<Collection>(`${this.baseUrl}colecao/create`, { nomeColecao: name });
  }

  deleteCollection(collectionId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}colecao/${collectionId}`);
  }

  getCollectionStatistics(collectionId: number): Observable<ColecaoStatistics> {
    return this.http.get<ColecaoStatistics>(`${this.baseUrl}colecao/${collectionId}/statistics`);
  }
}