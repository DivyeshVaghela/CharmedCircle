import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { ModalController, AlertController, ToastController } from '@ionic/angular';

import { DocumentReference } from '@angular/fire/firestore';

import { AuthService } from 'src/app/services/auth.service';
import { LocationService } from 'src/app/services/location.service';
import { QueAnsService } from 'src/app/services/que-ans.service';
import { Answer } from 'src/app/models/answer.model';

@Component({
  selector: 'app-answer-form',
  templateUrl: './answer-form.page.html',
  styleUrls: ['./answer-form.page.scss'],
})
export class AnswerFormPage implements OnInit {

  @Input() areaId: string;
  @Input() communityId: string;
  @Input() questionId: string;
  @Input() question: string;

  answerForm: FormGroup;
  isSubmitionInitiated = false;

  answerRef: DocumentReference = null;

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
    this.answerForm = new FormGroup({
      answer: new FormControl('', Validators.required)
    });
  }

  async postAnswer(){

    this.isSubmitionInitiated = true;
    if (this.answerForm.invalid) return;

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
    this.answerForm.disable();

    const newAnswer: Answer = {
      answer: this.answerForm.get('answer').value,

      areaId: this.areaId,
      communityId: this.communityId,
      questionId: this.questionId,

      uid: this.authService.user$.value.uid,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude
    };
    try{
      this.answerRef = await this.queAnsService.postAnswer(this.areaId, this.communityId, this.questionId, newAnswer)
      const successToast = await this.toastCtrl.create({
        message: 'Answer posted successfully',
        duration: 3000
      });
      successToast.present();
      this.closeModal();

    } catch (error){
      console.log('Error while posting answer', error);
      const errorToast = await this.toastCtrl.create({
        message: 'There was some error while posting your answer',
        duration: 3000
      });
      errorToast.present();
      this.closeModal();
    }
  }

  closeModal(){
    this.modalCtrl.dismiss({
      answerRef: this.answerRef
    });
  }

}
