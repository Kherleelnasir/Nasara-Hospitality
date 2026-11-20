
import { Routes } from '@angular/router';

import { Login } from './admin/login/login';
import { Layout } from './admin/layout/layout';
import { Dashboard } from './admin/dashboard/dashboard';
import { Services } from './admin/services/services';
import { Reviews } from './admin/reviews/reviews';
import { Messages } from './admin/messages/messages';
import { BusinessInformation } from './admin/business-information/business-information';
import { AdminProfile } from './admin/admin-profile/admin-profile';
import { ManageTeam } from './admin/manage-team/manage-team';

import { Home } from './public/home/home';

import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [

  // =========================
  // PUBLIC HOME PAGE
  // =========================
  {
    path: '',
    component: Home
  },

  // =========================
  // ADMIN LOGIN
  // =========================
  {
    path: 'admin/login',
    component: Login
  },

  // =========================
  // ADMIN PANEL
  // =========================
  {
    path: 'admin',
    component: Layout,
    canActivate: [authGuard],

    children: [

      // Dashboard
      {
        path: 'dashboard',
        component: Dashboard
      },

      // Services
      {
        path: 'services',
        component: Services
      },

      // Reviews
      {
        path: 'reviews',
        component: Reviews
      },

      // Messages
      {
        path: 'messages',
        component: Messages
      },

      // Business Information
      {
        path: 'business-information',
        component: BusinessInformation
      },

      // Manage Our Team
      {
        path: 'manage-team',
        component: ManageTeam
      },

      // Admin Profile
      {
        path: 'admin-profile',
        component: AdminProfile
      }

    ]
  },

  // =========================
  // UNKNOWN PAGE
  // =========================
  {
    path: '**',
    redirectTo: ''
  }

];
