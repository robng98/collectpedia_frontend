import { Component, type OnInit } from "@angular/core";
import { FormBuilder, type FormGroup, Validators, FormArray, FormControl } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { CollectionService } from "../../core/services/collection.service";
import { ComicService } from "../../core/services/comic.service";
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ContaService } from "../../core/services/conta.service";

import { MatCheckboxChange } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatOptionModule } from "@angular/material/core";
import { RouterLink } from "@angular/router";
import { Edicao } from "../../shared/models/edicao";
import { MatCheckboxModule } from '@angular/material/checkbox';
import {MatTooltipModule} from '@angular/material/tooltip';
import { Collection } from "../../shared/models/colecao";
import { Pagination } from "../../shared/models/pagination";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
  selector: "app-register-issues",
  templateUrl: "./register-issues.component.html",
  styleUrls: ["./register-issues.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatButtonModule,
    MatOptionModule,
    RouterLink,
    MatCheckboxModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ]
})
export class RegisterIssuesComponent implements OnInit {
  registrationForm: FormGroup;
  batchForm: FormGroup; 
  selectedIssues: Edicao[] = [];
  collections: Collection[] = [];
  grades: string[] = [
    "GM (10.0)",
    "MT (9.9)",
    "NM/MT (9.8)",
    "NM+ (9.6)",
    "NM(9.4)",
    "NM- (9.2)",
    "VF/NM (9.0)",
    "VF+ (8.5)",
    "VF (8.0)",
    "VF- (7.5)",
    "FN/VF (7.0)",
    "FN+ (6.5)",
    "FN (6.0)",
    "FN- (5.5)",
    "VG/FN (5.0)",
    "VG+ (4.5)",
    "VG (4.0)",
    "VG- (3.5)",
    "GD/VG (3.0)",
    "GD+ (2.5)",
    "GD (2.0)",
    "GD- (1.8)",
    "FR/GD (1.5)",
    "FR (1.0)",
    "PR (0.5)",
    "NR",
  ];
  maxDate: Date = new Date();
  isSubmitting = false;
  errorMessage: string | null = null;
  useBatchMode = true; 
  batchValuesApplied = false;

  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private collectionService: CollectionService,
    private comicService: ComicService,
    private contaService: ContaService 
  ) 
  {
    
    this.batchForm = this.fb.group({
      acquisitionDate: [new Date().toISOString().split("T")[0], Validators.required],
      grade: ["", Validators.required],
      collectionId: ["", Validators.required],
    });
    
    this.registrationForm = this.fb.group({
      collectionId: ["", Validators.required],
      issues: this.fb.array([])
    });
  }

  get issuesFormArray(): FormArray {
    return this.registrationForm.get('issues') as FormArray;
  }

  ngOnInit(): void {
    this.isLoading = true;

    if (!this.contaService.currentUser()) {
      this.router.navigate(['/account/login'], {
        queryParams: {
          returnUrl: this.router.url
        }
      });
      return;
    }

    this.route.queryParams.subscribe((params) => {
      const issueIdsParam = params["issueIds"];
      if (issueIdsParam) {
        const issueIds = issueIdsParam.split(",").map(Number).filter((id: number) => !isNaN(id));
        if (issueIds.length) {
          this.loadSelectedIssues(issueIds);
        } else {
          this.router.navigate(["/comics"]);
        }
      } else {
        this.router.navigate(["/comics"]);
      }
    });

    this.loadCollections();

    this.batchForm.valueChanges.subscribe(() => {
      this.batchValuesApplied = false;
    });

    setTimeout(() => this.isLoading = false, 1500);
  }

  loadSelectedIssues(issueIds: number[]): void {
    this.comicService.getIssuesByIds(issueIds)
      .pipe(
        catchError(err => {
          this.errorMessage = "Falha ao carregar edições selecionadas. Por favor, tente novamente.";
          console.error("Error loading selected issues", err);
          return of([]);
        })
      )
      .subscribe(
        (issues: Edicao[]) => {
          this.selectedIssues = issues;
          this.initializeIssueForms();
        }
      );
  }

  initializeIssueForms(): void {
    while (this.issuesFormArray.length) {
      this.issuesFormArray.removeAt(0);
    }

    this.selectedIssues.forEach(issue => {
      issue.expanded = false; 
      this.issuesFormArray.push(
        this.fb.group({
          id: [issue.id],
          selected: [true], 
          acquisitionDate: [null, Validators.required], 
          grade: [null, Validators.required]  
        })
      );
    });
    
  }

  loadCollections(): void {
    this.collectionService.getUserCollections()
      .pipe(
        catchError(err => {
          this.errorMessage = "Falha ao carregar coleções. Por favor, tente novamente.";
          console.error("Error loading collections", err);
          return of({
            data: [], 
            totalCount: 0,
            pageNumber: 1,
            pageSize: 10,
            totalPages: 0
          } as Pagination<Collection>);
        })
      )
      .subscribe(
        (response: Pagination<Collection>) => {
          this.collections = response.data;
          if (response.data.length > 0) {
            this.registrationForm.patchValue({
              collectionId: response.data[0].id,
            });
            this.batchForm.patchValue({
              collectionId: response.data[0].id,
            });
          }
        }
      );
  }

  isIssueConfigured(index: number): boolean {
    const issueControl = this.issuesFormArray.at(index);
    
    if (!issueControl.get('selected')?.value) {
      return false;
    }
    
    const acquisitionDateControl = issueControl.get('acquisitionDate');
    const gradeControl = issueControl.get('grade');
    
    return !!(
      acquisitionDateControl && 
      gradeControl && 
      acquisitionDateControl.value && 
      gradeControl.value &&
      !acquisitionDateControl.invalid &&
      !gradeControl.invalid &&
      acquisitionDateControl.touched &&  
      gradeControl.touched               
    );
  }
  
  get configuredIssueCount(): number {
    return this.issuesFormArray.controls
      .filter((control, index) => this.isIssueConfigured(index))
      .length;
  }

  toggleAllIssues(event: MatCheckboxChange): void {
    const selected = event.checked;
    this.issuesFormArray.controls.forEach(control => {
      control.get('selected')?.setValue(selected);
    });
  }

  applyBatchValues(): void {
    const batchValues = this.batchForm.value;
    
    this.issuesFormArray.controls.forEach(control => {
      if (control.get('selected')?.value) {
        control.patchValue({
          acquisitionDate: batchValues.acquisitionDate,
          grade: batchValues.grade
        });
        
        control.get('acquisitionDate')?.markAsTouched();
        control.get('grade')?.markAsTouched();
      }
    });

    this.batchValuesApplied = true;
  }

  get allIssuesSelected(): boolean {
    if (!this.issuesFormArray.length) return false;
    return this.issuesFormArray.controls.every(control => control.get('selected')?.value);
  }

  get someIssuesSelected(): boolean {
    if (!this.issuesFormArray.length) return false;
    const selectedCount = this.issuesFormArray.controls.filter(control => control.get('selected')?.value).length;
    return selectedCount > 0 && selectedCount < this.issuesFormArray.length;
  }

  get selectedIssueCount(): number {
    return this.issuesFormArray.controls.filter(control => control.get('selected')?.value).length;
  }

  toggleIssueMode(): void {
    this.useBatchMode = !this.useBatchMode;
  }

  onSubmit(): void {
    if (this.useBatchMode) {
      this.submitBatchForm();
    } else {
      this.submitIndividualForm();
    }
  }

  submitBatchForm(): void {
    if (this.batchForm.invalid) {
      Object.keys(this.batchForm.controls).forEach(field => {
        const control = this.batchForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    
    const selectedIssueIds = this.issuesFormArray.controls
      .filter(control => control.get('selected')?.value)
      .map(control => control.get('id')?.value);
    
    let successCount = 0;
    let processedCount = 0;
    
    const processIssue = (index: number) => {
      if (index >= selectedIssueIds.length) {
        if (successCount === selectedIssueIds.length) {
          this.router.navigate(["/user"]);
        } else {
          this.isSubmitting = false;
        }
        return;
      }
      
      const formData = {
        edicaoId: selectedIssueIds[index],
        colecaoId: this.batchForm.value.collectionId,
        estadoConservacao: this.batchForm.value.grade,
        dataAquisicao: this.batchForm.value.acquisitionDate
      };
      
      this.collectionService.addIssuesToCollection(formData)
        .pipe(catchError(err => {
          console.error(`Error registering issue ${selectedIssueIds[index]}`, err);
          processedCount++;
          if (processedCount === selectedIssueIds.length) {
            this.isSubmitting = false;
          }
          return of(null);
        }))
        .subscribe(response => {
          processedCount++;
          if (response) {
            successCount++;
          }
          processIssue(index + 1);
        });
    };
    
    processIssue(0);
  }

  submitIndividualForm(): void {
    if (this.registrationForm.invalid) {
      Object.keys(this.registrationForm.controls).forEach(field => {
        const control = this.registrationForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const selectedIssues = this.issuesFormArray.controls.filter(control => control.get('selected')?.value);
    const requests = selectedIssues.map(control => {
      return {
        edicaoId: control.get('id')?.value,
        colecaoId: this.registrationForm.value.collectionId,
        estadoConservacao: control.get('grade')?.value,
        dataAquisicao: control.get('acquisitionDate')?.value
      };
    });

    const processRequests = (index = 0) => {
      if (index >= requests.length) {
        this.router.navigate(["/user"]);
        return;
      }

      this.collectionService.addIssuesToCollection(requests[index])
        .pipe(
          catchError(err => {
            this.errorMessage = `Erro ao registrar exemplar ${index + 1}. Por favor, tente novamente.`;
            console.error("Error registering issue", err);
            return of(null);
          })
        )
        .subscribe(response => {
          if (response) {
            processRequests(index + 1);
          } else {
            this.isSubmitting = false;
          }
        });
    };
    
    processRequests();
  }

  processSubmission(formData: any): void {
    const exemplarRequest = {
      edicaoId: Array.isArray(formData.edicaoIds) 
        ? formData.edicaoIds[0] 
        : formData.edicaoIds,
      colecaoId: formData.colecaoId || formData.collectionId,
      estadoConservacao: formData.estadoConservacao || formData.grade,
      dataAquisicao: formData.dataAquisicao || formData.acquisitionDate
    };
    
    this.collectionService.addIssuesToCollection(exemplarRequest)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
        catchError(err => {
          this.errorMessage = "Erro ao registrar exemplares. Por favor, tente novamente.";
          console.error("Error registering issues", err);
          return of(null);
        })
      )
      .subscribe(
        (response) => {
          if (response) {
            this.router.navigate(["/user"]);
          }
        }
      );
  }

  get batchCollectionIdControl(): FormControl {
    return this.batchForm.get('collectionId') as FormControl;
  }
  
  get registrationCollectionIdControl(): FormControl {
    return this.registrationForm.get('collectionId') as FormControl;
  }

  cancelRegistration(): void {
    window.history.back();
  }
}