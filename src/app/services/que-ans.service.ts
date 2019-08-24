import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference, CollectionReference, Query } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { firestore } from 'firebase/app';
import { Question } from '../models/question.model';
import { QueryConfig } from '../models/query-config.model';
import { Observable } from 'rxjs';
import { Answer } from '../models/answer.model';
import { AuthService } from './auth.service';
import { LocationService } from './location.service';
import { CommunityService } from './community.service';

@Injectable({
  providedIn: 'root'
})
export class QueAnsService {

  constructor(
    private afStore: AngularFirestore,

    private authService: AuthService,
    private locationService: LocationService,
    private communityService: CommunityService
  ) { }

  list(areaId: string, communityId: string, queryConfig?: QueryConfig): Observable<Question[]>{
    const questionColRef =  this.afStore.collection<Question>(
      `/communityAreas/${areaId}/communities/${communityId}/questions`,
      ref => {
        if (!queryConfig){
          queryConfig = { 
            fields: [ 
              { fieldName: 'timestamp', order: 'desc' }
            ],
            limit: 20
          };
        }
        let query: CollectionReference | Query = ref;
        queryConfig.fields.forEach(field => {
          query = query.orderBy(field.fieldName, field.order);
        });
        if (queryConfig.after.length > 0)
          query = query.startAfter(...queryConfig.after);
        query = query.limit(queryConfig.limit);

        return query;
      });
    return questionColRef.valueChanges({ idField: 'questionId' });
  }

  create(newQuestion: Question): Promise<DocumentReference>{

    if (!newQuestion.timestamp)
      newQuestion.timestamp = Date.now();
    newQuestion.voteUpCount = 0;
    newQuestion.voteUpUids = [];
    newQuestion.voteDownCount = 0;
    newQuestion.voteDownUids = [];

    const questionColRef = this.afStore.collection(`/communityAreas/${newQuestion.areaId}/communities/${newQuestion.communityId}/questions`);
    return questionColRef.add(newQuestion);
  }

  details(areaId: string, communityId: string, questionId: string): Observable<Question>{
    const questionDocRef = this.afStore.doc<Question>(
      `/communityAreas/${areaId}/communities/${communityId}/questions/${questionId}`);
    return questionDocRef.valueChanges();
  }


  listAnswers(areaId: string, communityId: string, questionId: string): Observable<Answer[]>{
    const answerColRef = this.afStore.collection<Answer>(
      `/communityAreas/${areaId}/communities/${communityId}/questions/${questionId}/answers`,
      ref => {
        return ref.orderBy('isAccepted', 'desc').orderBy('timestamp', 'asc')
      });
    return answerColRef.valueChanges({ idField: 'answerId' });
  }

  postAnswer(areaId: string, communityId: string, questionId: string, answer: Answer): Promise<DocumentReference>{
    if (!answer.timestamp)
      answer.timestamp = Date.now();
    answer.voteUpCount = 0;
    answer.voteUpUids = [];
    answer.voteDownCount = 0;
    answer.voteDownUids = [];
    answer.isAccepted = false;

    const answerColRef = this.afStore.collection(
      `/communityAreas/${areaId}/communities/${communityId}/questions/${questionId}/answers`);
    return answerColRef.add(answer);
  }

  answerDetails(areaId: string, communityId: string, questionId: string, answerId: string): Observable<Answer>{
    const answerDocRef = this.afStore.doc<Answer>(
      `/communityAreas/${areaId}/communities/${communityId}/questions/${questionId}/answers/${answerId}`);
    return answerDocRef.valueChanges();
  }

  acceptAnswer(areaId: string, communityId: string, questionId: string, answerId: string): Promise<void>{
    const answerDocRef = this.afStore.doc<Answer>(
      `/communityAreas/${areaId}/communities/${communityId}/questions/${questionId}/answers/${answerId}`);
    return answerDocRef.update({ 
      isAccepted: true,
      acceptedTimestamp: Date.now()
    });
  }

