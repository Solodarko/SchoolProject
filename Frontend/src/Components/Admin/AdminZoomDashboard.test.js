// Test file to verify AdminZoomDashboard date formatting fixes
import { format } from 'date-fns';

// Helper function to safely format dates (replicated from AdminZoomDashboard)
const formatSafeDate = (dateValue, formatString, fallback = 'Unknown') => {
  if (!dateValue) return fallback;
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return fallback;
    return format(date, formatString);
  } catch (error) {
    console.warn('Date formatting error:', error, 'for value:', dateValue);
    return fallback;
  }
};

const formatJoinTime = (joinTime) => {
  return formatSafeDate(joinTime, 'HH:mm:ss', 'Unknown');
};

const formatCreatedAt = (createdAt) => {
  return formatSafeDate(createdAt, 'MMM dd, HH:mm', 'Unknown');
};

// Test cases
console.log('Testing date formatting fixes:');

// Test 1: Valid date
console.log('1. Valid date:', formatJoinTime('2024-01-15T10:30:00Z')); // Should work

// Test 2: Null date
console.log('2. Null date:', formatJoinTime(null)); // Should return 'Unknown'

// Test 3: Undefined date
console.log('3. Undefined date:', formatJoinTime(undefined)); // Should return 'Unknown'

// Test 4: Invalid date string
console.log('4. Invalid date:', formatJoinTime('not-a-date')); // Should return 'Unknown'

// Test 5: Empty string
console.log('5. Empty string:', formatJoinTime('')); // Should return 'Unknown'

// Test 6: Number that creates invalid date
console.log('6. Invalid number:', formatJoinTime(NaN)); // Should return 'Unknown'

// Test 7: Valid created_at date
console.log('7. Valid created_at:', formatCreatedAt('2024-01-15T14:45:30Z')); // Should work

// Test 8: Invalid created_at date
console.log('8. Invalid created_at:', formatCreatedAt('invalid')); // Should return 'Unknown'

console.log('\nAll tests completed. The fixes should prevent RangeError: Invalid time value');
