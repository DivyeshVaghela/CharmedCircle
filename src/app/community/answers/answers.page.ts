import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QueAnsService } from 'src/app/services/que-ans.service';
import { Question } from 'src/app/models/question.model';
import { CommunityArea } from 'src/app/models/community-area.model';
import { Answer } from 'src/app/models/answer.model';
import { take } from 'rxjs/operators';
import { CommunityService } from 'src/app/services/community.service';
import { LocationService } from 'src/app/services/location.service';
import { AccountService } from 'src/app/services/account.service';
import { ModalController, ToastController } from '@ionic/angular';
import { AnswerFormPage } from '../answer-form/answer-form.page';
import { AuthService } from 'src/app/services/auth.service';

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
  community: any;

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
    private queAnsService: QueAnsService
  ) {
    const urlParts = this.router.url.split('/')
    this.areaId = urlParts[3];
    this.communityId = urlParts[4];
    this.questionId = urlParts[6];
  }

  ngOnInit() {
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

    const communities = await this.communityService.getCommunityFields(this.areaId, this.communityId, ['name', 'subtitle']);
    this.community = communities[0];
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

  acceptAnswer(answer: Answer){
    this.queAnsService.acceptAnswer(this.areaId, this.communityId, this.questionId, answer.answerId)
      .then(() => {
        answer.isAccepted = true;

        this.updatedQuestion = this.questionId;
      });
  }

  async openAnswerForm(){
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
  getQueVoteGuideText(question: Question){
    if (!this.authService.isAuthenticated()) return null;
    if (question.uid === this.authService.user$.value.uid)
      return `You can't vote your own question`;
    if (question.voteUpUids.indexOf(this.authService.user$.value.uid) != -1 || question.voteDownUids.indexOf(this.authService.user$.value.uid) != -1)
      return 'You already voted this question';
    return null;
  }

  async questionVoteUp(question: Question){

    const voteGuideText = this.getQueVoteGuideText(question);
    if (voteGuideText !== null){
      const toast = await this.toastCtrl.create({
        message: voteGuideText,
        duration: 3000
      });
      toast.present();
    }

    if (!this.queAnsService.canVoteQuestion(question).result) return;

    this.queAnsService.questionVoteUp(question)
      .then(() => {
        question.voteUpCount++;
        question.voteUpUids.push(this.authService.user$.value.uid);
      });
  }

  async questionVoteDown(question: Question){

    const voteGuideText = this.getQueVoteGuideText(question);
    if (voteGuideText !== null){
      const toast = await this.toastCtrl.create({
        message: voteGuideText,
        duration: 3000
      });
      toast.present();
    }

    if (!this.queAnsService.canVoteQuestion(question).result) return;

    this.queAnsService.questionVoteDown(question)
      .then(() => {
        question.voteDownCount++;
        question.voteDownUids.push(this.authService.user$.value.uid);
      });
  }

  /**
   * Answer voting
   */

  getAnsVoteGuideText(answer: Answer){
    if (!this.authService.isAuthenticated()) return null;
    if (answer.uid === this.authService.user$.value.uid)
      return `You can't vote your own answer`;
    if (answer.voteUpUids.indexOf(this.authService.user$.value.uid) != -1 || answer.voteDownUids.indexOf(this.authService.user$.value.uid) != -1)
      return 'You already voted this answer';
    return null;
  }

  async answerVoteUp(answer: Answer){

    const voteGuideText = this.getAnsVoteGuideText(answer);
    if (voteGuideText !== null){
      const toast = await this.toastCtrl.create({
        message: voteGuideText,
        duration: 3000
      });
      toast.present();
    }

    if (!this.queAnsService.canVoteAnswer(answer).result) return;

    this.queAnsService.answerVoteUp(answer)
      .then(() => {
        answer.voteUpCount++;
        answer.voteUpUids.push(this.authService.user$.value.uid);
        
        this.updatedQuestion = this.questionId;
      });
  }

  async answerVoteDown(answer: Answer){

    const voteGuideText = this.getAnsVoteGuideText(answer);
    if (voteGuideText !== null){
      const toast = await this.toastCtrl.create({
        message: voteGuideText,
        duration: 3000
      });
      toast.present();
    }

    if (!this.queAnsService.canVoteAnswer(answer).result) return;

    this.queAnsService.answerVoteDown(answer)
      .then(() => {
        answer.voteDownCount++;
        answer.voteDownUids.push(this.authService.user$.value.uid);
        
        this.updatedQuestion = this.questionId;
      });
  }

}
