import { Injectable } from '@angular/core';
import { EventsService } from './events.service';

declare let OceanaCustomerWebVoiceVideo: any;


@Injectable({
  providedIn: 'root'
})
export class CommonService {
 
  constructor(private eventsService: EventsService) { }

  convertInteractionState(state: any) {
    let InteractionState = OceanaCustomerWebVoiceVideo.Services.Work.InteractionState;

    var keys = Object.keys(InteractionState).reduce(function (acc: any, key: any) {
      return acc[InteractionState[key]] = key, acc;
    }, {});

    return keys[state];
  }

  formatCallTime(callTimeElapsed: number) {

    if(isNaN(callTimeElapsed)) { // Not a Number
      return [];
    }
    var callTimeSeconds = Math.floor(callTimeElapsed / 1000);
    var seconds = callTimeSeconds % 60;
    var minutes = (callTimeSeconds - seconds) / 60;

    return this._pad(minutes) + ":" + this._pad(seconds);
  }

  _pad(unit: number) {
    return ('00' + unit).slice(-2);
  }


}
