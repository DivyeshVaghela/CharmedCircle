import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { CommunityPage } from './community.page';

const routes: Routes = [
  {
    path: '',
    component: CommunityPage,
    children: [
      {
        path: 'post-list',
        loadChildren: () => import('./post-list/post-list.module').then(m => m.PostListPageModule),
      },
      { 
        path: 'question-list', 
        loadChildren: () => import('./question-list/question-list.module').then(m => m.QuestionListPageModule)
      },
      { 
        path: 'discussion-list', 
        loadChildren: () => import('./discussion-list/discussion-list.module').then(m => m.DiscussionListPageModule)
      },
      {
        path: 'post-list/:postId',
        loadChildren: () => import('./post-details/post-details.module').then(m => m.PostDetailsPageModule)
      },
      {
        path: '',
        redirectTo: 'post-list',
        pathMatch: 'full'
      }
    ]
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [CommunityPage]
})
export class CommunityPageModule {}
