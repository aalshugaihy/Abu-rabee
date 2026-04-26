/**
 * Hand-rolled OpenAPI 3.0 description for the Abu-Rabee API.
 *
 * We deliberately keep the spec inline (rather than annotating each route)
 * so the docs travel with the code, are version-controlled, and don't pull
 * in another build step. Swagger UI is mounted at /api/docs by app.ts.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Abu-Rabee API',
    version: '0.1.0',
    description:
      'REST API for the Survey & Geospatial Sector dashboard. Authentication is cookie-based (HttpOnly, SameSite=Lax). Browsers must send `credentials: "include"` on cross-origin calls.',
  },
  servers: [
    { url: 'http://localhost:4000', description: 'Local dev' },
    { url: '/', description: 'Same origin' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'ab_token' },
    },
    schemas: {
      Role: { type: 'string', enum: ['admin', 'staff', 'viewer'] },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          role: { $ref: '#/components/schemas/Role' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          rememberMe: { type: 'boolean' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string' },
          rememberMe: { type: 'boolean' },
        },
      },
      Committee: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          nameEn: { type: 'string', nullable: true },
          scope: { type: 'string' },
          status: { type: 'string' },
          department: { type: 'string', nullable: true },
          representative: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RequestRecord: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string' },
          priority: { type: 'string', nullable: true },
          department: { type: 'string', nullable: true },
          date: { type: 'string', nullable: true },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          kind: { type: 'string', enum: ['routine', 'team'] },
          status: { type: 'string' },
          priority: { type: 'string' },
          progress: { type: 'integer' },
          parentTaskId: { type: 'string', nullable: true },
          orderIndex: { type: 'integer' },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          entity: { type: 'string', enum: ['committee', 'request', 'task'] },
          entityId: { type: 'string' },
          authorName: { type: 'string' },
          text: { type: 'string' },
          at: { type: 'string', format: 'date-time' },
        },
      },
      ActivityLog: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          entity: { type: 'string' },
          action: { type: 'string', enum: ['create', 'update', 'delete'] },
          entityId: { type: 'string' },
          label: { type: 'string', nullable: true },
          at: { type: 'string', format: 'date-time' },
        },
      },
      SavedView: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          page: { type: 'string' },
          name: { type: 'string' },
          filters: { type: 'string', description: 'JSON-encoded filter object' },
        },
      },
    },
  },
  paths: {
    '/health': { get: { tags: ['Meta'], responses: { 200: { description: 'OK' } } } },

    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user (first user becomes admin)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } },
        },
        responses: {
          200: { description: 'User created and signed in', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          409: { description: 'Email already taken' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in with email + password',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: {
          200: { description: 'Signed in', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/logout': {
      post: { tags: ['Auth'], summary: 'Sign out', responses: { 200: { description: 'OK' } } },
    },
    '/api/auth/refresh': {
      post: { tags: ['Auth'], summary: 'Rotate refresh token + issue new access token', responses: { 200: { description: 'OK' }, 401: { description: 'Refresh expired/invalid' } } },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        security: [{ cookieAuth: [] }],
        summary: 'Current user',
        responses: { 200: { description: 'OK' }, 401: { description: 'Unauthenticated' } },
      },
    },
    '/api/auth/users': {
      get: {
        tags: ['Auth', 'Admin'],
        security: [{ cookieAuth: [] }],
        summary: 'List all users (admin only)',
        responses: { 200: { description: 'OK' }, 403: { description: 'Forbidden' } },
      },
    },
    '/api/auth/users/{id}/role': {
      patch: {
        tags: ['Auth', 'Admin'],
        security: [{ cookieAuth: [] }],
        summary: "Change a user's role (admin only)",
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'OK' }, 403: { description: 'Forbidden' } },
      },
    },

    '/api/committees': {
      get: { tags: ['Committees'], security: [{ cookieAuth: [] }], responses: { 200: { description: 'List of committees' } } },
      post: { tags: ['Committees'], security: [{ cookieAuth: [] }], responses: { 201: { description: 'Created' }, 403: { description: 'Forbidden' } } },
    },
    '/api/committees/{id}': {
      get: { tags: ['Committees'], security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      patch: { tags: ['Committees'], security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Committees'], security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'Deleted' } } },
    },

    '/api/requests': {
      get: { tags: ['Requests'], security: [{ cookieAuth: [] }], responses: { 200: { description: 'List of requests' } } },
      post: { tags: ['Requests'], security: [{ cookieAuth: [] }], responses: { 201: { description: 'Created' } } },
    },
    '/api/requests/{id}': {
      get: { tags: ['Requests'], security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      patch: { tags: ['Requests'], security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Requests'], security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'Deleted' } } },
    },

    '/api/tasks': {
      get: { tags: ['Tasks'], security: [{ cookieAuth: [] }], responses: { 200: { description: 'List of tasks' } } },
      post: { tags: ['Tasks'], security: [{ cookieAuth: [] }], responses: { 201: { description: 'Created' } } },
    },
    '/api/tasks/{id}': {
      get: { tags: ['Tasks'], security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      patch: { tags: ['Tasks'], security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Tasks'], security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'Deleted' } } },
    },
    '/api/tasks/{id}/subtasks': {
      get: { tags: ['Tasks'], security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'List of sub-tasks ordered by orderIndex' } } },
    },
    '/api/tasks/{id}/subtasks/order': {
      put: {
        tags: ['Tasks'],
        security: [{ cookieAuth: [] }],
        summary: 'Persist sub-task order',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } } } } } },
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/tasks/{id}/dependencies': {
      get: { tags: ['Tasks'], security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
      post: {
        tags: ['Tasks'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { dependsOnId: { type: 'string' } } } } } },
        responses: { 201: { description: 'OK' }, 400: { description: 'cycle_detected' } },
      },
    },

    '/api/comments': {
      get: { tags: ['Comments'], security: [{ cookieAuth: [] }], parameters: [{ name: 'entity', in: 'query', schema: { type: 'string' } }, { name: 'entityId', in: 'query', schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
      post: { tags: ['Comments'], security: [{ cookieAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { entity: { type: 'string' }, entityId: { type: 'string' }, text: { type: 'string' } } } } } }, responses: { 201: { description: 'Created' } } },
    },

    '/api/activity': {
      get: {
        tags: ['Activity'],
        security: [{ cookieAuth: [] }],
        summary: 'Filterable activity log',
        parameters: [
          { name: 'entity', in: 'query', schema: { type: 'string' } },
          { name: 'action', in: 'query', schema: { type: 'string', enum: ['create', 'update', 'delete'] } },
          { name: 'entityId', in: 'query', schema: { type: 'string' } },
          { name: 'userId', in: 'query', schema: { type: 'string' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 200 } },
        ],
        responses: { 200: { description: '{ items, total, page, limit }' } },
      },
    },

    '/api/views': {
      get: { tags: ['Saved views'], security: [{ cookieAuth: [] }], parameters: [{ name: 'page', in: 'query', schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
      post: { tags: ['Saved views'], security: [{ cookieAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { page: { type: 'string' }, name: { type: 'string' }, filters: { type: 'object' } } } } } }, responses: { 201: { description: 'Created' } } },
    },
    '/api/views/{id}': {
      delete: { tags: ['Saved views'], security: [{ cookieAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'Deleted' } } },
    },
  },
} as const;
