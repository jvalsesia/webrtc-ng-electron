import { Injectable } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { GlobalConstants } from '../contants/global-constants';
import { AawgConfig } from '../models/aawg-config';
import { Optional } from '../models/optional';
import { WorkRequest } from '../models/work-request';
import { CommonService } from './common.service';
import { EventsService } from './events.service';
import { TokenService } from './token.service';

declare let OceanaCustomerWebVoiceVideo: any;

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  serviceAvailable = false;
  active = false;
  audioInteraction: any;
  work: any;
  service: any;
  eventsSubscritpion!: Subscription;

  constructor(private tokenService: TokenService,
    private commonService: CommonService,
    private eventsService: EventsService) {

  }

  start(aawgConfig: AawgConfig, workRequestConfig: WorkRequest, optionalConfig: Optional) {
    if (this.active) {
      console.error("Call already active");
      return false;
    }

    this.work = this.initialiseClient(aawgConfig, workRequestConfig);

    this.getToken(aawgConfig, workRequestConfig, optionalConfig);



    return true;
  }

  initialiseClient(aawgConfig: AawgConfig, workRequestConfig: WorkRequest) {
    var clientInstance;
    var work;
    if (aawgConfig) {
      if (!clientInstance) {
        var config = {
          "webGatewayAddress": aawgConfig.webGatewayAddress,
          "webGatewayConfiguration": aawgConfig.webGatewayConfiguration,
          "port": aawgConfig.port,
          "secure": aawgConfig.secure
        };
        clientInstance = new OceanaCustomerWebVoiceVideo(config);
        console.debug('SDK: version - ' + clientInstance.getVersionNumber());
        console.info('Reference Client: Oceana SDK instance created');
        clientInstance.registerLogger(console);
        console.info('Reference Client: Oceana SDK logger registered');
      } else {
        clientInstance = undefined;
        console.log('SDK: invalid configuration object provided');
      }
    }

    console.log("clientInstance: " + JSON.stringify(clientInstance));


    if (workRequestConfig) {
      work = clientInstance.createWork();
      work.setRoutingStrategy(workRequestConfig.strategy);
      work.setLocale(workRequestConfig.locale);

      console.log(work);

      var service = new OceanaCustomerWebVoiceVideo.Services.Work.Schema.Service();
      console.log(service);
      /*
      if (this.workRequest.attributes && this.workRequest.attributes.length > 0) {
        console.log(this.workRequest.attributes);
        this.service.setAttributes(this.workRequest.attributes);
      }
      */

      service.setPriority(5);
      work.setServices([service]);

      if (workRequestConfig.nativeResourceId && workRequestConfig.sourceName) {
        // create a resource if the resource Id and source name are configured in the client application
        var resource = new OceanaCustomerWebVoiceVideo.Services.Work.Schema.Resource();
        resource.setNativeResourceId(workRequestConfig.nativeResourceId);
        resource.setSourceName(workRequestConfig.sourceName);

        work.setResources([resource]);
      }

      return work;

    } else {
      console.log('SDK: invalid service or resource object provided');
    }

  }

  getToken(aawgConfig: AawgConfig, workRequestConfig: WorkRequest, optionalConfig: Optional) {
    let tokenServiceString = localStorage.getItem('elite.token.config');
    let customer = localStorage.getItem('elite.customer');

    if (tokenServiceString && customer) {
      console.log(tokenServiceString);
      let tokenServiceConfig = JSON.parse(tokenServiceString);
      let identify = JSON.parse(customer);

      let data = {
        "use": "csaGuest",
        "calledNumer": optionalConfig ? optionalConfig.destinationAddress : [],
        "callingNumber": identify ? identify.fromAddress : [],
        "displayName": identify ? identify.displayName : []
      };
      let protocol = 'https';

      if (tokenServiceConfig.secure === false) {
        protocol = 'http';
      }


      let url = protocol + '://' + tokenServiceConfig.tokenServiceAddress + ':' + tokenServiceConfig.port + '/' + tokenServiceConfig.urlPath;
      console.log(url);
      this.tokenService.getToken(url, data)
        .subscribe(
          response => {

            var token = response.encryptedToken;
            console.log(token);
            localStorage.setItem('client.authToken', token);
            console.log("this.work: " + JSON.stringify(this.work));
            this._createAudioInteraction(optionalConfig);

            if (this.audioInteraction && !this.active) {
              this.audioInteraction.start();
            } else {
              console.error('Reference Client: error starting Web Voice call');

            }
          },
          error => {
            console.log(error);
          });
    }

  }

  _createAudioInteraction(optional: Optional) {
    console.log('optional: ' + JSON.stringify(optional));
    if (this.work) {
      this.work.setContext(optional.context);
      this.work.setTopic(optional.topic);

      this.audioInteraction = this.work.createAudioInteraction(localStorage.getItem('client.platform'));

      console.log('this.audioInteraction: ' + JSON.stringify(this.audioInteraction));
      if (this.audioInteraction) {
        this.audioInteraction.setAuthorizationToken(localStorage.getItem('client.authToken'));

        this._subcribeUIEvents();




        // register for voice interaction callbacks
        this.audioInteraction.addOnAudioInteractionInitiatingCallback(() => {
          this.active = true;
          console.info('Reference Client: INITIATING!!!');
          console.log(this.audioInteraction.getInteractionState());
          var state = this.commonService.convertInteractionState(this.audioInteraction.getInteractionState());
          console.log("state: " + JSON.stringify(state));
          this.eventsService.sendEvent({
            "type": "voice.interaction.event.statechange",
            "state": state
          });

          this.eventsService.sendEvent({
            "type": "voice.interaction.active",
            "active": this.active
          });
        });


        this.audioInteraction.addOnAudioInteractionRemoteAlertingCallback(() => {
          console.info('Reference Client: REMOTE_ALERTING!!!');
          var state = this.commonService.convertInteractionState(this.audioInteraction.getInteractionState());
          this.eventsService.sendEvent({
            "type": "voice.interaction.event.statechange",
            "state": state
          });

          var counter = interval(1000);
          counter.subscribe(t => {
            var tick = this.commonService.formatCallTime((this.audioInteraction.getInteractionTimeElapsed()));
            //console.info(t);
            //console.info(tick);
            this.eventsService.sendEvent({
              "type": "voice.interaction.event.duration",
              "time": tick
            });

          });
        });


        this.audioInteraction.addOnAudioInteractionCallQualityCallback((callQuality: any) => {
          console.info('Reference Client: Call quality!!!!!!!!  ' + callQuality);
          this.eventsService.sendEvent({
            "type": "ui.voice.callQuality",
            "quality": [callQuality]
          });
        });


        this.audioInteraction.addOnAudioInteractionActiveCallback(() => {
          console.info('Reference Client: ESTABLISHED!!!');
          var state = this.commonService.convertInteractionState(this.audioInteraction.getInteractionState());
          console.log("state: " + JSON.stringify(state));
          this.eventsService.sendEvent({
            "type": "voice.interaction.event.statechange",
            "state": state
          });
        });


        this.audioInteraction.addOnAudioInteractionEndedCallback(() => {
          this.active = false;
          console.info('Reference Client: INTERACTION_ENDED!!!');
          var state = this.commonService.convertInteractionState(this.audioInteraction.getInteractionState());
          this.eventsService.sendEvent({
            "type": "voice.interaction.event.statechange",
            "state": state
          });
          this.eventsService.sendEvent({
            "type": "timer.stop",
            "state": []
          });
          this.eventsService.sendEvent({
            "type": "ui.voice.close",
            "state": []
          });
          this.eventsService.sendEvent({
            "type": "ui.voice.buttonchange",
            "buttonId": GlobalConstants.WebRTCEndCall,
            "active": state
          });
          this.eventsService.sendEvent({
            "type": "voice.interaction.active",
            "active": this.active
          });
        });


        this.audioInteraction.addOnAudioInteractionFailedCallback((data: any) => {
          this.active = false;
          console.info('Reference Client: INTERACTION_FAILED!!!');
          console.error('error: ' + data.reason);
          var state = this.commonService.convertInteractionState(this.audioInteraction.getInteractionState());
          this.eventsService.sendEvent({
            "type": "voice.interaction.event.statechange",
            "state": state
          });
          this.eventsService.sendEvent({
            "type": "ui.interaction.error",
            "message": GlobalConstants.InteractionFailed + data.reason,
            "timeout": 5000
          });
        });


        this.audioInteraction.addOnAudioInteractionAudioMuteStatusChangedCallback((state: any) => {
          console.info('Reference Client: Audio Mute state change [' + state + ']');
          this.eventsService.sendEvent({
            "type": "ui.voice.buttonchange",
            "buttonId": GlobalConstants.WebRTCMuteAudio,
            "active": state
          });


          this.audioInteraction.addOnAudioInteractionHoldStatusChangedCallback((state: any) => {
            console.info('Reference Client: Hold state change [' + state + ']');
            this.eventsService.sendEvent({
              "type": "ui.voice.buttonchange",
              "buttonId": GlobalConstants.WebRTCHoldCall,
              "active": state
            });
            // get interaction's state
            state = this.commonService.convertInteractionState(this.audioInteraction.getInteractionState());
            this.eventsService.sendEvent({
              "type": "voice.interaction.event.statechange",
              "state": state
            });
          });



          this.audioInteraction.addOnAudioInteractionServiceConnectedCallback(() => {
            console.log('Reference Client: AUDIO SERVICE [connected]');
            this.eventsService.sendEvent({
              "type": "ui.client.state",
              "state": GlobalConstants.WebRTCCallStateConnected
            });

          });

          this.audioInteraction.addOnAudioInteractionServiceConnectingCallback(() => {
            console.log('Reference Client: AUDIO SERVICE [connecting]');
            this.eventsService.sendEvent({
              "type": "ui.client.state",
              "state": GlobalConstants.WebRTCCallStateConnecting
            });
          });

          this.audioInteraction.addOnAudioInteractionServiceDisconnectedCallback(() => {
            console.log('Reference Client: AUDIO SERVICE [disconnected]');
            this.eventsService.sendEvent({
              "type": "ui.client.state",
              "state": GlobalConstants.WebRTCCallStateDisconnected
            });
          });

        });









        var destination = optional.destinationAddress;

        if (destination) {
          this.audioInteraction.setDestinationAddress(destination);
        }
        this.audioInteraction.setContextId(optional.context);
        this.audioInteraction.setPlatformType(localStorage.getItem('client.platform'));


      }

    } else {
      console.log('Reference Client: no work instance exists please create a work instance with createWork()');
    }
  }



  _toggleMuteAudio() {
    console.info('Reference Client: toggling audio mute');
    this.audioInteraction.muteAudio(!this.audioInteraction.isAudioMuted());
  }

  _toggleHoldCall() {
    console.info('Reference Client: toggling call hold');
    this.audioInteraction.holdCall(!this.audioInteraction.isCallHeld());
  }

  _end() {
    console.info('Reference Client: ending interaction');
    this.audioInteraction.end();
  }

  _sendDTMF(tone: string) {
    console.info('Reference Client: sending DTMF: ' + tone);
    this.audioInteraction.sendDTMF(tone);
}

  _subcribeUIEvents() {
    this.eventsSubscritpion = this.eventsService.getEvent().subscribe(event => {
      if (event) {
        console.info(event.type);
        switch (event.type) {
          case 'voice.interaction.mute':
            this._toggleMuteAudio();
            break;
          case 'voice.interaction.holdCall':
            this._toggleHoldCall();
            break;
          case 'voice.interaction.end':
            this._end();
            break;
          case 'voice.interaction.dtmf':
            this._sendDTMF(event.tone);
        }
      }
    });
  }


}
