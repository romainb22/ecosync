import { ChangeDetectorRef, Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  form: FormGroup;
  errorMessage = '';
  isLoading = false;
  hidePassword = true;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['']
    });
  }

  submit(): void {
    if (!this.showPassword) {
      if (this.form.get('email')?.invalid) {
        this.form.get('email')?.markAsTouched();
        return;
      }
      this.errorMessage = '';
      this.isLoading = true;
      const email = this.form.get('email')?.value;

      // Vérifier l’email (étape 1)
      this.authService.checkEmail(email).subscribe({
        next: (res) => {
          if (res.exists) {
            this.showPassword = true;
            this.form.get('password')?.setValidators([Validators.required]);
            this.form.get('password')?.updateValueAndValidity();
            this.isLoading = false;
            this.cdr.detectChanges();
          } else {
            this.router.navigate(['/register'], { queryParams: { email } });
          }
        },
        error: () => {
          this.errorMessage = "Erreur lors de la vérification de l'email.";
          this.isLoading = false;
        }
      });
      return;
    }

    // Étape 2 : login
    if (this.form.get('password')?.invalid) {
      this.form.get('password')?.markAsTouched();
      return;
    }

    const { email, password } = this.form.value;
    this.isLoading = true;
    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.errorMessage = 'Email ou mot de passe incorrect.';
        this.isLoading = false;
      },
      complete: () => { this.isLoading = false; }
    });
  }

  resetStep() {
    this.showPassword = false;
    this.form.get('password')?.setValue('');
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.errorMessage = '';
  }

  forgotPassword() {
    this.router.navigate(['/reset-password'], { queryParams: { email: this.form.value.email } });
  }
}
