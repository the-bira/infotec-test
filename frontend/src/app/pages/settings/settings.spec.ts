import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Settings } from './settings';
import { FleetService } from '../../core/services/fleet';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('Settings Component', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let mockFleetService: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockFleetService = {
      getSettings: vi.fn().mockReturnValue(of({ cache_enabled: true, cache_ttl: 90 })),
      updateSettings: vi.fn().mockReturnValue(of({ cache_enabled: true, cache_ttl: 90 })),
      clearCache: vi.fn().mockReturnValue(of({ message: 'success' })),
      getAuditLogs: vi.fn().mockReturnValue(of({ data: [], total: 0 }))
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue(null)
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        { provide: FleetService, useValue: mockFleetService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load initial cache settings', () => {
    expect(component).toBeTruthy();
    expect(mockFleetService.getSettings).toHaveBeenCalled();
    expect(component.cacheEnabled).toBe(true);
    expect(component.cacheTtl).toBe(90);
  });

  it('should change tabs and load audit logs', () => {
    component.setTab('audit');
    expect(component.activeTab).toBe('audit');
    expect(mockFleetService.getAuditLogs).toHaveBeenCalledWith(1, 10);
  });

  it('should call save settings successfully', () => {
    component.cacheEnabled = false;
    component.cacheTtl = 120;
    component.saveCacheSettings();
    expect(mockFleetService.updateSettings).toHaveBeenCalledWith({
      cache_enabled: false,
      cache_ttl: 120
    });
    expect(component.message).toBe('Configurações de cache salvas com sucesso!');
  });

  it('should clear cache successfully', () => {
    component.clearCache();
    expect(mockFleetService.clearCache).toHaveBeenCalled();
    expect(component.message).toBe('Cache limpo com sucesso!');
  });
});
