import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { ModalController, ToastController } from '@ionic/angular';

import { AuthService } from '../services/auth.service';
import { LocationService } from '../services/location.service';
import { CommunityService } from '../services/community.service';
import { SlugifyPipe } from '../pipes/slugify.pipe';
import { Community } from '../models/community.model';
import { CommunityArea } from '../models/community-area.model';

@Component({
  selector: 'app-community-form',
  templateUrl: './community-form.page.html',
  styleUrls: ['./community-form.page.scss'],
})
export class CommunityFormPage implements OnInit {

  communityForm: FormGroup;
  isSubmitionInitiated = false;
  fcName: FormControl;
  fcSubtitle: FormControl;
  fcDetails: FormControl;

  refreshContent = false;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,

    private locationService: LocationService,
    private communityService: CommunityService
  ) {
    this.createForm();
  }

  createForm(){

    this.fcName = new FormControl('', Validators.required);
    this.fcSubtitle = new FormControl('', Validators.minLength(5));
    this.fcDetails = new FormControl('', [Validators.required, Validators.minLength(30)]);
    this.communityForm = new FormGroup({
      name: this.fcName,
      subtitle: this.fcSubtitle,
      details: this.fcDetails
    })
  }

  ngOnInit() {
  }

  async sendRequest(){
    this.isSubmitionInitiated = true;
    if (!this.communityForm.valid) return;

    const currentLocation = this.locationService.location$.value;

    const communityArea: CommunityArea = {
      areaId: this.locationService.getAreaId(this.locationService.location$.value.area),
      country: currentLocation.area.countryName,
      countryCode: currentLocation.area.countryCode,
      state: currentLocation.area.state,
      city: currentLocation.area.city
    };
    
    const data: Community = {
      name: this.fcName.value,
      subtitle: this.fcSubtitle.value,
      details: this.fcDetails.value
    }
    console.log('Creating new Community', data);
    try{
      await this.communityService.create(communityArea, data);
      //creation successful
      const toast = await this.toastCtrl.create({
        message: 'New community request sent successfully',
        duration: 2000
      });
      await toast.present();
      this.refreshContent = true;
    } catch (error){
      console.log('New community creation error',error);
      const toast = await this.toastCtrl.create({
        message: 'There was some error in sending request to create a new community, please try again.'
      });
      toast.present();
      this.refreshContent = false;
    } finally {
      this.closeModal();
    }
    
  }

  closeModal(){
    this.modalCtrl.dismiss({
      refreshContent: this.refreshContent
    });
  }

}
