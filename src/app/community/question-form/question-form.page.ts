import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { ModalController, AlertController, ToastController } from '@ionic/angular';

import { DocumentReference } from '@angular/fire/firestore';

import { AuthService } from 'src/app/services/auth.service';
import { LocationService } from 'src/app/services/location.service';
import { QueAnsService } from 'src/app/services/que-ans.service';
import { Question } from 'src/app/models/question.model';

@Component({
  selector: 'app-question-form',
  templateUrl: './question-form.page.html',
  styleUrls: ['./question-form.page.scss'],
})
export class QuestionFormPage implements OnInit {

  @Input() areaId: string;
  @Input() communityId: string;

  questionForm: FormGroup;
  isSubmitionInitiated = false;

  questionRef: DocumentReference = null;

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,

    private authService: AuthService,
    private locationService: LocationService,
    private queAnsService: QueAnsService
  ) { }

  ngOnInit() {
    this.createForm();
  }

  createForm(){
    this.questionForm = new FormGroup({
      question: new FormControl('', Validators.required),
      details: new FormControl('', [Validators.required, Validators.minLength(30)])
    });
  }

  async createQuestion(){

    this.isSubmitionInitiated = true;
    if (this.questionForm.invalid) return;

    if (!this.locationService.canTakeAction({areaId: this.areaId})){
      const locationNotMatched = await this.alertCtrl.create({
        header: 'Now allowed',
        message: `You cannot interact within this community, because your current location doesn't match the locality of this community.`,
        buttons: ['OK']
      });
      locationNotMatched.present();
      return;
    }

    const currentLocation = this.locationService.location$.value;
    this.questionForm.disable();
    
    const newQuestion: Question = {
      question: this.questionForm.get('question').value,
      details: this.questionForm.get('details').value,

      areaId: this.areaId,
      communityId: this.communityId,

      uid: this.authService.user$.value.uid,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude
    };

    try {
      this.questionRef = await this.queAnsService.create(newQuestion);
      const successToast = await this.toastCtrl.create({
        message: 'New question posted successfully',
        duration: 3000
      });
      successToast.present();
      this.closeModal();

    } catch(error){
      console.log('Error while creating a question', error);
      const errorToast = await this.toastCtrl.create({
        message: 'There was some error while posting a new question',
        duration: 3000
      });
      errorToast.present();
      this.closeModal();
    }
  }


  closeModal(){
    this.modalCtrl.dismiss({
      questionRef: this.questionRef
    });
  }

}