  /**
   * Question voting
   */
  questionAlreadyVotedUp(question: Question): boolean{
    if (!this.authService.isAuthenticated()) return false;

    const uid = this.authService.user$.value.uid;
    return (question.uid === uid || question.voteUpUids.indexOf(uid) != -1);
  }

  questionAlreadyVotedDown(question: Question): boolean{
    if (!this.authService.isAuthenticated()) return false;

    const uid = this.authService.user$.value.uid;
    return (question.uid === uid || question.voteDownUids.indexOf(uid) != -1);
  }

  canVoteQuestion(question: Question): {result: boolean, reason?: string}{
    if (!this.authService.isAuthenticated()) return {result:false, reason:'Not authenticated'};

    if (!this.communityService.isMember(question.areaId, question.communityId)) return {result: false, reason: 'Not a member'};

    if (this.authService.user$.value.uid === question.uid) return {result: false, reason: 'Own question'}

    if (!(this.questionAlreadyVotedUp(question) || this.questionAlreadyVotedDown(question))){
      return {result: true}
    } else {
      return {result:false, reason:'Already voted'};
    }
  }

  questionVoteUp(question: Question): Promise<void>{
    const questionDocRef = this.afStore.doc(
      `/communityAreas/${question.areaId}/communities/${question.communityId}/questions/${question.questionId}`);
    return questionDocRef.update({ 
      voteUpCount: firestore.FieldValue.increment(1),
      voteUpUids: firestore.FieldValue.arrayUnion(this.authService.user$.value.uid)
    });    
  }

  questionVoteDown(question: Question): Promise<void>{
    const questionDocRef = this.afStore.doc(
      `/communityAreas/${question.areaId}/communities/${question.communityId}/questions/${question.questionId}`);
    return questionDocRef.update({ 
      voteDownCount: firestore.FieldValue.increment(1),
      voteDownUids: firestore.FieldValue.arrayUnion(this.authService.user$.value.uid)
    });
  }

  /**
   * Answer voting
   */

  answerAlreadyVotedUp(answer: Answer): boolean{
    if (!this.authService.isAuthenticated()) return false;

    const uid = this.authService.user$.value.uid;
    return (answer.uid === uid || answer.voteUpUids.indexOf(uid) != -1);
  }

  answerAlreadyVotedDown(answer: Answer): boolean{
    if (!this.authService.isAuthenticated()) return false;

    const uid = this.authService.user$.value.uid;
    return (answer.uid === uid || answer.voteDownUids.indexOf(uid) != -1);
  }

  canVoteAnswer(answer: Answer): {result: boolean, reason?: string}{
    if (!this.authService.isAuthenticated()) return {result:false, reason:'Not authenticated'};

    if (!this.communityService.isMember(answer.areaId, answer.communityId)) return {result: false, reason: 'Not a member'};

    if (this.authService.user$.value.uid === answer.uid) return {result: false, reason: 'Own answer'}

    if (!(this.answerAlreadyVotedUp(answer) || this.answerAlreadyVotedDown(answer))){
      return {result: true}
    } else {
      return {result:false, reason:'Already voted'};
    }
  }

  answerVoteUp(answer: Answer): Promise<void>{
    const answerDocRef = this.afStore.doc(
      `/communityAreas/${answer.areaId}/communities/${answer.communityId}/questions/${answer.questionId}/answers/${answer.answerId}`);
    return answerDocRef.update({ 
      voteUpCount: firestore.FieldValue.increment(1),
      voteUpUids: firestore.FieldValue.arrayUnion(this.authService.user$.value.uid)
    });    
  }

  answerVoteDown(answer: Answer): Promise<void>{
    const answerDocRef = this.afStore.doc(
      `/communityAreas/${answer.areaId}/communities/${answer.communityId}/questions/${answer.questionId}/answers/${answer.answerId}`);
    return answerDocRef.update({ 
      voteDownCount: firestore.FieldValue.increment(1),
      voteDownUids: firestore.FieldValue.arrayUnion(this.authService.user$.value.uid)
    });
  }

}
