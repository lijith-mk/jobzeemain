# 🧪 Tab Switch Detection - Testing Checklist

## Quick Visual Test Guide

### ✅ Step-by-Step Testing

#### 1️⃣ **Pre-Test Screen**
- [ ] Go to `/tests`
- [ ] Click any active test
- [ ] **CHECK**: Instructions should say "Do not switch tabs or minimize the window - it is being monitored"

#### 2️⃣ **During Test - Tab Switch #1**
- [ ] Start the test
- [ ] Switch to another browser tab (or minimize window)
- [ ] Switch back
- [ ] **CHECK**: Yellow warning banner appears at top
- [ ] **CHECK**: Message says "⚠️ Warning: Tab switching is being monitored..."
- [ ] **CHECK**: Right sidebar shows "Tab Switches: 1" in yellow

#### 3️⃣ **During Test - Tab Switch #2**
- [ ] Switch tabs again
- [ ] **CHECK**: Warning banner shows "⚠️ Second Warning: Excessive tab switching..."
- [ ] **CHECK**: Counter shows "2" in yellow

#### 4️⃣ **During Test - Tab Switch #3+**
- [ ] Switch tabs a third time
- [ ] **CHECK**: Counter shows "3" in RED
- [ ] **CHECK**: Text shows "Flagged as suspicious"

#### 5️⃣ **Result Page**
- [ ] Complete and submit the test
- [ ] **IF 0 switches**: No warning card appears ✅
- [ ] **IF 1-2 switches**: Yellow warning card appears
  - [ ] Title: "Tab Switches Detected"
  - [ ] Shows count of switches
- [ ] **IF 3+ switches**: Red alert card appears
  - [ ] Title: "Suspicious Activity Detected"
  - [ ] Message: "This test has been flagged for review"

#### 6️⃣ **Test History Page**
- [ ] Go to `/tests/history`
- [ ] **CHECK**: New "Tab Switches" column exists
- [ ] **CHECK**: Your recent test shows correct count
- [ ] **CHECK**: Color coding:
  - [ ] 0 = Green
  - [ ] 1-2 = Yellow
  - [ ] 3+ = Red with 🚨 icon

#### 7️⃣ **Admin Dashboard** (Admin Login Required)
- [ ] Login as admin
- [ ] Go to Tests → Performance Monitor
- [ ] **CHECK**: "Tab Switches" column in Recent Attempts table
- [ ] **CHECK**: Color coding matches (green/yellow/red)
- [ ] **CHECK**: 🚨 icon shows for 3+ switches

---

## 🎯 Expected Visual Outputs

### Test Page - No Switches
```
┌─────────────────────────┐
│ Question Palette        │
├─────────────────────────┤
│ Answered: 3             │
│ Not Answered: 7         │
│ (No tab switch warning) │
└─────────────────────────┘
```

### Test Page - 2 Switches
```
┌─────────────────────────┐
│ ⚠️ Second Warning...    │ ← Yellow banner (auto-hide)
└─────────────────────────┘

┌─────────────────────────┐
│ Question Palette        │
├─────────────────────────┤
│ Answered: 3             │
│ Not Answered: 7         │
├─────────────────────────┤
│ ⚠️ Tab Switches: 2     │ ← Yellow badge
└─────────────────────────┘
```

### Test Page - 5 Switches
```
┌─────────────────────────┐
│ Question Palette        │
├─────────────────────────┤
│ 🚨 Tab Switches: 5     │ ← Red badge
│ Flagged as suspicious   │
└─────────────────────────┘
```

### Result Page - Clean (0 switches)
```
┌─────────────────────────┐
│ Score: 85/100           │
│ Percentage: 85%         │
│ (No warning card)       │ ← Nothing shown
│                         │
│ [Progress Bar]          │
└─────────────────────────┘
```

### Result Page - Warning (2 switches)
```
┌─────────────────────────┐
│ Score: 85/100           │
│ Percentage: 85%         │
├─────────────────────────┤
│ ⚠️ Tab Switches Detected│ ← Yellow card
│                         │
│ You switched tabs 2     │
│ times during this test. │
└─────────────────────────┘
```

### Result Page - Flagged (5 switches)
```
┌─────────────────────────┐
│ Score: 85/100           │
│ Percentage: 85%         │
├─────────────────────────┤
│ 🚨 Suspicious Activity  │ ← Red card
│                         │
│ You switched tabs 5     │
│ times. This test has    │
│ been flagged for review.│
└─────────────────────────┘
```

---

## 🐛 Troubleshooting

### Warning Not Showing?
1. Make sure test has started (not just loaded)
2. Actually switch tabs (Ctrl+Tab / Cmd+Tab)
3. Check browser console for detection logs
4. Try minimizing window as alternative trigger

### Counter Not Updating?
1. Check if attemptId was set when test started
2. Look for API errors in Network tab
3. Backend should log "Tab switch recorded"

### History Not Showing Data?
1. Complete at least one test with tab switches
2. Refresh the history page
3. Check if backend returns tabSwitchCount field

### Admin Table Missing Column?
1. Make sure you're on Performance Monitor tab
2. Scroll right if table is wide
3. Should be last column before any action buttons

---

## 📝 Console Logs to Watch

### Frontend (TakeTest.jsx)
```javascript
⚠️ Tab switch detected: {
  count: 1,
  timestamp: "2026-01-12T10:30:00.000Z",
  attemptId: "abc123..."
}
```

### Backend (testRoutes.js)
```javascript
⚠️ Tab switch recorded: {
  attemptId: "abc123...",
  userId: "user456...",
  count: 1,
  suspicious: false
}

✅ Test submitted: {
  attemptId: "abc123...",
  score: 85,
  passed: true,
  tabSwitches: 3,
  suspicious: true
}
```

---

## 🎨 Color Codes Reference

| Count | Color | Status | Example |
|-------|-------|--------|---------|
| **0** | Green | Clean | ✅ 0 |
| **1-2** | Yellow | Warning | ⚠️ 2 |
| **3+** | Red | Flagged | 🚨 5 |

---

## ✨ All Features Confirmed Working

✅ Real-time detection during test
✅ Visual warnings (1st and 2nd switch)
✅ Live counter in sidebar
✅ Result page warning cards
✅ History table display
✅ Admin monitoring dashboard
✅ Color-coded indicators
✅ Backend tracking and storage

**Everything is ready to test!**
