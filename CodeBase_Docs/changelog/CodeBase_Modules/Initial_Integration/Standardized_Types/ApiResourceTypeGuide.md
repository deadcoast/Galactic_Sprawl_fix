# API Documentation with Standardized Resource Types

This guide provides examples and best practices for using standardized resource types with the API client in the Galactic Sprawl codebase.

## Table of Contents

1. [Introduction](#introduction)
2. [API Client Overview](#api-client-overview)
3. [Using Resource Types in API Requests](#using-resource-types-in-api-requests)
4. [Validating Resource Types in API Responses](#validating-resource-types-in-api-responses)
5. [Common API Patterns](#common-api-patterns)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

## Introduction

The Galactic Sprawl API client has been updated to work with standardized resource types. This guide shows how to use the `TypeSafeApiClient` with the `ResourceType` enum to ensure type safety and consistency in API requests and responses.

## API Client Overview

The `TypeSafeApiClient` provides type-safe API requests with validation using Zod schemas:

```typescript
import { z } from 'zod';
import { TypeSafeApiClient, createApiClient } from '../api/TypeSafeApiClient';
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Create an API client instance
const apiClient = createApiClient({
  baseUrl: 'https://api.galacticsprawl.com',
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
});
```

## Using Resource Types in API Requests

### Defining Request Schemas with Resource Types

Use the `ResourceType` enum in your Zod schemas to ensure type safety:

```typescript
import { z } from 'zod';
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Define a schema for resource update requests
const resourceUpdateSchema = z.object({
  resourceType: z.nativeEnum(ResourceType),
  amount: z.number().positive(),
  operation: z.enum(['add', 'subtract', 'set']),
});

// Type derived from the schema
type ResourceUpdateRequest = z.infer<typeof resourceUpdateSchema>;

// Example request data
const updateRequest: ResourceUpdateRequest = {
  resourceType: ResourceType.MINERALS,
  amount: 100,
  operation: 'add',
};
```

### Creating API Endpoints with Resource Types

Define API endpoints that use resource types:

```typescript
import { z } from 'zod';
import { createApiEndpoint } from '../api/TypeSafeApiClient';
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Define a response schema for resource data
const resourceResponseSchema = z.object({
  resources: z.array(
    z.object({
      type: z.nativeEnum(ResourceType),
      amount: z.number(),
      capacity: z.number(),
      rate: z.number(),
    })
  ),
  timestamp: z.number(),
});

// Create an API endpoint for fetching resources
const getResourcesEndpoint = createApiEndpoint({
  path: '/api/resources',
  method: 'GET',
  requestSchema: z.object({}),
  responseSchema: resourceResponseSchema,
});

// Create an API endpoint for updating resources
const updateResourceEndpoint = createApiEndpoint({
  path: '/api/resources/update',
  method: 'POST',
  requestSchema: resourceUpdateSchema,
  responseSchema: z.object({
    success: z.boolean(),
    updatedResource: z.object({
      type: z.nativeEnum(ResourceType),
      amount: z.number(),
      capacity: z.number(),
      rate: z.number(),
    }),
  }),
});
```

### Making API Requests

Use the API client to make requests with resource types:

```typescript
// Fetch resources
async function fetchResources() {
  try {
    const response = await apiClient.request(getResourcesEndpoint);
    return response.data.resources;
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return [];
  }
}

// Update a resource
async function updateResource(type: ResourceType, amount: number) {
  try {
    const response = await apiClient.request(updateResourceEndpoint, {
      resourceType: type,
      amount: amount,
      operation: 'add',
    });
    return response.data.updatedResource;
  } catch (error) {
    console.error(`Failed to update ${type}:`, error);
    return null;
  }
}

// Example usage
updateResource(ResourceType.ENERGY, 50).then(result => {
  if (result) {
    console.log(`Updated ${result.type} to ${result.amount}`);
  }
});
```

## Validating Resource Types in API Responses

### Using Zod to Validate Resource Types

The API client automatically validates responses using Zod schemas:

```typescript
import { z } from 'zod';
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Define a schema for resource data
const resourceSchema = z.object({
  type: z.nativeEnum(ResourceType),
  amount: z.number(),
  capacity: z.number(),
  rate: z.number(),
});

// Use in an API endpoint
const getResourceEndpoint = createApiEndpoint({
  path: '/api/resources/:resourceType',
  method: 'GET',
  requestSchema: z.object({
    resourceType: z.nativeEnum(ResourceType),
  }),
  responseSchema: resourceSchema,
});

// Make a request with automatic validation
async function getResource(type: ResourceType) {
  try {
    // The response is automatically validated against the schema
    const response = await apiClient.request(getResourceEndpoint, {
      resourceType: type,
    });

    // response.data is typed as the inferred type from resourceSchema
    return response.data;
  } catch (error) {
    console.error(`Failed to get ${type}:`, error);
    return null;
  }
}
```

### Handling Invalid Resource Types

The API client will throw validation errors for invalid resource types:

```typescript
import { ApiErrorType } from '../api/TypeSafeApiClient';

async function safeGetResource(type: unknown) {
  try {
    // This will throw if type is not a valid ResourceType
    if (!isEnumResourceType(type)) {
      throw new Error(`Invalid resource type: ${type}`);
    }

    const response = await getResource(type);
    return response;
  } catch (error) {
    if (error instanceof ApiError && error.type === ApiErrorType.REQUEST_VALIDATION_ERROR) {
      console.error('Invalid resource type in request:', error.validationErrors);
    } else if (error instanceof ApiError && error.type === ApiErrorType.RESPONSE_VALIDATION_ERROR) {
      console.error('Invalid resource type in response:', error.validationErrors);
    } else {
      console.error('Other error:', error);
    }
    return null;
  }
}
```

## Common API Patterns

### Fetching Multiple Resource Types

```typescript
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Define an endpoint for fetching multiple resources
const getMultipleResourcesEndpoint = createApiEndpoint({
  path: '/api/resources/batch',
  method: 'POST',
  requestSchema: z.object({
    resourceTypes: z.array(z.nativeEnum(ResourceType)),
  }),
  responseSchema: z.object({
    resources: z.record(z.nativeEnum(ResourceType), resourceSchema),
  }),
});

// Fetch multiple resources
async function fetchMultipleResources(types: ResourceType[]) {
  try {
    const response = await apiClient.request(getMultipleResourcesEndpoint, {
      resourceTypes: types,
    });

    return response.data.resources;
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return {};
  }
}

// Example usage
fetchMultipleResources([ResourceType.MINERALS, ResourceType.ENERGY, ResourceType.POPULATION]).then(
  resources => {
    // resources is a record with ResourceType keys
    const minerals = resources[ResourceType.MINERALS];
    const energy = resources[ResourceType.ENERGY];

    console.log(`Minerals: ${minerals.amount}, Energy: ${energy.amount}`);
  }
);
```

### Resource Transfer API

```typescript
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Define a schema for resource transfers
const resourceTransferSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  resourceType: z.nativeEnum(ResourceType),
  amount: z.number().positive(),
});

// Create an API endpoint for resource transfers
const transferResourceEndpoint = createApiEndpoint({
  path: '/api/resources/transfer',
  method: 'POST',
  requestSchema: resourceTransferSchema,
  responseSchema: z.object({
    success: z.boolean(),
    source: resourceSchema,
    target: resourceSchema,
  }),
});

// Transfer resources between entities
async function transferResource(
  sourceId: string,
  targetId: string,
  type: ResourceType,
  amount: number
) {
  try {
    const response = await apiClient.request(transferResourceEndpoint, {
      sourceId,
      targetId,
      resourceType: type,
      amount,
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to transfer ${type}:`, error);
    return null;
  }
}
```

## Error Handling

### Resource-Specific Error Handling

```typescript
import { ApiError, ApiErrorType } from '../api/TypeSafeApiClient';
import { ResourceType } from '../types/resources/StandardizedResourceTypes';

// Handle resource-specific errors
async function handleResourceOperation(type: ResourceType, operation: () => Promise<any>) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ApiError) {
      switch (error.type) {
        case ApiErrorType.REQUEST_VALIDATION_ERROR:
          console.error(`Invalid request for ${type} operation:`, error.validationErrors);
          break;
        case ApiErrorType.RESPONSE_VALIDATION_ERROR:
          console.error(`Invalid response for ${type} operation:`, error.validationErrors);
          break;
        case ApiErrorType.NOT_FOUND_ERROR:
          console.error(`Resource ${type} not found`);
          break;
        case ApiErrorType.BAD_REQUEST_ERROR:
          console.error(`Bad request for ${type} operation:`, error.message);
          break;
        default:
          console.error(`Error during ${type} operation:`, error.message);
      }
    } else {
      console.error(`Unknown error during ${type} operation:`, error);
    }
    return null;
  }
}

