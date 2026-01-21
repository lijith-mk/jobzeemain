# AI Mentor Recommendation System - Testing Guide

## Quick Start

### 1. Prerequisites
- User must be logged in (employee account)
- User should have skills in their profile for best results
- At least one approved mentor in the system

### 2. Testing the Feature

#### A. View Recommendations
1. Log in as a regular user (employee)
2. Navigate to `/mentors` (Find Mentors page)
3. Look for the **"Recommended For You"** section at the top
4. You should see up to 5 mentor cards with:
   - AI-Powered badge
   - Match percentage (e.g., "85% Match")
   - Common skills indicator
   - Previous sessions count (if any)
   - Purple/pink gradient styling

#### B. Test Different Scenarios

**Scenario 1: User with Skills**
```
1. Update your profile with skills (e.g., "JavaScript", "React", "Node.js")
2. Refresh the mentors page
3. You should see mentors with matching skills ranked higher
4. Check the "X Skills" badge on recommended cards
```

**Scenario 2: User without Skills (Fallback)**
```
1. Remove all skills from your profile
2. Refresh the mentors page
3. You should see top-rated mentors instead
4. Message: "Complete your profile for personalized recommendations"
```

**Scenario 3: Returning User**
```
1. Book and complete a session with a mentor
2. Return to the mentors page
3. That mentor should appear in recommendations
4. Check for "🤝 X Sessions" badge
```

## API Testing

### Test Recommendation Endpoint

```bash
# Get recommendations
curl -X GET http://localhost:5000/api/mentors/recommended \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "John Doe",
      "matchScore": 35.6,
      "commonSkills": ["React", "Node.js"],
      "previousSessions": 1,
      "rating": 4.5,
      ...
    }
  ],
  "isFallback": false,
  "message": "Personalized mentor recommendations based on your profile"
}
```

### Test Explanation Endpoint

```bash
# Get recommendation explanation
curl -X GET http://localhost:5000/api/mentors/recommended/MENTOR_ID/explanation \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

## Verification Checklist

### Backend ✅
- [ ] `recommendationController.js` created
- [ ] Routes added to `mentorRoutes.js`
- [ ] `userAuth.js` middleware created
- [ ] Recommendation algorithm calculates scores correctly
- [ ] Fallback logic works for users without skills
- [ ] API returns top 5 mentors sorted by match score

### Frontend ✅
- [ ] Recommendation section appears for logged-in users
- [ ] Match score badge displays correctly
- [ ] Common skills indicator shows
- [ ] Previous sessions count displays (if applicable)
- [ ] Cards have purple/pink gradient theme
- [ ] "AI Powered" badge visible
- [ ] Divider separates recommended from all mentors
- [ ] Section title changes to "All Mentors" when recommendations shown

### User Experience ✅
- [ ] Recommendations load without blocking main mentor list
- [ ] Recommendations fail silently if API error
- [ ] Non-logged-in users don't see recommendation section
- [ ] Recommendations are advisory (all mentors still accessible)
- [ ] Visual distinction between recommended and regular mentors

## Common Issues & Solutions

### Issue 1: No Recommendations Showing
**Possible Causes:**
- User not logged in
- No approved mentors in system
- API error (check console)

**Solution:**
- Verify user is logged in
- Check browser console for errors
- Verify backend is running
- Check if mentors exist in database

### Issue 2: Fallback Message Always Shows
**Possible Causes:**
- User has no skills in profile
- All match scores are very low

**Solution:**
- Add skills to user profile
- Ensure mentors have skills in their applications
- Check if skills match (case-insensitive)

### Issue 3: Match Scores Seem Wrong
**Possible Causes:**
- Algorithm weights may need adjustment
- Missing data in mentor/user profiles

**Solution:**
- Check scoreBreakdown in API response
- Verify mentor application data
- Review algorithm in `recommendationController.js`

## Performance Considerations

### Current Implementation:
- Fetches all approved mentors
- Calculates scores in memory
- Returns top 5 results

### Optimization Opportunities:
1. **Caching**: Cache mentor data for 5-10 minutes
2. **Indexing**: Ensure MongoDB indexes on:
   - `MentorApplication.verificationStatus`
   - `Mentor.status`
   - `MentorSession.userId` and `mentorId`
3. **Pagination**: If mentor count > 100, consider pre-filtering
4. **Background Processing**: Calculate scores asynchronously for large datasets

## Next Steps

### Immediate:
1. Test with real user data
2. Gather user feedback
3. Monitor API performance
4. Track recommendation click-through rates

### Future Enhancements:
1. Add A/B testing for algorithm weights
2. Implement machine learning for better matching
3. Add user feedback loop (was this recommendation helpful?)
4. Create admin dashboard to view recommendation analytics

## Success Metrics

Track these metrics to evaluate effectiveness:
- **Click-through rate**: % of users who click recommended mentors
- **Booking rate**: % of recommendations that lead to bookings
- **User satisfaction**: Feedback on recommendation quality
- **Time to book**: Reduced search time with recommendations
- **Return rate**: Users booking with same mentor again

## Documentation

Full documentation available in:
- `AI_MENTOR_RECOMMENDATION.md` - Complete algorithm explanation
- `recommendationController.js` - Implementation with comments
- This file - Testing and deployment guide

## Support

For issues or questions:
1. Check browser console for errors
2. Review backend logs
3. Verify database has required data
4. Test API endpoints directly
5. Review algorithm documentation

---

**Status**: ✅ Fully Implemented and Ready for Testing
**Version**: 1.0
**Last Updated**: December 2025
