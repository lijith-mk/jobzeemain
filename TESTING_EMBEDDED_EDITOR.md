# Testing Guide: Embedded Coding Editor Feature

## Quick Start Testing

### 1. **Admin Creates a Coding Question**

**Steps:**
1. Login as Admin
2. Go to Tests section
3. Create a new test (type: "Coding" or "Mixed")
4. Click "Add Question"
5. Select question type: "Coding"
6. Fill in:
   - Question Text: "Write a function to reverse a string"
   - Problem Statement: "Given a string, return the reversed string"
   - Sample Input: "hello"
   - Sample Output: "olleh"
   - At least 1 test case
   - Select Language: JavaScript
   - Add starter code (optional):
     ```javascript
     function reverseString(str) {
       // Your code here
     }
     ```
7. Save the question
8. Activate the test

### 2. **User Takes the Test**

**Steps:**
1. Login as User
2. Go to Tests
3. Select the coding test
4. Start test
5. On the coding question:
   - See problem description
   - See "Copy Starter Code" button (if provided)
   - Click "Use Embedded Editor" button
   - OneCompiler editor loads in an iframe
   - Write code in embedded editor
   - **Important:** Copy final solution to textarea below
   - Click "Submit Test"

### 3. **Admin/Employer Reviews Submission**

**Steps:**
1. Go to Test Performance Monitoring or Pending Reviews
2. View submission
3. See user's code answer
4. Manually assign marks
5. Add feedback
6. Save grading

---

## Test Scenarios

### Scenario 1: JavaScript Question
- **Language:** JavaScript
- **Starter Code:**
  ```javascript
  function solution(n) {
    // Your code here
  }
  ```
- **Test Case:** Input: "5", Output: "25"

### Scenario 2: Python Question
- **Language:** Python
- **Starter Code:**
  ```python
  def solution(n):
      # Your code here
      pass
  ```
- **Test Case:** Input: "10", Output: "100"

### Scenario 3: Java Question
- **Language:** Java
- **Starter Code:**
  ```java
  public class Solution {
      public static void main(String[] args) {
          // Your code here
      }
  }
  ```

### Scenario 4: C++ Question
- **Language:** C++
- **Starter Code:**
  ```cpp
  #include <iostream>
  using namespace std;
  
  int main() {
      // Your code here
      return 0;
  }
  ```

---

## Edge Cases to Test

### User Side:
1. **Without Embedded Editor:**
   - User types directly in textarea
   - Submits normally
   - Should work as before

2. **With Embedded Editor:**
   - User enables embedded editor
   - Writes code in iframe
   - Copies to textarea
   - Submits successfully

3. **Forgot to Copy Code:**
   - User writes in embedded editor
   - Doesn't copy to textarea
   - Submits empty answer
   - System accepts (admin sees `usedEmbeddedEditor: true`)

4. **Mix of Embedded and Text:**
   - Some questions use embedded editor
   - Some use textarea only
   - All save correctly with proper flags

### Admin Side:
1. **No Starter Code:**
   - Create question without starter code
   - User still sees embedded editor option
   - Works normally

2. **Multiple Languages:**
   - Add starter code for all 4 languages
   - Change language selection
   - User sees correct OneCompiler editor

3. **Edit Existing Question:**
   - Edit a coding question
   - Add/modify starter code
   - Language persists
   - Changes save correctly

### Employer Side:
1. **Same as Admin:**
   - Employer can create coding questions
   - All fields work
   - Validation works
   - Submissions reviewed correctly

---

## Validation Checklist

### Backend:
- [ ] Question schema includes `language` field
- [ ] Answer schema includes `usedEmbeddedEditor` field
- [ ] Submit endpoint handles both old and new format
- [ ] Backward compatibility: old submissions load correctly
- [ ] New submissions save with metadata

### Frontend - User:
- [ ] Coding questions display correctly
- [ ] Copy button works
- [ ] Embedded editor toggle works
- [ ] Correct iframe URL loads for each language
- [ ] Text area submission works
- [ ] Warning message shows when no code pasted
- [ ] Submission includes metadata

