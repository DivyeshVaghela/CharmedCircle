import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

// export const helloWorld = functions.https.onRequest((request, response) => {
//   console.log('Hello World of Firebase functions.');
//   response.send("Hello from Firebase functions!");
// });


/**
 * communities function
 */
export const communityMembersUpdated = functions.firestore
  .document('/communityAreas/{areaId}/communities/{communityId}')
  .onUpdate((change, context) => {

    const afterData = change.after.data();
    if (!afterData || afterData.members.length === afterData.membersCount) return null;

    return change.after.ref.update({
      membersCount: afterData.members.length,
      isPending: afterData.members.length < 3
    });
    
    // const beforeData = change.before.data();
    // if (!beforeData) return null;

    // const beforeMembers = <string[]>beforeData.members;
    // const afterMembers = <string[]>afterData.members;

    // const addedMembers = afterMembers.filter((memberId) => {
    //   if (beforeMembers.indexOf(memberId) === -1)
    //     return memberId;
    //   else
    //     return false;
    // });

    // let removedMembers: string[] = [];
    // if (addedMembers.length === 0){
    //   removedMembers = beforeMembers.filter((memberId) => {
    //     if (afterMembers.indexOf(memberId) === -1)
    //       return memberId;
    //     return false;
    //   });
    // }

    // return admin.firestore().runTransaction(async (transaction) => {

    //   if (addedMembers.length > 0){
    //     const userDocRef = admin.firestore().doc(`/users/${addedMembers[0]}`)
    //     await transaction.set(userDocRef, {
    //         joinedCommunities: admin.firestore.FieldValue.arrayUnion({
    //           areaId: afterData.areaId,
    //           communityId: afterData.communityId,
    //           communityName: afterData.name,
    //           timestamp: Date.now()
    //         })
    //       }, { merge: true });
    //   } else if (removedMembers.length > 0){
    //     const userDocRef = admin.firestore().doc(`/users/${removedMembers[0]}`)
    //     const userDoc = await userDocRef.get();
    //     const userData = userDoc.data();
    //     if (!userData || userData === null) return;
    //     const leftCommunity = userData.joinedCommunities.filter((joinedCommunity: any) => {
    //       if (joinedCommunity.areaId === areaId && joinedCommunity.communityId === communityId)
    //         return joinedCommunity;
    //       return false;
    //     });
    //     await transaction.set(userDocRef, {
    //       joinedCommunities: admin.firestore.FieldValue.arrayRemove(leftCommunity)
    //     }, { merge: true });
    //   }
      
    //   const communityDocRef = admin.firestore().doc(`/communityAreas/${areaId}/communities/${communityId}`);
    //   await transaction.update(communityDocRef, {
    //       membersCount: afterData.members.length,
    //       isPending: afterData.members.length < 11
    //     });
    // });

  });
