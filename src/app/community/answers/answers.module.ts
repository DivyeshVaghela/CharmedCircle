import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { AnswersPage } from './answers.page';
import { AnswerFormPageModule } from '../answer-form/answer-form.module';
import { AnswerFormPage } from '../answer-form/answer-form.page';

const routes: Routes = [
  {
    path: '',
    component: AnswersPage
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
    AnswersPage,
    AnswerFormPage
  ],
  entryComponents: [
    AnswerFormPage
  ]
})
export class AnswersPageModule {}
