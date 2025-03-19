import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { LastAddedIssuesService } from '../../core/services/last-added-issues.service';
import { Edicao } from '../../shared/models/edicao';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SearchParams } from '../../shared/models/searchParams';
import { SerieService } from '../../core/services/serie.service';
import { Serie } from '../../shared/models/serie';
import { Router } from '@angular/router';

import { CommonModule, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  CarouselComponent,
  CarouselControlComponent,
  CarouselIndicatorsComponent,
  CarouselInnerComponent,
  CarouselItemComponent,
  ThemeDirective
} from '@coreui/angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    CommonModule,
    // ThemeDirective,
    // CarouselComponent,
    // CarouselIndicatorsComponent,
    // CarouselInnerComponent,
    // NgFor,
    // CarouselItemComponent,
    // CarouselControlComponent,
    // RouterLink
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent implements OnInit {
  private lastAddedIssuesService = inject(LastAddedIssuesService);
  private router = inject(Router);
  title = 'home';
  lastAddedIssues: Edicao[] = [];
  searchParams = new SearchParams();

  // slides: any[] = new Array(3).fill({ id: -1, src: '', title: '', subtitle: '' });

  ngOnInit(): void {
    this.lastAddedIssuesService.getLastAddedIssues().subscribe({
      next: (response) => {
        this.lastAddedIssues = response.data;
        console.log(response.data)
      }
      ,
      error: (error) => 
        console.log(error)
    });

    // this.slides[0] = {
    //   src: `/Immortal_Thor_Vol_1/Immortal_Thor_Vol_1_14/Immortal_Thor_Vol_1_14.jpg`
    // };
    // this.slides[1] = {
    //         src: `/Immortal_Thor_Vol_1/Immortal_Thor_Vol_1_13/Immortal_Thor_Vol_1_13.jpg`

    // };
    // this.slides[2] = {
    //         src: `/Immortal_Thor_Vol_1/Immortal_Thor_Vol_1_12/Immortal_Thor_Vol_1_12.jpg`

    // };
    // this.slides[3] = {
    //         src: `/Immortal_Thor_Vol_1/Immortal_Thor_Vol_1_11/Immortal_Thor_Vol_1_11.jpg`

    // };
    // this.slides[4] = {
    //         src: `/Immortal_Thor_Vol_1/Immortal_Thor_Vol_1_10/Immortal_Thor_Vol_1_10.jpg`

    // };

    // console.log(this.slides);
  }



  onSearchChange() {
    // Only search if the search string has actual content
    if (this.isValidSearch(this.searchParams.search)) {
      this.router.navigate(['/search'], { 
        queryParams: { 
          search: this.searchParams.search,
          type: this.searchParams.type
        } 
      });
    }
  }

  // Add method to check if search string is valid (not empty or just spaces)
  isValidSearch(searchString: string | undefined): boolean {
    return !!searchString && searchString.trim().length > 0;
  }

}
