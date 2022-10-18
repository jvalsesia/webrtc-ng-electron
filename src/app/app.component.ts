import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition, } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { GlobalConstants } from './contants/global-constants';
import { AawgConfig } from './models/aawg-config';
import { Customer } from './models/customer';
import { GeneralConfig } from './models/general-config';
import { Optional } from './models/optional';
import { TokenServiceConfig } from './models/token-service-config';
import { WorkRequest } from './models/work-request';
import { EventsService } from './services/events.service';
import { VoiceService } from './services/voice.service';

declare var OceanaCustomerWebVoiceVideo: any;



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'WebRTC Voice Call';
  color: ThemePalette = 'accent';
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'bottom';
  isSidenavShowing = false;
  webGatewayConfig = '';
  clientConfigForm!: FormGroup;



  generalConfig!: GeneralConfig;
  aawgConfig!: AawgConfig;
  workRequest!: WorkRequest;
  customer!: Customer;
  optional!: Optional;
  tokenServiceConfig!: TokenServiceConfig;

  client: any;
  work: any;
  service: any;

  strategies: any[] = [
    { strategy: 'Most Idle' },
    { strategy: 'Least Occupied' },
  ];
  selectedStrategy!: string;

  checked = false;

  // events
  eventsSubscritpion!: Subscription;
  uiClientState!: any;
  voiceInteractionEventStateChange!: any;
  voiceInteractionEventDuration!: any;
  uiVoiceCallQuality!: any;
  mute!: boolean;
  hold!: boolean;
  active!: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private _configSnackBar: MatSnackBar,
    private _errorSnackBar: MatSnackBar,
    private voiceService: VoiceService,
    private eventsService: EventsService) {
    this._listenEvents();
  }

  ngOnInit(): void {
    this.mute = false;
    this.hold = false;
    this.active = false;
    this.reloadConfig();
  }

  reloadConfig() {
    localStorage.setItem('client.platform', OceanaCustomerWebVoiceVideo.Services.Work.PlatformType.ELITE);

    let aawgString = localStorage.getItem('elite.aawg.config');
    if (aawgString) {
      console.log(aawgString);
      this.aawgConfig = JSON.parse(aawgString);
    }

    let customerString = localStorage.getItem('elite.customer');
    if (customerString) {
      console.log(customerString);
      this.customer = JSON.parse(customerString);
    }

    let optionalString = localStorage.getItem('elite.optional');
    if (optionalString) {
      console.log(optionalString);
      this.optional = JSON.parse(optionalString);
    }

    let tokenServiceString = localStorage.getItem('elite.token.config');
    if (tokenServiceString) {
      console.log(tokenServiceString);
      this.tokenServiceConfig = JSON.parse(tokenServiceString);
    }

    let workRequestString = localStorage.getItem('elite.workRequest');
    if (workRequestString) {
      console.log(workRequestString);
      this.workRequest = JSON.parse(workRequestString);
    }


    this.clientConfigForm = this.formBuilder.group({
      displayNameInput: this.customer ? [this.customer.displayName] : [null],
      fromAddressInput: this.customer ? [this.customer.fromAddress] : [null],
      destinationAddressInput: this.optional ? [this.optional.destinationAddress] : [null],
      contextInput: this.optional ? [this.optional.context] : [null],
      topicInput: this.optional ? [this.optional.topic] : [null],
      priorityInput: this.workRequest ? [this.workRequest.priority] : [null],
      localeInput: this.workRequest ? [this.workRequest.locale] : [null],
      strategyInput: this.workRequest ? [this.workRequest.strategy] : [null],
      sourceNameInput: this.workRequest ? [this.workRequest.sourceName] : [null],
      resourceIdInput: this.workRequest ? [this.workRequest.nativeResourceId] : [null],
      aAWGServerAddressInput: this.aawgConfig ? [this.aawgConfig.webGatewayAddress] : [null],
      aAWGServerPortInput: this.aawgConfig ? [this.aawgConfig.port] : [null],
      useHTTPSInput: this.aawgConfig ? [this.aawgConfig.secure] : [true],
      tokenServerAddressInput: this.tokenServiceConfig ? [this.tokenServiceConfig.tokenServiceAddress] : [null],
      tokenServerPortInput: this.tokenServiceConfig ? [this.tokenServiceConfig.port] : [null],
      tokenUseHTTPSInput: this.tokenServiceConfig ? [this.tokenServiceConfig.secure] : [true],
      tokenServiceURLPathInput: this.tokenServiceConfig ? [this.tokenServiceConfig.urlPath] : [null],
    });

  }

  configSubmit() {
    if (!this.clientConfigForm.valid) {
      return;
    }
    this.generalConfig = this.clientConfigForm.value;
    console.log(this.generalConfig);

    var aawgConfig = {
      webGatewayAddress: this.generalConfig.aAWGServerAddressInput,
      webGatewayConfiguration: this.generalConfig.aAWGServerAddressInput,
      port: this.generalConfig.aAWGServerPortInput,
      secure: this.generalConfig.useHTTPSInput
    };

    var customer = {
      displayName: this.generalConfig.displayNameInput,
      fromAddress: this.generalConfig.fromAddressInput,
    };

    var optional = {
      destinationAddress: this.generalConfig.destinationAddressInput,
      context: this.generalConfig.contextInput,
      topic: this.generalConfig.topicInput
    };

    var tokenService = {
      tokenServiceAddress: this.generalConfig.tokenServerAddressInput,
      port: this.generalConfig.tokenServerPortInput,
      urlPath: this.generalConfig.tokenServiceURLPathInput,
      secure: this.generalConfig.tokenUseHTTPSInput
    }

    var workRequest = {
      priority: this.generalConfig.priorityInput,
      locale: this.generalConfig.localeInput,
      strategy: this.generalConfig.strategyInput,
      sourceName: this.generalConfig.sourceNameInput ? "" : "",
      nativeResourceId: this.generalConfig.resourceIdInput ? "" : ""
    };

    localStorage.setItem('elite.aawg.config', JSON.stringify(aawgConfig));
    localStorage.setItem('elite.customer', JSON.stringify(customer));
    localStorage.setItem('elite.optional', JSON.stringify(optional));
    localStorage.setItem('elite.token.config', JSON.stringify(tokenService));
    localStorage.setItem('elite.workRequest', JSON.stringify(workRequest));



    this._configSnackBar.open('Config Saved', 'Settings', {
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
      duration: 3000
    });
    this.isSidenavShowing = false;
  }

  showError(message: string, timeout: number) {
    this._errorSnackBar.open(message, 'ERROR', {
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
      duration: timeout
    })
  }

  showSidenav() {
    this.isSidenavShowing = !this.isSidenavShowing;
  }
  getTokenFromConfig() {
    return localStorage.getItem('client.authToken');
  }

  startCall() {
    this.reloadConfig();
    console.log(this.aawgConfig);
    console.log(this.workRequest);
    console.log(this.optional);
    this.voiceService.start(this.aawgConfig, this.workRequest, this.optional);
  }

  endCall() {
    console.debug('end pressed');
    this.eventsService.sendEvent({
      "type": "voice.interaction.end"
    });
  }

  holdCall() {
    console.debug('hold pressed');
    this.eventsService.sendEvent({
      "type": "voice.interaction.holdCall"
    });
  }


  volumeMute() {
    console.debug('mute pressed');
    this.eventsService.sendEvent({
      "type": "voice.interaction.mute"
    });
  }

  
  dtmf(key: string) {
    console.debug('dtmf ' + key + ' pressed');
    this.eventsService.sendEvent({
      "type": "voice.interaction.dtmf",
      "tone" : key
    });
  }

  _listenEvents() {
    this.eventsSubscritpion = this.eventsService.getEvent().subscribe((event: { type: any; state: any; time: any; quality: any; message: string; timeout: number; active: boolean; }) => {
      if (event) {
        switch (event.type) {
          case 'voice.interaction.event.statechange':
            this.voiceInteractionEventStateChange = event.state;
            break;
          case 'ui.client.state':
            this.uiClientState = event.state;
            break;
          case 'voice.interaction.event.duration':
            this.voiceInteractionEventDuration = event.time;
            break;
          case 'ui.voice.callQuality':
            this.uiVoiceCallQuality = event.quality;
            break;
          case 'ui.interaction.error':
            this.showError(event.message, event.timeout);
            break;
          case 'ui.voice.buttonchange':
            this._checkUIEvents(event);
            break;
          case 'voice.interaction.active':
            this.active = event.active;
            break;
        }
      }
    });
  }

  _checkUIEvents(event: any) {
    switch (event.buttonId) {
      case GlobalConstants.WebRTCMuteAudio:
        this.mute = event.active;
        console.info("Mute: " + this.mute);
        break;
      case GlobalConstants.WebRTCHoldCall:
        this.hold = event.active;
        console.info("Hold: " + this.hold);
        break;
      case GlobalConstants.WebRTCEndCall:
        console.info("Ending call");
        this._clearUI();
        break;
    }
  }

  _clearUI() {
    this.uiClientState = [];
    this.voiceInteractionEventStateChange = [];
    this.voiceInteractionEventDuration = [];
    this.uiVoiceCallQuality = [];
    this.mute = false;
    this.hold = false;
  }



}
