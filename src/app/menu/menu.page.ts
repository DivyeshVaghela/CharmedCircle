import { Component, OnInit, ViewChild } from '@angular/core';
import { IonMenu } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { auth } from 'firebase';
import { Router, RouterEvent } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
})
export class MenuPage implements OnInit {

  menuItems: any[];
  selectedPath: string = '';

  @ViewChild(IonMenu, { static: true }) menu: IonMenu;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {

    this.menuItems = [
      {
        label: 'Home',
        icon: 'home',
        url: '/'
      },
      {
        label: 'Settings',
        icon: 'settings',
        url: '/settings'
      }
    ];
  }

  ngOnInit() {
    this.menu.open();

    this.router.events.subscribe((event: RouterEvent) => {
      if (event && event.url) this.selectedPath = event.url;
    });
  }

}
