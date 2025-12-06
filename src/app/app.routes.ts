import { Routes } from '@angular/router';
import { HomepageComponent } from './homepage/homepage';
import { AboutComponent } from './about/about';
import { PortfolioComponent } from './portfolio/portfolio';

export const routes: Routes = [
    { path: '', redirectTo: 'homepage', pathMatch: 'full' },
    { path: 'homepage', component: HomepageComponent },
    { path: 'about', component: AboutComponent },
    { path: 'portfolio', component: PortfolioComponent }
];
