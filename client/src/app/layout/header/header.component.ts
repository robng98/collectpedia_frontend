import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContaService } from '../../core/services/conta.service';
import { User } from '../../shared/models/user';
import { SearchParams } from '../../shared/models/searchParams';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private contaService = inject(ContaService);
  private router = inject(Router);
  searchParams = new SearchParams();
  private currentUrl: string = '';
  private previousUrl: string = ''; // Added to track previous URL
  
  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.previousUrl = this.currentUrl;
      this.currentUrl = event.url;

      console.log('Previous URL: ' + this.previousUrl);
      
      // Check if user left the search page
      if (!this.currentUrl.includes('/search')) {
        console.log('Current URL: ' + this.currentUrl);
        this.resetSearch();
      }
    });
  }
  
  get currentUser() {
    return this.contaService.currentUser();
  }

  logout() {
    this.contaService.logout();
  }

  onSearchChange() {
    // Only navigate if search text is valid
    if (this.isValidSearch(this.searchParams.search)) {
      const queryParams = { 
        search: this.searchParams.search,
        type: this.searchParams.type
      };
      
      // Check if we're already on the search page
      if (this.currentUrl.includes('/search')) {
        // Force reload by first navigating to a different route then back
        this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
          this.router.navigate(['/search'], { queryParams });
        });
      } else {
        // Normal navigation
        this.router.navigate(['/search'], { queryParams });
      }
    }
  }

  // Add method to reset search parameters
  private resetSearch(): void {
    this.searchParams = new SearchParams();
  }

  // Add method to check if search string is valid (not empty or just spaces)
  isValidSearch(searchString: string | undefined): boolean {
    return !!searchString && searchString.trim().length > 0;
  }
}
