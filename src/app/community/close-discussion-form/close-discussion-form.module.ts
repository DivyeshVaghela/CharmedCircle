import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { CloseDiscussionFormPage } from './close-discussion-form.page';

const routes: Routes = [
  {
    path: '',
    component: CloseDiscussionFormPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [CloseDiscussionFormPage]
})
export class CloseDiscussionFormPageModule {}
