# API Versioning and Backward Compatibility Guide

## Overview

The SolarCRM Pro API implements comprehensive versioning and backward compatibility to ensure smooth transitions for clients while enabling platform evolution. This guide covers the complete API versioning system, migration paths, and best practices.

## Supported Versions

| Version | Status | Sunset Date | Description |
|---------|--------|-------------|-------------|
| 1.0 | Deprecated | 2025-12-31 | Legacy version with basic functionality |
| 1.1 | Active | - | Enhanced version with improved features |
| 2.0 | Active | - | Latest version with comprehensive capabilities |

## Version Negotiation

### Request Headers

Clients can specify their preferred API version using any of these methods:

1. **Accept Header (Recommended)**
   ```
   Accept: application/vnd.solarcrm.v2.0+json
   ```

2. **X-API-Version Header**
   ```
   X-API-Version: 2.0
   ```

3. **URL Path**
   ```
   GET /api/v2.0/crm/leads
   ```

### Response Headers

All API responses include version information:

```
X-API-Version: 2.0
X-Supported-Versions: 1.0, 1.1, 2.0
X-Latest-Version: 2.0
X-API-Version-Status: active
Content-Type: application/vnd.solarcrm.v2.0+json
```

For deprecated versions:
```
X-API-Version-Status: deprecated
X-API-Sunset-Date: 2025-12-31T23:59:59Z
Warning: 299 - "API version 1.0 contains deprecated features"
```

## Version Differences

### Version 1.0 (Legacy)
- Basic CRUD operations
- Simple pagination format
- Limited error handling
- Basic authentication

