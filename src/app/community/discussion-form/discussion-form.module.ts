import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { DiscussionFormPage } from './discussion-form.page';

const routes: Routes = [
  {
    path: '',
    component: DiscussionFormPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [DiscussionFormPage]
})
export class DiscussionFormPageModule {}
