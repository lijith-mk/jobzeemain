# Form Validation Quick Reference

## Validation Rules Summary

| Field | Min | Max | Type | Required |
|-------|-----|-----|------|----------|
| **Title** | 3 chars | 100 chars | String | Yes |
| **Duration** | 1 min | 480 min | Number | Yes |
| **Total Marks** | 1 | 1000 | Number | Yes |
| **Passing Marks** | 1 | totalMarks | Number | Yes |

## Error Messages

### Title
- ❌ "Test title is required"
- ❌ "Title must be at least 3 characters"
- ❌ "Title must not exceed 100 characters"

### Duration
- ❌ "Duration must be at least 1 minute"
- ❌ "Duration cannot exceed 480 minutes (8 hours)"

### Total Marks
- ❌ "Total marks must be at least 1"
- ❌ "Total marks cannot exceed 1000"

### Passing Marks
- ❌ "Passing marks must be at least 1"
- ❌ "Passing marks cannot exceed total marks (X)"

## Code Patterns

### Adding Validation to a New Field

1. **Add to validation function**:
```javascript
case 'fieldName':
  if (!value || value < min) {
    errors.fieldName = 'Error message';
  } else if (value > max) {
    errors.fieldName = 'Error message';
  }
  break;
```

2. **Apply to input**:
```jsx
<input
  value={testForm.fieldName}
  onChange={(e) => setTestForm({ ...testForm, fieldName: e.target.value })}
  onFocus={() => handleTestFieldFocus('fieldName')}
  onBlur={() => handleTestFieldBlur('fieldName')}
  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${
    testFormErrors.fieldName && testFormTouched.fieldName
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:ring-blue-500'
  }`}
/>
{testFormErrors.fieldName && testFormTouched.fieldName && (
  <p className="mt-1 text-sm text-red-600">{testFormErrors.fieldName}</p>
)}
```

## Validation Triggers

| Event | Action | Visual Effect |
|-------|--------|---------------|
| **onFocus** | Clear error | Remove red border |
| **onBlur** | Validate field | Show red border + error message (if invalid) |
| **onSubmit** | Validate all fields | Mark all fields touched, prevent submission if invalid |
| **Reset/Cancel** | Clear all errors | Clean state |

## Form States

### testFormErrors
```javascript
{
  title: "Test title is required",      // Has error
  duration: undefined,                   // No error
  totalMarks: "Total marks must be...", // Has error
  passingMarks: undefined                // No error
}
```

### testFormTouched
```javascript
{
  title: true,      // User has interacted
  duration: false,  // User hasn't touched
  totalMarks: true, // User has interacted
  passingMarks: false
}
```

### Error Display Logic
```javascript
// Error shows only when BOTH conditions are true:
testFormErrors.fieldName && testFormTouched.fieldName
```

## Functions Reference

| Function | Purpose | When Called |
|----------|---------|-------------|
| `validateTestField(field, value)` | Validate single field | onBlur |
| `handleTestFieldBlur(field)` | Mark touched & validate | onBlur |
| `handleTestFieldFocus(field)` | Clear error | onFocus |
| `validateTestForm()` | Validate entire form | onSubmit |

## Common Tasks

### Add New Field Validation
1. Update `validateTestField()` switch case
2. Update `validateTestForm()` checks
3. Add handlers to input element
4. Add conditional className
5. Add error message display

### Change Validation Rule
1. Find field in `validateTestField()`
2. Update condition and error message
3. Optionally update `validateTestForm()` if needed

### Test Validation
1. Leave field empty → blur → should show error
2. Enter invalid value → blur → should show error
3. Enter valid value → blur → should clear error
4. Focus on field with error → error should disappear
5. Submit form with errors → should prevent submission

## Styling Classes

### Normal State
```jsx
className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
```

### Error State
```jsx
className="w-full px-3 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500"
```

### Error Message
```jsx
<p className="mt-1 text-sm text-red-600">{errorMessage}</p>
```

## Validation Flow

```
1. User focuses field
   ↓
2. onFocus handler clears error
   ↓
3. User types value
   ↓
4. User leaves field (blur)
   ↓
5. onBlur handler:
   - Marks field as touched
   - Validates field value
   - Updates error state
   ↓
6. UI shows/hides error based on validation result
   ↓
7. User clicks Submit
   ↓
8. validateTestForm() checks all fields
   ↓
9. If valid: Submit
   If invalid: Show errors on all fields, prevent submission
```

## Integration Points

### Files Modified
- ✅ `jobzee-frontend/src/pages/EmployerTests.jsx`
- ✅ `jobzee-frontend/src/components/AdminDashboard.jsx`

### Related Backend Files
- `jobzee-backend/models/Test.js` - Test schema
- `jobzee-backend/routes/employerTestRoutes.js` - Employer API
- `jobzee-backend/routes/adminRoutes.js` - Admin API

## Troubleshooting

### Error not showing
- ✓ Check if field is marked as touched
- ✓ Verify error exists in testFormErrors
- ✓ Check conditional rendering logic

### Error shows too early
- ✓ Ensure using `testFormTouched` check
- ✓ Don't validate on mount, only after interaction

### Error persists after fixing
- ✓ Check if onBlur handler is attached
- ✓ Verify validation logic is correct
- ✓ Ensure error is cleared when valid

### NaN in number fields
- ✓ Use `parseInt(value) || 0` to prevent NaN
- ✓ Set default values in initial state

## Best Practices

1. ✅ **Always check touched state** before showing errors
2. ✅ **Clear errors on focus** for better UX
3. ✅ **Validate on blur** not on every keystroke
4. ✅ **Use actionable error messages** that tell users how to fix
5. ✅ **Reset validation state** when form closes
6. ✅ **Prevent submission** when form is invalid
7. ✅ **Mark all fields touched** on submit attempt
8. ✅ **Use consistent styling** for error states

## Next Steps

After implementing validation:
1. Test all validation rules manually
2. Test edge cases (empty, boundary values)
3. Verify error messages are clear
4. Check accessibility (screen readers)
5. Test form reset behavior
6. Test submission with valid/invalid data
