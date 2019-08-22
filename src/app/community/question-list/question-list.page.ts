import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ModalController, ToastController } from '@ionic/angular';

import { take } from 'rxjs/operators';

import { AccountService } from 'src/app/services/account.service';
import { CommunityService } from 'src/app/services/community.service';
import { QueAnsService } from 'src/app/services/que-ans.service';
import { Community } from 'src/app/models/community.model';
import { Question } from 'src/app/models/question.model';
import { QueryConfig } from 'src/app/models/query-config.model';

import { QuestionFormPage } from '../question-form/question-form.page';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-question-list',
  templateUrl: './question-list.page.html',
  styleUrls: ['./question-list.page.scss'],
})
export class QuestionListPage implements OnInit {

  areaId: string;
  communityId: string;
  communityDetails: Community;

  initialLoadFinised = false;

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,

    private authService: AuthService,
    private accountService: AccountService,
    private communityService: CommunityService,
    private queAnsService: QueAnsService
  ) {
    const urlParts = this.router.url.split('/')
    this.areaId = urlParts[3];
    this.communityId = urlParts[4];
  }

  ngOnInit() {
    this.loadCommunityDetails();

    this.initQueryConfig();
    this.loadQuestions();
  }

  async loadCommunityDetails(){
    const communities = await this.communityService.getCommunityFields(this.areaId, this.communityId, ['name']);
    this.communityDetails = communities[0];
  }

  ionViewWillEnter(){
    const startIndex = this.router.url.indexOf('?');
    if (startIndex != -1){
      const queryParams = this.router.url.substring(startIndex + 1);
      const params = queryParams.split('&');
      if (params.length > 0 && params[0].split('=')[0] === 'updatedQuestion'){
        this.initQueryConfig();
        this.loadQuestions();
      }
    }
  }

  questions: Question[] = [];
  queryConfig: QueryConfig;

  initQueryConfig(){
    this.initialLoadFinised = false;
    this.questions = [];
    this.queryConfig = {
      fields: [
        { fieldName: 'timestamp', order: 'desc' }
      ],
      limit: 2,
      after: []
    };
  }

  loadQuestions($event?){
    this.queAnsService.list(this.areaId, this.communityId, this.queryConfig)
      .pipe(take(1))
      .subscribe(questions => {
        this.questions = this.questions.concat(questions);

        if ($event){
          $event.target.complete();
          if (questions.length < this.queryConfig.limit)
            $event.target.disabled = true;
        }

        this.initialLoadFinised = true;
        this.questions.forEach(async discussion => {
          const users = await this.accountService.getUserFields(['uid', 'displayName', 'email', 'photoURL'], discussion.uid);
          discussion.user = users[0];
        })
      });
  }

  loadNextPage($event){
    if (this.questions.length <= 0) return;

    try{
      const lastQuestion = this.questions[this.questions.length - 1];
      this.queryConfig.after = [lastQuestion.timestamp];
    } catch (error){
      $event.target.complete();
    }
    this.loadQuestions($event);
  }

  async openNewQuestionForm(){
    const newQuestionModal = await this.modalCtrl.create({
      component: QuestionFormPage,
      componentProps: {
        areaId: this.areaId,
        communityId: this.communityId
      }
    });
    newQuestionModal.present();
    newQuestionModal.onDidDismiss().then(returnValue => {
      if (returnValue.data.questionRef && returnValue.data.questionRef.id){
        //reload questions list or add it to the start
        this.initQueryConfig();
        this.loadQuestions();
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
}
