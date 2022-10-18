import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private subject = new Subject<any>();

  constructor() { }

  sendEvent(event: any) {
    this.subject.next(event);
  }

  getEvent(): Observable<any> {
    return this.subject.asObservable();
  }
}
