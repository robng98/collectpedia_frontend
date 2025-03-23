import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { SearchResultsComponent } from './features/search-results/search-results.component';
import { SerieComponent } from './features/serie/serie.component';
import { LoginComponent } from './features/account/login/login.component';
import { RegisterComponent } from './features/account/register/register.component';
import { UserPageComponent } from './features/user-page/user-page.component';
import { RegisterIssuesComponent } from './features/register-issues/register-issues.component';
import { ComicsMangaPageComponent } from './features/summary-page/comics-manga-page/comics-manga-page.component';
import { PublisherPageComponent } from './features/summary-page/publisher-page/publisher-page.component';
import { PublisherDetailComponent } from './features/summary-page/publisher-detail/publisher-detail.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'search', component: SearchResultsComponent },
    { path: 'account/login', component: LoginComponent },
    { path: 'account/register', component: RegisterComponent },
    { path: 'serie/:serieId', component: SerieComponent },
    { path: 'user', component: UserPageComponent },
    {
        path: 'register-issues',
        component: RegisterIssuesComponent,
        canActivate: [authGuard]
    },
    { path: "summary/series/:type", component: ComicsMangaPageComponent },
    { path: "summary/publishers", component: PublisherPageComponent },
    { path: "summary/publishers/:id", component: PublisherDetailComponent }, // Update to use the new component
    { path: '**', redirectTo: '', pathMatch: 'full' },
];
