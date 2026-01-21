# Visual Example: Embedded Editor in Action

## What Users Will See

### Step 1: Viewing a Coding Question

```
┌─────────────────────────────────────────────────────────────┐
│  Question 1 of 5                               3 Marks       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Write a function to reverse a string                        │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Problem Statement                                      │  │
│  │ Given a string, return the reversed string            │  │
│  │                                                        │  │
│  │ Input Format                                          │  │
│  │ A single string                                       │  │
│  │                                                        │  │
│  │ Output Format                                         │  │
│  │ The reversed string                                   │  │
│  │                                                        │  │
│  │ Sample Test Case                                      │  │
│  │ Input: hello                                          │  │
│  │ Output: olleh                                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Starter Code                  [📋 Copy Starter Code]  │  │
│  │                                                        │  │
│  │  function reverseString(str) {                        │  │
│  │    // Your code here                                  │  │
│  │  }                                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 💡 Choose Your Coding Environment                      │ │
│  │ You can use the embedded online editor or paste       │ │
│  │ your solution in the text area below                  │ │
│  │                                 [Use Embedded Editor]  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: After Clicking "Use Embedded Editor"

```
┌─────────────────────────────────────────────────────────────┐
│  Question 1 of 5                               3 Marks       │
├─────────────────────────────────────────────────────────────┤
│  (Problem details above...)                                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 💡 Choose Your Coding Environment                      │ │
│  │ You can use the embedded online editor or paste       │ │
│  │ your solution in the text area below                  │ │
│  │                         [✓ Using Embedded Editor] ✓   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ⚠️ Note: Code written in the embedded editor will not      │
│  be automatically saved. Make sure to copy your final        │
│  solution to the text area below before submitting!          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  OneCompiler                          │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ 1  function reverseString(str) {               │  │   │
│  │  │ 2    return str.split('').reverse().join('');  │  │   │
│  │  │ 3  }                                           │  │   │
│  │  │ 4                                              │  │   │
│  │  │ 5  console.log(reverseString("hello"));       │  │   │
│  │  │                                                │  │   │
│  │  │                                    [▶ Run]    │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  Output:                                             │   │
│  │  olleh                                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Your Solution (Paste from embedded editor)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ function reverseString(str) {                          │ │
│  │   return str.split('').reverse().join('');            │ │
│  │ }                                                      │ │
│  │                                                        │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  125 characters                                              │
│                                                              │
│  [← Previous]        [Submit Test]          [Next →]        │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Admin Creating Coding Question

