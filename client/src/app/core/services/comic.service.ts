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
    // Create an array of requests, one for each issue ID
    const requests = issueIds.map(id => 
      this.http.get<Edicao>(`${this.baseUrl}edicao/${id}`)
    );
    
    // Use forkJoin to make parallel requests and wait for all to complete
    return forkJoin(requests);
  }
}