**Pagination Format:**
```json
{
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

### Version 1.1 (Enhanced)
- Enhanced filtering and search
- Improved error responses
- Advanced permissions
- Better pagination format
- Lead scoring capabilities

**Pagination Format:**
```json
{
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 100,
    "items_per_page": 20
  }
}
```

### Version 2.0 (Latest)
- Comprehensive filtering and search
- Rich error details with codes
- Advanced rate limiting
- Real-time analytics
- Modern pagination with navigation
- Webhook support
- Bulk operations
- Enhanced security

**Pagination Format:**
```json
{
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 100,
    "items_per_page": 20,
    "has_next": true,
    "has_previous": false
  },
  "version_info": {
    "api_version": "2.0",
    "response_format": "v2",
    "timestamp": "2024-03-12T10:30:00Z"
  }
}
```

## Migration Paths

### Available Migrations

| From | To | Breaking Changes | Description |
|------|----|--------------------|-------------|
| 1.0 | 1.1 | No | Adds enhanced analytics and permissions |
| 1.1 | 2.0 | Yes | Updates pagination, error format, adds metadata |
| 1.0 | 2.0 | Yes | Direct migration with all improvements |

### Migration Planning

Use the migration API to plan your upgrade:

```bash
POST /api/version/migrate
{
  "from_version": "1.0",
  "to_version": "2.0",
  "migration_type": "plan"
}
```

Response includes:
- Migration steps and timeline
- Breaking changes analysis
- Rollback procedures
- Testing recommendations

### Migration Execution

```bash
POST /api/version/migrate
{
  "from_version": "1.0",
  "to_version": "2.0",
  "migration_type": "execute"
}
```

### Migration Validation

Test your data compatibility before migration:

```bash
POST /api/version/migrate
{
  "from_version": "1.0",
  "to_version": "2.0",
  "migration_type": "validate",
  "test_data": [
    { "id": "123", "name": "Test Lead" }
  ]
}
```

## Backward Compatibility

### Data Transformation

The API automatically transforms responses based on the requested version:

- **v1.0**: Removes newer fields, uses legacy pagination format
- **v1.1**: Includes enhanced fields, modern pagination
- **v2.0**: Full feature set with metadata and version info

### Field Mapping

| v1.0 | v1.1 | v2.0 |
|------|------|------|
| `page` | `current_page` | `current_page` |
| `per_page` | `items_per_page` | `items_per_page` |
| `total` | `total_items` | `total_items` |
| - | - | `has_next` |
| - | - | `has_previous` |
| - | `enhanced_analytics` | `enhanced_analytics` |
| - | `advanced_permissions` | `advanced_permissions` |
| - | - | `version_info` |

## Error Handling

### Version-Specific Error Formats

**v1.0 (Simple):**
```json
{
  "error": "Validation failed"
}
```

**v1.1 (Structured):**
```json
{
  "error": "Validation failed",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```

**v2.0 (Comprehensive):**
```json
{
  "error": "Validation failed",
  "error_code": "VALIDATION_ERROR",
  "error_details": {
    "message": "Invalid email format",
    "field": "email",
    "timestamp": "2024-03-12T10:30:00Z"
  },
  "version_info": {
    "api_version": "2.0",
    "response_format": "v2"
  }
}
```

## Rate Limiting

Version-specific rate limits:

| Version | Rate Limit | Burst Support |
|---------|------------|---------------|
| 1.0 | 100 req/min | No |
| 1.1 | 500 req/min | Limited |
| 2.0 | 1000 req/min | Yes |

## Usage Analytics

### Track Your Usage

```bash
GET /api/version
```

Returns comprehensive version information including:
- Your current usage by version
- Deprecation notices
- Migration recommendations

### Usage Breakdown

```bash
POST /api/version
{
  "time_range": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-03-12T23:59:59Z"
  }
}
```

## Best Practices

### For API Consumers

1. **Always specify version**: Use Accept header or X-API-Version
2. **Monitor deprecation warnings**: Check response headers
3. **Plan migrations early**: Don't wait until sunset dates
4. **Test thoroughly**: Use validation endpoints before migrating
5. **Handle version errors**: Implement fallback logic

### Version Selection Strategy

- **New integrations**: Use latest version (2.0)
- **Existing stable systems**: Stay on current version until planned upgrade
- **High-traffic systems**: Plan migrations during low-traffic periods
- **Critical systems**: Use staged rollouts with rollback plans

### Migration Timeline

1. **Planning Phase** (2-4 weeks)
   - Analyze current usage
   - Review breaking changes
   - Plan testing strategy
   - Prepare rollback procedures

2. **Testing Phase** (1-2 weeks)
   - Validate data transformations
   - Test all endpoints
   - Performance testing
   - Integration testing

3. **Migration Phase** (1 week)
   - Execute migration
   - Monitor for issues
   - Validate functionality
   - Performance monitoring

4. **Validation Phase** (1 week)
   - Confirm all systems working
   - Monitor error rates
   - User acceptance testing
   - Documentation updates

## Troubleshooting

### Common Issues

1. **Unsupported Version Error**
   - Check supported versions: `GET /api/version`
   - Update client to use supported version

2. **Data Format Changes**
   - Review version differences documentation
   - Update client parsing logic
   - Test with validation endpoint

3. **Rate Limit Changes**
   - Check new rate limits for target version
   - Implement appropriate backoff strategies
   - Consider upgrading for higher limits

4. **Authentication Issues**
   - Verify API key permissions for target version
   - Check authentication method compatibility
   - Review security requirements

### Support Resources

- **API Documentation**: https://docs.solarcrm.com/api
- **Migration Guides**: https://docs.solarcrm.com/api/migration
- **Status Page**: https://status.solarcrm.com
- **Support**: api-support@solarcrm.com

## Examples

### Version-Aware Client Implementation

```javascript
class SolarCRMClient {
  constructor(apiKey, version = '2.0') {
    this.apiKey = apiKey;
    this.version = version;
    this.baseURL = 'https://api.solarcrm.com';
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': `application/vnd.solarcrm.v${this.version}+json`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    });

    // Check for version warnings
    const warning = response.headers.get('Warning');
    if (warning) {
      console.warn('API Version Warning:', warning);
    }

    // Check for deprecation
    const status = response.headers.get('X-API-Version-Status');
    if (status === 'deprecated') {
      const sunsetDate = response.headers.get('X-API-Sunset-Date');
      console.warn(`API version ${this.version} is deprecated. Sunset date: ${sunsetDate}`);
    }

    return response.json();
  }

  async getLeads(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/crm/leads?${queryParams}`);
  }

  async createLead(leadData) {
    return this.request('/crm/leads', {
      method: 'POST',
      body: JSON.stringify(leadData)
    });
  }
}

// Usage
const client = new SolarCRMClient('your-api-key', '2.0');
const leads = await client.getLeads({ status: 'active' });
```

### Gradual Migration Strategy

```javascript
class MigrationAwareClient extends SolarCRMClient {
  constructor(apiKey, primaryVersion = '2.0', fallbackVersion = '1.1') {
    super(apiKey, primaryVersion);
    this.fallbackVersion = fallbackVersion;
  }

  async requestWithFallback(endpoint, options = {}) {
    try {
      return await this.request(endpoint, options);
    } catch (error) {
      if (error.status === 400 && error.message.includes('Unsupported API version')) {
        console.warn(`Falling back to version ${this.fallbackVersion}`);
        this.version = this.fallbackVersion;
        return await this.request(endpoint, options);
      }
      throw error;
    }
  }
}
```

This comprehensive API versioning system ensures smooth evolution of the SolarCRM Pro platform while maintaining backward compatibility and providing clear migration paths for all clients.