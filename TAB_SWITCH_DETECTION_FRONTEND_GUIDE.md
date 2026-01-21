# Tab Switch Detection - Frontend Display Guide

## ✅ All Features Are Now Visible in Frontend

### 1. 🎯 During Test (TakeTest.jsx)

#### **Warning Banner** (Top of page)
- Appears when user switches tabs
- Yellow animated banner with warning icon
- **1st switch**: "⚠️ Warning: Tab switching is being monitored. Please stay on this page."
- **2nd switch**: "⚠️ Second Warning: Excessive tab switching may be flagged as suspicious activity!"
- Auto-dismisses after 5 seconds (or can be manually closed)

#### **Tab Switch Counter** (Right Sidebar)
```
┌─────────────────────┐
│ Question Palette    │
├─────────────────────┤
│ Answered: 5         │
│ Not Answered: 10    │
├─────────────────────┤
│ ⚠️ Tab Switches: 2  │ ← Shows count if > 0
│ (Yellow/Red badge)  │
└─────────────────────┘
```
- Shows only when count > 0
- Yellow (1-2 switches) / Red (3+ switches)
- "Flagged as suspicious" text for 3+

#### **Pre-Test Instructions**
Updated warning message:
- ✓ "**Do not switch tabs or minimize the window - it is being monitored**"

---

### 2. 📊 Test Result Page (TestResult.jsx)

#### **Tab Switch Warning Card**
Appears between score details and progress bar when `tabSwitchCount > 0`:

**For 1-2 switches (Yellow):**
```
┌────────────────────────────────────────────┐
│ ⚠️ Tab Switches Detected                   │
│                                            │
│ You switched tabs or minimized the        │
│ browser 2 times during this test.         │
└────────────────────────────────────────────┘
```

**For 3+ switches (Red - Suspicious):**
```
┌────────────────────────────────────────────┐
│ 🚨 Suspicious Activity Detected            │
│                                            │
│ You switched tabs or minimized the        │
│ browser 5 times during this test.         │
│ This test has been flagged for review.    │
└────────────────────────────────────────────┘
```

---

### 3. 📜 Test History Page (TestHistory.jsx)

#### **New Column: "Tab Switches"**
Added to the test history table:

| Test | Date | Score | % | Time | Status | **Tab Switches** | Action |
|------|------|-------|---|------|--------|------------------|--------|
| JS Quiz | Jan 12 | 85/100 | 85% | 15m | Passed | **0** ✅ | View |
| Python Test | Jan 11 | 60/100 | 60% | 20m | Failed | **2** ⚠️ | View |
| SQL Basics | Jan 10 | 70/100 | 70% | 18m | Passed | **5** 🚨 | View |

**Color Coding:**
- **Green (0)**: No tab switches - clean attempt
- **Yellow (1-2)**: Warning level
- **Red (3+)**: Flagged with warning icon 🚨

---

### 4. 👨‍💼 Admin Dashboard (TestPerformanceMonitor.jsx)

#### **Recent Attempts Table - New Column**

| User | Test | Date | Score | % | Time | Status | **Tab Switches** |
|------|------|------|-------|---|------|--------|------------------|
| John Doe | JS Quiz | Jan 12 | 85/100 | 85% | 15m | Passed | **0** ✅ |
| Jane Smith | Python | Jan 11 | 60/100 | 60% | 20m | Failed | **2** ⚠️ |
| Bob Johnson | SQL | Jan 10 | 70/100 | 70% | 18m | Passed | **5** 🚨 |

**Features:**
- Tab switch count with color coding
- Warning icon (🚨) for suspicious attempts (3+)
- Hover tooltip: "Flagged as suspicious"

---

## 🔧 Backend Endpoints Updated

### 1. **POST /api/tests/:testId/tab-switch**
Records each tab switch event in real-time

### 2. **POST /api/tests/:testId/submit**
Accepts `tabSwitchCount` and `tabSwitchTimestamps`

### 3. **GET /api/tests/results/:resultId**
Returns `tabSwitchCount` and `suspiciousActivity` fields

### 4. **GET /api/tests/history**
Returns all TestAttempt fields including tab switch data

### 5. **GET /api/admin/tests/attempts**
Returns tab switch data for admin monitoring

---

## 🎨 Visual Indicators Summary

| Location | Indicator | When Shown |
|----------|-----------|------------|
| **Test Page** | Yellow Banner | 1st & 2nd tab switch |
| **Test Page** | Counter Badge (Yellow) | 1-2 switches |
| **Test Page** | Counter Badge (Red) | 3+ switches |
| **Result Page** | Yellow Warning Card | 1-2 switches |
| **Result Page** | Red Alert Card | 3+ switches |
| **History Page** | Green Number (0) | No switches |
| **History Page** | Yellow Number (1-2) | Some switches |
| **History Page** | Red Number + Icon (3+) | Flagged |
| **Admin Dashboard** | Color-coded count + Icon | All attempts |

---

## 📱 How to Test

### 1. **Start a Test**
- Navigate to `/tests`
- Select any test and click "Start Test"
- Read instructions (should mention tab monitoring)

### 2. **Trigger Tab Switch Detection**
- Switch to another browser tab
- Or minimize the browser window
- Or use Alt+Tab / Cmd+Tab

### 3. **See Real-time Feedback**
- Warning banner appears at top
- Counter updates in sidebar (right side)
- Console logs show detection

### 4. **Submit Test**
- Complete and submit the test
- View results page

### 5. **Check Result Display**
- Tab switch warning card should appear
- Color depends on count (yellow/red)

### 6. **View History**
- Navigate to `/tests/history`
- See "Tab Switches" column in table

### 7. **Admin View** (If admin)
- Go to Admin Dashboard → Tests → Performance Monitor
- See tab switches in "Recent Attempts" table

---

## ✨ All Visual Elements Are Active!

✅ Warning banners during test
✅ Live counter in sidebar
✅ Result page warning cards
✅ History table column
✅ Admin dashboard monitoring
✅ Color-coded indicators
✅ Warning icons for flagged attempts

**No additional configuration needed - everything is live!**
