import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidationErrors, ValidatorFn, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent implements OnInit {
  form: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  hidePassword = true;
  hideConfirm = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatchValidator });
  }

  ngOnInit(): void {
    // Pré-remplir l'email si passé en param
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) this.form.get('email')?.setValue(email);
  }

  passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  };

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email, password } = this.form.value;

    // Optionnel : Vérifier si l'email existe déjà AVANT de créer (déjà fait côté back, mais UX +)
    this.authService.checkEmail(email).subscribe({
      next: (res) => {
        if (res.exists) {
          this.errorMessage = "Cet email existe déjà. Connecte-toi !";
          this.isLoading = false;
        } else {
          // Ok, on peut register
          this.authService.register(email, password).subscribe({
            next: () => {
              this.successMessage = "Compte créé avec succès ! Redirection...";
              setTimeout(() => this.router.navigate(['/login'], { queryParams: { email } }), 1500);
            },
            error: () => {
              this.errorMessage = "Erreur lors de la création du compte.";
              this.isLoading = false;
            }
          });
        }
      },
      error: () => {
        this.errorMessage = "Erreur de vérification de l'email.";
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
