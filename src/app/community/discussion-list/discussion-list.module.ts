import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { DiscussionListPage } from './discussion-list.page';
import { DiscussionFormPage } from '../discussion-form/discussion-form.page';
import { DiscussionFormPageModule } from '../discussion-form/discussion-form.module';

const routes: Routes = [
  {
    path: '',
    component: DiscussionListPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    DiscussionListPage,
    DiscussionFormPage
  ],
  entryComponents: [ 
    DiscussionFormPage
  ]
})
export class DiscussionListPageModule {}
