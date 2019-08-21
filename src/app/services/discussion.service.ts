import { Injectable } from '@angular/core';

import { AngularFirestore, DocumentReference, AngularFirestoreCollection, CollectionReference, Query } from '@angular/fire/firestore';

import { Observable } from 'rxjs';

import { Discussion } from '../models/discussion.model';
import { DiscussionMessage } from '../models/discussion-message.model';
import { QueryConfig } from '../models/query-config.model';

@Injectable({
  providedIn: 'root'
})
export class DiscussionService {

  constructor(
    private afStore: AngularFirestore
  ) { }

  list(areaId: string, communityId: string, queryConfig?: QueryConfig): Observable<Discussion[]>{
    const discussionColRef = this.afStore.collection<Discussion>(
      `/communityAreas/${areaId}/communities/${communityId}/discussions`,
      ref => {
        if (!queryConfig){
          queryConfig = { 
            fields: [ 
              { fieldName: 'isActive', order: 'desc' },
              { fieldName: 'startTimestamp', order: 'desc' }
            ],
            limit: 20
          };
        }
        let query: CollectionReference | Query = ref;
        queryConfig.fields.forEach(field => {
          query = query.orderBy(field.fieldName, field.order);
        });
        // if (!(queryConfig.after.length == 2 && queryConfig.after[0] == null && queryConfig.after[1] == null))
        //   query = query.startAfter(queryConfig.after[0], queryConfig.after[1]);
        if (queryConfig.after.length > 0)
          query = query.startAfter(...queryConfig.after);
        query = query.limit(queryConfig.limit);
        return query;
      });
    return discussionColRef.valueChanges({ idField: 'discussionId' });
  }

  create(newDiscussion: Discussion): Promise<DocumentReference>{

    if (!newDiscussion.startTimestamp)
      newDiscussion.startTimestamp = Date.now();
    newDiscussion.isActive = true;

    const discussionColRef = this.afStore.collection(`/communityAreas/${newDiscussion.areaId}/communities/${newDiscussion.communityId}/discussions`);
    return discussionColRef.add(newDiscussion);
  }

  details(areaId: string, communityId: string, discussionId: string): Observable<Discussion>{
    const discussionDocRef = this.afStore.doc<Discussion>(`/communityAreas/${areaId}/communities/${communityId}/discussions/${discussionId}`);
    return discussionDocRef.valueChanges();
  }

  closeDiscussion(areaId: string, communityId: string, discussionId: string, closingInfo: {aimAchieved: boolean, acknowledgement: string, closedByUid: string}): Promise<void>{
    console.log('Within service', areaId, communityId, discussionId, closingInfo);
    const discussionDocRef = this.afStore.doc<Discussion>(`/communityAreas/${areaId}/communities/${communityId}/discussions/${discussionId}`);
    return discussionDocRef.update({
      isActive: false,
      aimAchieved: closingInfo.aimAchieved,
      acknowledgement: closingInfo.acknowledgement,
      closeTimestamp: Date.now(),
      closedByUid: closingInfo.closedByUid
    });
  }

  getConversation(areaId: string, communityId: string, discussionId: string): AngularFirestoreCollection<DiscussionMessage>{
    const conversactionColRef = this.afStore.collection<DiscussionMessage>(`/communityAreas/${areaId}/communities/${communityId}/discussions/${discussionId}/conversation`);
    return conversactionColRef;
  }

  sendMessage(message: DiscussionMessage): Promise<DocumentReference>{
    const conversationColRef = this.getConversation(message.areaId, message.communityId, message.discussionId);
    return conversationColRef.add(message);
  }
}
