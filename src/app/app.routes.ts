import { Routes } from '@angular/router';
import { HomepageComponent } from './homepage/homepage';
import { AboutComponent } from './about/about';
import { PortfolioComponent } from './portfolio/portfolio';
import { LoginComponent } from './login/login';
import { AccountComponent } from './account/account';
import { AdminComponent } from './admin/admin';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'homepage', pathMatch: 'full' },
    { path: 'homepage', component: HomepageComponent, title: 'Xevenst — Software Development Engineer' },
    { path: 'about', component: AboutComponent, title: 'About — Xevenst' },
    { path: 'portfolio', component: PortfolioComponent, title: 'Portfolio — Xevenst' },
    { path: 'login', component: LoginComponent, title: 'Sign in — Xevenst' },
    { path: 'account', component: AccountComponent, canActivate: [authGuard], title: 'Account — Xevenst' },
    { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard], title: 'Admin — Xevenst' },
    { path: '**', redirectTo: 'homepage' },
];
