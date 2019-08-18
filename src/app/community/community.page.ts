import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-community',
  templateUrl: './community.page.html',
  styleUrls: ['./community.page.scss'],
})
export class CommunityPage implements OnInit {

  constructor(
    private activatedRoute: ActivatedRoute
  ) {
    // activatedRoute.params.subscribe(params => {
    //   console.log('CommunityPage', params);
    // });
  }

  ngOnInit() {
  }

}
