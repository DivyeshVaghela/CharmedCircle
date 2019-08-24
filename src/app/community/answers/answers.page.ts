import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';

import { take } from 'rxjs/operators';

import { AuthService } from 'src/app/services/auth.service';
import { AccountService } from 'src/app/services/account.service';
import { CommunityService } from 'src/app/services/community.service';
import { LocationService } from 'src/app/services/location.service';
import { QueAnsService } from 'src/app/services/que-ans.service';
import { UtilService } from 'src/app/services/util.service';
import { CommunityArea } from 'src/app/models/community-area.model';
import { Question } from 'src/app/models/question.model';
import { Answer } from 'src/app/models/answer.model';

import { AnswerFormPage } from '../answer-form/answer-form.page';

@Component({
  selector: 'app-answers',
  templateUrl: './answers.page.html',
  styleUrls: ['./answers.page.scss'],
})
export class AnswersPage implements OnInit {

  areaId: string;
  communityId: string;
  questionId: string;

  question: Question;
  communityArea: CommunityArea;
  communityDetails: any;

  answers: Answer[] = [];
  initialLoadFinished = false;

  updatedQuestion = null;

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,

    private authService: AuthService,
    private accountService: AccountService,
    private locationService: LocationService,
    private communityService: CommunityService,
    private queAnsService: QueAnsService,
    private utilService: UtilService
  ) {
    const urlParts = this.router.url.split('/')
    this.areaId = urlParts[3];
    this.communityId = urlParts[4];
    this.questionId = urlParts[6];
  }

  ngOnInit() {
    this.loadCommunity();
    this.loadQuestion();
    this.loadAnswers();
  }

  loadQuestion(){
    this.queAnsService.details(this.areaId, this.communityId, this.questionId)
      .pipe(take(1))
      .subscribe(question => {
        this.question = question;
        question.questionId = this.questionId;
        this.loadUserInfo(question.uid, question);
      });
  }

  async loadCommunity(){
    this.locationService.getCommunityArea(this.areaId)
      .pipe(take(1))
      .subscribe(area => this.communityArea = area);

    const communities = await this.communityService.getCommunityFields(this.areaId, this.communityId, ['name', 'subtitle', 'isPending']);
    this.communityDetails = communities[0];
  }

  loadAnswers(){
    this.queAnsService.listAnswers(this.areaId, this.communityId, this.questionId)
      .pipe(take(1))
      .subscribe(answers => {
        this.answers = answers;
        this.initialLoadFinished = true;
        answers.forEach(answer => this.loadUserInfo(answer.uid, answer));
      });
  }

  async loadUserInfo(uid: string, attachTo: any){
    const users = await this.accountService.getUserFields(['uid', 'displayName', 'email', 'photoURL'], uid);
    if (users && users.length > 0)
      attachTo.user = users[0];
  }

  isMyQuestion(): boolean{
    if (!this.authService.isAuthenticated()) return false;
    return this.question.uid === this.authService.user$.value.uid;
  }

  async acceptAnswer(answer: Answer){
    const authCheck = await this.utilService.checkAuthentication();
    if (!authCheck) return;

    if (this.communityDetails.isPending){
      this.utilService.alertPendingCommunity();
      return;
    }

    this.queAnsService.acceptAnswer(this.areaId, this.communityId, this.questionId, answer.answerId)
      .then(() => {
        answer.isAccepted = true;

        this.updatedQuestion = this.questionId;
      });
  }

  async openAnswerForm(){
    const authCheck = await this.utilService.checkAuthentication();
    if (!authCheck) return;

    const localityCheck = await this.utilService.checkLocality(this.areaId);
    if (!localityCheck) return;
    
    const membershipCheck = await this.utilService.checkMemberOfCommunity(this.areaId, this.communityId);
    if (!membershipCheck) return;

    if (this.communityDetails.isPending){
      this.utilService.alertPendingCommunity();
      return;
    }

    const newAnswerModal = await this.modalCtrl.create({
      component: AnswerFormPage,
      componentProps: {
        areaId: this.areaId,
        communityId: this.communityId,
        questionId: this.questionId,
        question: this.question.question
      }
    });
    newAnswerModal.present();
    newAnswerModal.onDidDismiss().then(async returnValue => {
      if (returnValue.data.answerRef && returnValue.data.answerRef.id){
        this.queAnsService.answerDetails(this.areaId, this.communityId, this.questionId, returnValue.data.answerRef.id)
          .pipe(take(1))
          .subscribe(answer => {
            this.answers.push(answer);
            this.loadUserInfo(answer.uid, answer);

            this.updatedQuestion = this.questionId;
          })
      }
    });
  }

  /**
   * Question voting
   */
  canVoteQuestion(question: Question): boolean {

    const canVote = this.queAnsService.canVoteQuestion(question);
    if (canVote.result) return true;

    switch(canVote.reason){
      case 'Not a member':
        this.utilService.alertNotMember(this.areaId, this.communityId);
        break;
        
      case 'Already voted':
        this.utilService.showToast('You already voted this question');
        break;

      case 'Own question':
        this.utilService.showToast(`You can't vote your own question`);
        break;

      default: 
        if (this.communityDetails.isPending)
          this.utilService.alertPendingCommunity();
        break;
    }
    return false;
  }

  async questionVoteUp(question: Question){
    const authCheck = await this.utilService.checkAuthentication();
    if (!authCheck) return;

    const canVote = await this.canVoteQuestion(question);
    if (!canVote)
      return;

    this.queAnsService.questionVoteUp(question)
      .then(() => {
        question.voteUpCount++;
        question.voteUpUids.push(this.authService.user$.value.uid);
      });
  }

  async questionVoteDown(question: Question){
    const authCheck = await this.utilService.checkAuthentication();
    if (!authCheck) return;

    const canVote = await this.canVoteQuestion(question);
    if (!canVote)
      return;

    this.queAnsService.questionVoteDown(question)
      .then(() => {
        question.voteDownCount++;
        question.voteDownUids.push(this.authService.user$.value.uid);
      });
  }

  /**
   * Answer voting
   */

  canVoteAnswer(answer: Answer): boolean{

    const canVote = this.queAnsService.canVoteAnswer(answer);
    if (canVote.result) return true;

    switch(canVote.reason){
      case 'Not a member':
        this.utilService.alertNotMember(this.areaId, this.communityId);
        break;
        
      case 'Already voted':
        this.utilService.showToast('You already voted this answer');
        break;

      case 'Own answer':
        this.utilService.showToast(`You can't vote your own answer`);
        break;

      default: 
        if (this.communityDetails.isPending)
          this.utilService.alertPendingCommunity();
        break;
    }
    return false;

  }

  getAnsVoteGuideText(answer: Answer){
    if (!this.authService.isAuthenticated()) return null;
    if (answer.uid === this.authService.user$.value.uid)
      return `You can't vote your own answer`;
    if (answer.voteUpUids.indexOf(this.authService.user$.value.uid) != -1 || answer.voteDownUids.indexOf(this.authService.user$.value.uid) != -1)
      return 'You already voted this answer';
    return null;
  }

  async answerVoteUp(answer: Answer){
    const authCheck = await this.utilService.checkAuthentication();
    if (!authCheck) return;

    const canVote = await this.canVoteAnswer(answer);
    if (!canVote)
      return;

    this.queAnsService.answerVoteUp(answer)
      .then(() => {
        answer.voteUpCount++;
        answer.voteUpUids.push(this.authService.user$.value.uid);
        
        this.updatedQuestion = this.questionId;
      });
  }

  async answerVoteDown(answer: Answer){
    const authCheck = await this.utilService.checkAuthentication();
    if (!authCheck) return;

    const canVote = await this.canVoteAnswer(answer);
    if (!canVote)
      return;

    this.queAnsService.answerVoteDown(answer)
      .then(() => {
        answer.voteDownCount++;
        answer.voteDownUids.push(this.authService.user$.value.uid);
        
        this.updatedQuestion = this.questionId;
      });
  }

}
