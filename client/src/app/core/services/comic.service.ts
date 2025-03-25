import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, forkJoin, map } from "rxjs";
import { Edicao } from "../../shared/models/edicao";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class ComicService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getIssuesByIds(issueIds: number[]): Observable<Edicao[]> {
    const requests = issueIds.map(id => 
      this.http.get<Edicao>(`${this.baseUrl}edicao/${id}`)
    );
    
    return forkJoin(requests);
  }
}