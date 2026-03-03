# Backend API Issues

## Missing Endpoints

### Category Endpoints

The backend API at `http://localhost:5001` is **missing critical Category endpoints**:

#### ❌ Missing:
- `GET /api/Category` - Get all categories (returns 404)
- `POST /api/Category` - Create new category (not verified)

#### ✅ Available:
- `GET /api/Category/{id}` - Get category by ID
- `PUT /api/Category/{id}` - Update category
- `DELETE /api/Category/{id}` - Delete category

#### ✅ Available Product Endpoints:
- `GET /api/Product` - Get all products (includes categoryId and categoryName)
- `GET /api/Product/{id}` - Get product by ID
- Other product operations

## Current Workaround

The frontend `/api/categories` route has been modified to:
1. Call `GET /api/Product` instead
2. Extract unique categories from product data
3. Transform to match CategoryFromAPI interface

**File**: `src/app/api/categories/route.ts`

## Required Backend Changes

To properly support category management, the backend needs to add:

```csharp
// CategoryController.cs

[HttpGet]
public async Task<IActionResult> GetAllCategories()
{
    // Return list of all categories
}

[HttpPost]
public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
{
    // Create new category
}
```

## Impact

Without proper category endpoints:
- ❌ Can't create new categories from admin panel
- ❌ Can't get category hierarchy/relationships
- ❌ Performance issue: must fetch all products to get categories
- ✅ Can view categories (via workaround)
- ✅ Can update existing categories
- ✅ Can delete categories

## Testing

Swagger UI available at: http://localhost:5001/swagger/index.html

Current endpoints verified on: March 3, 2026
