import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FleetService } from '../../core/services/fleet';
import { finalize, timeout } from 'rxjs/operators';

// Taiga UI
import { TuiButton, TuiTextfield, TuiInput, TuiLabel } from '@taiga-ui/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TuiButton,
    TuiTextfield,
    TuiInput,
    TuiLabel
  ],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class Settings implements OnInit {
  activeTab: 'cache' | 'audit' = 'cache';
  
  // Loading & Messages
  isLoading = false;
  isSaving = false;
  message = '';
  errorMessage = '';
  
  // Cache Config State
  cacheEnabled = true;
  cacheTtl = 60;
  
  // Audit Logs State
  auditLogs: any[] = [];
  logPage = 1;
  logPageSize = 10;
  totalLogs = 0;

  constructor(
    private fleetService: FleetService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCacheSettings();
  }

  setTab(tab: 'cache' | 'audit'): void {
    this.activeTab = tab;
    this.message = '';
    this.errorMessage = '';
    
    if (tab === 'cache') {
      this.loadCacheSettings();
    } else {
      this.logPage = 1;
      this.loadAuditLogs();
    }
  }

  loadCacheSettings(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.fleetService.getSettings()
      .pipe(
        timeout(8000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (settings) => {
          this.cacheEnabled = settings.cache_enabled;
          this.cacheTtl = settings.cache_ttl;
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Erro ao carregar configurações de cache.';
        }
      });
  }

  saveCacheSettings(): void {
    if (this.cacheTtl < 1) {
      this.errorMessage = 'O TTL deve ser de pelo menos 1 segundo.';
      return;
    }

    this.isSaving = true;
    this.message = '';
    this.errorMessage = '';

    this.fleetService.updateSettings({
      cache_enabled: this.cacheEnabled,
      cache_ttl: Number(this.cacheTtl)
    })
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.message = 'Configurações de cache salvas com sucesso!';
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Erro ao salvar configurações de cache.';
        }
      });
  }

  clearCache(): void {
    this.isSaving = true;
    this.message = '';
    this.errorMessage = '';

    this.fleetService.clearCache()
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.message = 'Cache limpo com sucesso!';
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Erro ao limpar cache.';
        }
      });
  }

  loadAuditLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.fleetService.getAuditLogs(this.logPage, this.logPageSize)
      .pipe(
        timeout(8000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.auditLogs = response.data;
          this.totalLogs = response.total;
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Erro ao carregar logs de auditoria de MongoDB.';
        }
      });
  }

  get totalLogPages(): number {
    return Math.ceil(this.totalLogs / this.logPageSize) || 1;
  }

  changeLogPage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalLogPages) {
      this.logPage = newPage;
      this.loadAuditLogs();
    }
  }

  formatPayload(payload: any): string {
    if (!payload) return '';
    try {
      return JSON.stringify(payload);
    } catch (e) {
      return '';
    }
  }
}
