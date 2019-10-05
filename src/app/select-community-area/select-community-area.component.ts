import { Component, OnInit, Input } from '@angular/core';

import { LocationService } from '../services/location.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-select-community-area',
  templateUrl: './select-community-area.component.html',
  styleUrls: ['./select-community-area.component.scss'],
})
export class SelectCommunityAreaComponent implements OnInit {

  @Input() localitySelection: any = { 
    useLocation: true,
    countryCode: null,
    state: null,
    locality: null,
  };

  locationForm: FormGroup;

  countries: {country: string, countryCode: string}[];
  states: {state: string}[];
  localities: {city: string}[];

  showCurrentLocation: boolean = false;

  constructor(
    private modalCtrl: ModalController,

    public locationService: LocationService
  ) { }

  ngOnInit() {
    this.createForm();
    this.getCountries();
  }

  countryCtrl = new FormControl(null);
  stateCtrl = new FormControl(null);
  localityCtrl = new FormControl(null);

  createForm(){
    this.locationForm = new FormGroup({
      manualSelector: new FormGroup({
        country: this.countryCtrl,
        state: this.stateCtrl,
        locality: this.localityCtrl
      }),
      useLocation: new FormControl(this.localitySelection.useLocation)
    });

    this.countryCtrl.valueChanges.subscribe(value => {
      if (value != null){
        this.uncheckLocation();
        this.getStates(value);
      }
    });
    this.stateCtrl.valueChanges.subscribe(value => {
      if (value != null){
        // this.uncheckLocation();
        this.getLocality(this.countryCtrl.value, value);
      }
    });

    this.locationForm.get('useLocation').valueChanges.subscribe(async value => {
      if (value == true){
        const gpsOn = await this.locationService.askToTurnOnGPS(false);
        if (!gpsOn){
          this.locationForm.get('useLocation').setValue(false);
        } else {
          this.locationForm.get('manualSelector').reset();
          this.showCurrentLocation = true;
        }
      } else {
        this.showCurrentLocation = false;
      }
    });

    this.showCurrentLocation = this.localitySelection.useLocation;
  }

  uncheckLocation(){
    this.locationForm.get('useLocation').setValue(false);
  }

  async getCountries(){
    this.countries = await this.locationService.getCountries();
    if (this.localitySelection.useLocation == false && this.localitySelection.countryCode != null){
      this.localitySelection.countryName = this.countries.find(country => country.countryCode == this.localitySelection.countryCode).country;
    }
  }

  async getStates(countryCode: string){
    this.stateCtrl.disable();
    this.states = await this.locationService.getStates(countryCode);
    this.stateCtrl.enable();
  }

  async getLocality(countryCode: string, state: string){
    this.localityCtrl.disable();
    this.localities = await this.locationService.getLocalities(countryCode, state);
    this.localityCtrl.enable();
  }

  localitySelected(){

    if (this.locationForm.get('useLocation').value == false && !(this.countryCtrl.value && this.stateCtrl.value && this.localityCtrl.value)){
      this.closeModal();
      return;
    }

    this.localitySelection = this.locationForm.get('useLocation').value == true ? 
    { 
      useLocation: true,
      countryCode: null,
      state: null,
      locality: null
    } : 
    { 
      useLocation: false,
      countryCode: this.countryCtrl.value,
      state: this.stateCtrl.value,
      locality: this.localityCtrl.value,
    };
    this.modalCtrl.dismiss(this.localitySelection);
  }

  closeModal(){
    this.modalCtrl.dismiss();
  }
}
