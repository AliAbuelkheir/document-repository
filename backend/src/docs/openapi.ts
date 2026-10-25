import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { AUTH_COOKIE } from '../config/auth.js';

// `registry.register()` needs this. Each validator imports this file first, so it runs first.
extendZodWithOpenApi(z);

// Each file in `validators/` adds its schemas and paths to this registry.
export const registry = new OpenAPIRegistry();

export const cookieAuth = registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: AUTH_COOKIE,
  description: 'Send `POST /api/auth/login` first. The browser then sends the cookie.',
});

/** Security requirement for routes that need a signed-in user. */
export const signedIn = [{ [cookieAuth.name]: [] }];

let document: ReturnType<OpenApiGeneratorV31['generateDocument']> | null = null;

/** Builds the document on the first call. The validators have registered all paths by then. */
export function getOpenApiDocument(): ReturnType<OpenApiGeneratorV31['generateDocument']> {
  document ??= new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Document Repository API',
      version: '1.0.0',
      description:
        'All dates are ISO-8601 UTC. All ids are UUIDv7. ' +
        'Lists return `{ data, meta }`. Errors return `{ error: { code, message, details } }`.',
    },
    servers: [{ url: '/api' }],
  });
  return document;
}