```
┌─────────────────────────────────────────────────────────────┐
│  Add New Question                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Question Text *                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Write a function to reverse a string                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Type: [Coding ▼]           Marks: [3]                      │
│                                                              │
│  ┌────────────── Coding Question Details ─────────────────┐ │
│  │                                                         │ │
│  │  Problem Statement *                                    │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ Given a string, return the reversed string      │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  │                                                         │ │
│  │  Sample Input          Sample Output                    │ │
│  │  ┌─────────────┐       ┌─────────────┐                 │ │
│  │  │ hello       │       │ olleh       │                 │ │
│  │  └─────────────┘       └─────────────┘                 │ │
│  │                                                         │ │
│  │  Test Cases *                                           │ │
│  │  Test Case 1                        [Remove]            │ │
│  │  ┌────────┐  ┌────────┐                                │ │
│  │  │ hello  │  │ olleh  │                                │ │
│  │  └────────┘  └────────┘                                │ │
│  │                           [+ Add Test Case]             │ │
│  │                                                         │ │
│  │  Programming Language                                   │ │
│  │  [JavaScript ▼]                                         │ │
│  │                                                         │ │
│  │  ─────── Starter Code (Optional) ───────                │ │
│  │                                                         │ │
│  │  JavaScript                                             │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ function reverseString(str) {                   │   │ │
│  │  │   // Your code here                             │   │ │
│  │  │ }                                               │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  │                                                         │ │
│  │  Python                                                 │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ def reverse_string(s):                          │   │ │
│  │  │     # Your code here                            │   │ │
│  │  │     pass                                        │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  │                                                         │ │
│  │  (Java and C++ fields below...)                        │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Cancel]                            [Add Question]          │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Coding Guide

### User Interface Colors:

**Info Banners (Blue):**
- 🔵 Choose Your Coding Environment banner
- Indicates helpful information

**Warning Banners (Yellow):**
- 🟡 Remember to copy code warning
- Indicates important action required

**Success (Green):**
- 🟢 "Using Embedded Editor" button (active state)
- "Copy Starter Code" button

**Alert (Red):**
- 🔴 Warning if textarea is empty
- Tab switch warnings

---

## Button States

### "Use Embedded Editor" Button

**Inactive State:**
```
┌─────────────────────────┐
│  Use Embedded Editor    │  ← White background, blue border
└─────────────────────────┘
```

**Active State:**
```
┌─────────────────────────┐
│ ✓ Using Embedded Editor │  ← Green background, white text
└─────────────────────────┘
```

### "Copy Starter Code" Button

**Normal State:**
```
┌──────────────────────┐
│ 📋 Copy Starter Code │  ← Blue background
└──────────────────────┘
```

**After Clicking:**
```
┌────────────┐
│ ✓ Copied! │  ← Green background, brief animation
└────────────┘
```

---

## Embedded Editor Features

What users can do in OneCompiler:
- ✅ Write code with syntax highlighting
- ✅ Run code and see output
- ✅ Test with different inputs
- ✅ See error messages
- ✅ Use multiple files (if needed)
- ✅ Switch between light/dark theme

**Important:** Code in OneCompiler is NOT saved to your system.  
Users MUST copy it to the textarea below before submitting!

---

## Mobile View

On mobile devices, the layout stacks vertically:

```
┌─────────────────┐
│ Problem Details │
├─────────────────┤
│ Starter Code    │
├─────────────────┤
│ Editor Toggle   │
├─────────────────┤
│ Embedded Editor │
│ (if enabled)    │
├─────────────────┤
│ Text Area       │
├─────────────────┤
│ Submit Button   │
└─────────────────┘
```

**Note:** Embedded coding editors work best on desktop.  
Mobile users should use desktop for optimal experience.

---

## Keyboard Shortcuts (in OneCompiler)

Users can use standard IDE shortcuts:
- `Ctrl+S` - Save (in OneCompiler, not your system)
- `Ctrl+Z` - Undo
- `Ctrl+/` - Comment/uncomment
- `Tab` - Indent
- `Shift+Tab` - Outdent
- `Ctrl+Enter` - Run code

---

## Example: Complete Question Flow

### Admin Creates:
1. Question: "Find sum of array"
2. Language: Python
3. Starter Code:
   ```python
   def array_sum(arr):
       # Your code here
       pass
   ```
4. Test Case: Input: `[1,2,3]` → Output: `6`

### User Sees:
1. Problem description
2. Starter code with copy button
3. "Use Embedded Editor" option
4. Textarea for final solution

### User Does:
1. Clicks "Use Embedded Editor"
2. Python editor loads in iframe
3. Writes solution:
   ```python
   def array_sum(arr):
       return sum(arr)
   ```
4. Tests in OneCompiler (sees output: 6)
5. Copies code to textarea
6. Submits test

### Admin Reviews:
1. Sees submitted code
2. Knows user used embedded editor (metadata)
3. Manually grades
4. Assigns 3/3 marks
5. Adds feedback: "Perfect!"

---

## Tips for Best User Experience

### For Users:
1. **Always test your code** in the embedded editor before submitting
2. **Copy your final solution** to the textarea - don't forget!
3. **Use the starter code** as a template if provided
4. **Desktop recommended** for coding tests
5. **Stable internet required** for embedded editor

### For Admins/Employers:
1. **Provide starter code** to help users get started
2. **Keep test cases simple** and visible
3. **Choose appropriate language** for the question
4. **Test your own questions** before activating
5. **Clear problem statements** help users understand better

---

## Success Indicators

✅ **Working Correctly When:**
- Embedded editor loads in iframe
- Copy button works and shows toast
- Toggle button changes state
- Code can be written in textarea
- Submission goes through
- Admin can see the code

❌ **Troubleshoot If:**
- Iframe doesn't load → Check internet/OneCompiler access
- Copy button doesn't work → Check browser permissions
- Code disappears → User forgot to copy to textarea
- Wrong language loads → Check question language setting

---

Generated: January 20, 2026
