import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscussionFormPage } from './discussion-form.page';

describe('DiscussionFormPage', () => {
  let component: DiscussionFormPage;
  let fixture: ComponentFixture<DiscussionFormPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiscussionFormPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscussionFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
