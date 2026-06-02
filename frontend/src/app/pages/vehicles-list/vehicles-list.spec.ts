import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VehiclesList } from './vehicles-list';
import { FleetService } from '../../core/services/fleet';
import { Auth } from '../../core/services/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('VehiclesList', () => {
  let component: VehiclesList;
  let fixture: ComponentFixture<VehiclesList>;
  let mockFleetService: any;
  let mockAuth: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockFleetService = {
      getVehicles: vi.fn().mockReturnValue(of([])),
      deleteVehicle: vi.fn().mockReturnValue(of(void 0))
    };

    mockAuth = {
      getNickname: vi.fn().mockReturnValue('test-user'),
      getTenantId: vi.fn().mockReturnValue('test-tenant'),
      logout: vi.fn()
    };

    mockRouter = {
      navigate: vi.fn()
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue(null)
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [VehiclesList],
      providers: [
        { provide: FleetService, useValue: mockFleetService },
        { provide: Auth, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VehiclesList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
