import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { DiscussionDetailsPage } from './discussion-details.page';
import { CloseDiscussionFormPage } from '../close-discussion-form/close-discussion-form.page';

const routes: Routes = [
  {
    path: '',
    component: DiscussionDetailsPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    DiscussionDetailsPage,
    CloseDiscussionFormPage
  ],
  entryComponents: [
    CloseDiscussionFormPage
  ]
})
export class DiscussionDetailsPageModule {}
