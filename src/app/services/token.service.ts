import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  
  headers = new HttpHeaders().set('Content-Type', 'application/vnd.avaya.csa.tokens.v1+json');


  constructor(private httpClient: HttpClient) { }

  getToken(url: string, data: any): Observable<any> {
    return this.httpClient.post(url, data).pipe(
      catchError(this.handleError)
    );
  }

   // Handle API errors
   handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    return throwError(
      'Something bad happened; please try again later.');
  };

}
