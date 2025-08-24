import { Routes } from '@angular/router';
import { SetupPageComponent } from './components/setup/setup-page.component';
import { BucketPageComponent } from './components/bucket/bucket-page.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/bucket',
    pathMatch: 'full'
  },
  {
    path: 'setup',
    component: SetupPageComponent,
    title: 'Storage Setup'
  },
  {
    path: 'bucket',
    component: BucketPageComponent,
    title: 'Storage Bucket'
  },
  {
    path: '**',
    redirectTo: '/bucket'
  }
];