// Example usage
handleResourceOperation(ResourceType.ENERGY, () => updateResource(ResourceType.ENERGY, 100));
```

## Best Practices

1. **Always use the ResourceType enum** in API requests and schemas

   ```typescript
   // Good
   const schema = z.object({ type: z.nativeEnum(ResourceType) });

   // Bad
   const schema = z.object({ type: z.string() });
   ```

2. **Use Zod's nativeEnum validator** for ResourceType validation

   ```typescript
   // Good
   z.nativeEnum(ResourceType);

   // Bad
   z.enum(['minerals', 'energy', 'population']);
   ```

3. **Create reusable schemas** for common resource structures

   ```typescript
   const resourceSchema = z.object({
     type: z.nativeEnum(ResourceType),
     amount: z.number(),
     // ...
   });

   // Reuse in multiple endpoints
   const endpoint1 = createApiEndpoint({
     // ...
     responseSchema: resourceSchema,
   });

   const endpoint2 = createApiEndpoint({
     // ...
     responseSchema: z.object({
       resources: z.array(resourceSchema),
     }),
   });
   ```

4. **Handle validation errors gracefully**

   ```typescript
   try {
     const result = await apiClient.request(endpoint);
     // Use result
   } catch (error) {
     if (error instanceof ApiError && error.type === ApiErrorType.VALIDATION_ERROR) {
       // Handle validation error
       console.error('Validation error:', error.validationErrors);
     } else {
       // Handle other errors
     }
   }
   ```

5. **Use type inference from schemas** for request and response types

   ```typescript
   // Define schema
   const resourceSchema = z.object({
     type: z.nativeEnum(ResourceType),
     amount: z.number(),
   });

   // Infer type
   type ResourceData = z.infer<typeof resourceSchema>;

   // Use inferred type
   function processResource(resource: ResourceData) {
     // Type-safe access to resource.type and resource.amount
   }
   ```

6. **Document API endpoints** with JSDoc comments

   ```typescript
   /**
    * Endpoint for fetching resource data
    *
    * @param {ResourceType} resourceType - The type of resource to fetch
    * @returns {Promise<ResourceData>} The resource data
    */
   const getResourceEndpoint = createApiEndpoint({
     // ...
   });
   ```

7. **Create helper functions** for common API operations

   ```typescript
   /**
    * Fetches the current amount of a resource
    *
    * @param {ResourceType} type - The resource type to fetch
    * @returns {Promise<number>} The current amount of the resource
    */
   async function getResourceAmount(type: ResourceType): Promise<number> {
     const resource = await getResource(type);
     return resource?.amount ?? 0;
   }
   ```

8. **Use computed property names** for resource type keys in objects

   ```typescript
   // Good
   const resourceAmounts = {
     [ResourceType.MINERALS]: 100,
     [ResourceType.ENERGY]: 50,
   };

   // Bad
   const resourceAmounts = {
     minerals: 100,
     energy: 50,
   };
   ```

By following these guidelines, you'll ensure type safety and consistency when working with resource types in API requests and responses.
