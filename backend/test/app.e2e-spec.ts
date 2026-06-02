import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Aivacol Fleet Management (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let brandId: number;
  let modelId: number;
  let vehicleId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // 1. Security check
  describe('Security (Guards)', () => {
    it('should deny access to protected route /brands without JWT token', () => {
      return request(app.getHttpServer())
        .get('/brands')
        .expect(401);
    });

    it('should deny access to protected route /models without JWT token', () => {
      return request(app.getHttpServer())
        .get('/models')
        .expect(401);
    });

    it('should deny access to protected route /vehicles without JWT token', () => {
      return request(app.getHttpServer())
        .get('/vehicles')
        .expect(401);
    });
  });

  // 2. Authentication flow
  describe('Authentication (POST /auth/login)', () => {
    it('should authenticate default user "aivacol" and return JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ nickname: 'aivacol', password: 'aivacol' })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      token = response.body.access_token;
    });

    it('should fail authentication with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ nickname: 'aivacol', password: 'wrongpassword' })
        .expect(401);
    });
  });

  // 3. Brands CRUD flow
  describe('Brands Management (/brands)', () => {
    it('should create a new brand (POST /brands)', async () => {
      const response = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Toyota E2E' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Toyota E2E');
      expect(response.body.tenant_id).toBe('aivacol');
      brandId = response.body.id;
    });

    it('should list brands belonging to tenant (GET /brands)', async () => {
      const response = await request(app.getHttpServer())
        .get('/brands')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.some((b) => b.id === brandId)).toBe(true);
    });

    it('should fetch a single brand by ID (GET /brands/:id)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(brandId);
      expect(response.body.name).toBe('Toyota E2E');
    });

    it('should update a brand by ID (PUT /brands/:id)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/brands/${brandId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Toyota E2E Updated' })
        .expect(200);

      expect(response.body.name).toBe('Toyota E2E Updated');
    });
  });

  // 4. Models CRUD flow
  describe('Models Management (/models)', () => {
    it('should create a new model linked to brand (POST /models)', async () => {
      const response = await request(app.getHttpServer())
        .post('/models')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Corolla E2E', brand_id: brandId })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Corolla E2E');
      expect(response.body.brand_id).toBe(brandId);
      modelId = response.body.id;
    });

    it('should fail to create a model with non-existent brand (POST /models)', () => {
      return request(app.getHttpServer())
        .post('/models')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Invalid Model', brand_id: 99999 })
        .expect(404);
    });

    it('should list models belonging to tenant (GET /models)', async () => {
      const response = await request(app.getHttpServer())
        .get('/models')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((m) => m.id === modelId)).toBe(true);
      expect(response.body.find((m) => m.id === modelId).brand.name).toContain('Toyota E2E');
    });
  });

  // 5. Vehicles CRUD flow
  describe('Vehicles Management (/vehicles)', () => {
    it('should create a new vehicle linked to model (POST /vehicles)', async () => {
      const response = await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          license_plate: 'E2E9999',
          chassis: '9BWE2E12345678900',
          renavam: '12345678900',
          year: 2024,
          model_id: modelId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.license_plate).toBe('E2E9999');
      expect(response.body.model_id).toBe(modelId);
      vehicleId = response.body.id;
    });

    it('should fail to create a vehicle with non-existent model (POST /vehicles)', () => {
      return request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          license_plate: 'E2E9999',
          chassis: '9BWE2E12345678900',
          renavam: '12345678900',
          year: 2024,
          model_id: 99999,
        })
        .expect(404);
    });

    it('should list vehicles belonging to tenant (GET /vehicles)', async () => {
      const response = await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((v) => v.id === vehicleId)).toBe(true);
    });

    it('should fetch a single vehicle by ID (GET /vehicles/:id)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(vehicleId);
      expect(response.body.license_plate).toBe('E2E9999');
    });

    it('should delete a vehicle by ID (DELETE /vehicles/:id)', async () => {
      await request(app.getHttpServer())
        .delete(`/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