### Frontend - Admin:
- [ ] Language dropdown appears for coding questions
- [ ] All 4 starter code textareas appear
- [ ] Values save on question creation
- [ ] Values persist on question edit
- [ ] Question validation works

### Frontend - Employer:
- [ ] Type dropdown includes Coding, Essay, True/False
- [ ] Coding fields show when type is "coding"
- [ ] Essay fields show when type is "essay"
- [ ] True/False dropdown works
- [ ] Validation prevents submission without required fields
- [ ] Questions save successfully

---

## Common Issues & Solutions

### Issue 1: Embedded editor not loading
**Cause:** Network issue or incorrect URL
**Solution:** Check browser console, verify OneCompiler is accessible

### Issue 2: Copy button doesn't work
**Cause:** Browser clipboard permissions
**Solution:** Grant clipboard access when prompted

### Issue 3: Starter code not showing
**Cause:** Language mismatch or empty starter code
**Solution:** Verify language selection and starter code is saved

### Issue 4: Submission shows empty answer
**Cause:** User forgot to copy from embedded editor
**Solution:** Check `usedEmbeddedEditor` flag in Answer document

### Issue 5: Old submissions not displaying
**Cause:** Breaking change in schema
**Solution:** Backend handles both formats - should work automatically

---

## Database Verification

### Check Answer Document:
```javascript
db.answers.findOne({ questionType: 'coding' })
```

Should show:
```json
{
  "userAnswer": "function solution() { ... }",
  "usedEmbeddedEditor": true,
  "questionType": "coding",
  ...
}
```

### Check Question Document:
```javascript
db.questions.findOne({ type: 'coding' })
```

Should show:
```json
{
  "type": "coding",
  "codingDetails": {
    "problemStatement": "...",
    "language": "javascript",
    "starterCode": {
      "javascript": "...",
      "python": "...",
      "java": "...",
      "cpp": "..."
    }
  }
}
```

---

## Performance Testing

### Test with Multiple Questions:
1. Create a test with 10 coding questions
2. Each with different language
3. User takes test
4. Toggle embedded editor on/off
5. Submit
6. Verify no performance degradation

### Test Concurrent Users:
1. Multiple users take same test
2. All use embedded editors
3. Verify no conflicts
4. Check database for all submissions

---

## Browser Compatibility

Test in:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

Embedded iframes should work in all modern browsers.

---

## Mobile Testing

**Note:** Embedded editors may have limited functionality on mobile devices. Users should use desktop for coding tests when possible.

Test:
- [ ] Embedded editor loads on mobile
- [ ] Text area is accessible
- [ ] Copy button works
- [ ] Submission works

---

## Security Considerations

✅ **Safe:**
- No code execution on server
- No eval() or dangerous functions
- Iframes are sandboxed by OneCompiler
- User code never runs in our application

✅ **Manual Grading:**
- Admin/Employer reviews all code
- No automated execution
- No hidden test case validation

---

## Success Criteria

A successful implementation should:
1. ✅ User can choose between embedded editor and text area
2. ✅ Embedded editor loads for correct language
3. ✅ Copy starter code works
4. ✅ Submissions save with metadata
5. ✅ Backward compatibility maintained
6. ✅ Manual grading workflow unchanged
7. ✅ No breaking changes to existing tests
8. ✅ Admin and Employer can create coding questions
9. ✅ All 4 languages supported
10. ✅ Clear user instructions

---

## Rollback Plan

If issues arise:
1. Revert frontend changes to TakeTest.jsx
2. Remove usedEmbeddedEditor from Answer schema (optional field - no impact)
3. System returns to plain textarea interface
4. All existing data remains intact

---

## Next Steps After Testing

1. **User Feedback:** Get feedback from actual users
2. **Analytics:** Track embedded editor usage vs textarea
3. **Documentation:** Update user guide
4. **Training:** Train employers/admins on new features
5. **Monitoring:** Monitor for any issues in production

---

Generated: January 20, 2026
