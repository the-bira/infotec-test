import { Component } from '@angular/core';
import { z } from 'zod';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/services/auth';
import { Router } from '@angular/router';

// Imports do Taiga UI
import { TuiButton, TuiTextfield, TuiInput, TuiLabel } from '@taiga-ui/core';

const loginSchema = z.object({
  nickname: z.string().min(3, 'O usuário deve ter pelo menos 3 caracteres.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TuiButton,
    TuiTextfield,
    TuiInput,
    TuiLabel
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      nickname: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    const result = loginSchema.safeParse(this.loginForm.value);

    if (!result.success) {
      this.errorMessage = result.error.issues[0].message;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.auth.login(result.data).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/vehicles']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Credenciais inválidas. Tente "aivacol" / "aivacol".';
        console.error('Erro ao fazer login:', err);
      }
    });
  }
}

