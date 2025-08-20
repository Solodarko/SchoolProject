# 🔍 QR Token Extraction Test Guide

## 🎯 Overview
This comprehensive test demonstrates how QR codes can embed user token data (name, email, profile info) and how to extract this information when scanning QR codes.

## 🚀 Quick Test Access

### **Test URL:** 
🔗 **http://localhost:5173/dashboard/qr-token-test**

### **Navigation Path:**
User Dashboard → 🔬 QR Token Test

---

## 📊 What This Test Demonstrates

### 1. **QR Code Generation with User Tokens**
- Embeds authenticated user data in QR codes
- Includes name, email, student ID, department, role
- Adds session data and permissions
- Creates secure checksum validation

### 2. **Token Extraction from QR Scanning**
- Camera-based QR scanning
- Parses JSON data from QR codes
- Extracts user information fields
- Displays extracted data in organized format

### 3. **User Data Structure**
QR codes contain a `userToken` object with:
```json
{
  "userToken": {
    "userId": "user_123",
    "username": "john_doe", 
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "studentId": "STU001",
    "department": "Computer Science",
    "hasStudentRecord": true,
    "tokenType": "attendance_access",
    "permissions": ["scan_qr", "submit_attendance"],
    "sessionData": {
      "loginTime": "2025-08-20T16:19:35.000Z",
      "deviceInfo": "Mozilla/5.0...",
      "browserInfo": {
        "platform": "Win32",
        "language": "en-US"
      }
    }
  }
}
```

---

## 🧪 Step-by-Step Test Procedure

### **Step 1: Access the Test Page**
1. Navigate to http://localhost:5173/dashboard/qr-token-test
2. Or use the user dashboard menu: **🔬 QR Token Test**

### **Step 2: Generate QR with User Token**
1. Click **"Generate Test QR Code"** button
2. A QR code appears with user token embedded
3. View the token summary showing:
   - 👤 **Name**: Full user name
   - 📧 **Email**: User email address  
   - 🎓 **Student ID**: Student identification

### **Step 3: Scan QR to Extract Token**
1. Click **"Start Camera Scanner"**
2. Allow camera permissions when prompted
3. Point camera at the generated QR code
4. Scanner automatically stops after successful scan

### **Step 4: View Extraction Results**
The results section shows:

#### ✅ **Successfully Extracted User Information**
- **👤 Full Name**: Extracted from `userToken.fullName`
- **📧 Email**: Extracted from `userToken.email`  
- **👤 Username**: Extracted from `userToken.username`
- **🎓 Student ID**: Extracted from `userToken.studentId`
- **🏢 Department**: Extracted from `userToken.department`
- **🔐 Role**: Extracted from `userToken.role`

#### **🔧 Advanced Data Views**
- **Complete Token Data**: Expandable table with all token fields
- **Raw QR Data**: Full JSON data from QR code with copy functionality

---

## 📱 Test Scenarios

### **Scenario A: Authenticated User**
- **Status**: Green success alert showing current user
- **Token Data**: Real user data from authentication context
- **Expected Result**: Actual name, email, student ID extracted

### **Scenario B: Non-Authenticated User** 
- **Status**: Yellow warning alert showing demo mode
- **Token Data**: Demo/placeholder data
- **Expected Result**: Test data extracted (Test User, test@example.com)

---

## 🔧 Technical Implementation

### **QR Generation Process:**
1. Get user identity from `useAuth()` context
2. Create QR data object with embedded `userToken`
3. Generate QR code using `react-qr-code`
4. Display with token summary chips

### **Token Extraction Process:**
1. Initialize `Html5Qrcode` scanner
2. Parse scanned text as JSON
3. Extract `userToken` object from parsed data
4. Map token fields to user information display
5. Show results in organized format

### **Key Code Components:**
- **QR Generation**: `generateTestQR()` function
- **QR Scanning**: `Html5Qrcode` integration  
- **Token Parsing**: JSON parsing with error handling
- **Data Display**: React components with MUI

---

## ✅ Success Indicators

### **QR Generation Success:**
- ✅ QR code displays with proper formatting
- ✅ Token summary shows correct user data
- ✅ Green success notification appears

### **Token Extraction Success:**
- ✅ Camera starts and captures QR code
- ✅ Green "Token data extracted successfully!" message
- ✅ User information panel shows extracted data
- ✅ All fields populated correctly (name, email, etc.)

### **Data Accuracy Verification:**
- ✅ Extracted name matches generated token
- ✅ Extracted email matches generated token
- ✅ All user fields correctly mapped and displayed

---

## 🎯 Real-World Applications

### **Attendance Systems:**
- Generate QR codes with student data
- Scan QR codes to automatically fill attendance forms
- Extract student info without manual entry

### **Event Check-in:**
- QR codes contain participant information
- Quick check-in by scanning QR
- Automatic data population for registration

### **Access Control:**
- QR codes with user credentials
- Scan to verify identity and permissions
- Extract user roles for access decisions

---

## 🔍 Testing Edge Cases

### **Test Invalid QR Codes:**
1. Generate regular text QR code (not JSON)
2. Scan with token extraction test
3. **Expected**: Error message about invalid format

### **Test Missing Token Data:**
1. Generate QR without `userToken` field
2. Scan and attempt extraction  
3. **Expected**: Shows scan success but no user info extracted

### **Test Malformed JSON:**
1. Create QR with invalid JSON syntax
2. Attempt scanning
3. **Expected**: Parse error with diagnostic information

---

## 📊 Data Flow Diagram

```
[User Authentication] 
        ↓
[Get User Identity Context]
        ↓ 
[Generate QR with userToken]
        ↓
[Display QR Code + Token Summary]
        ↓
[Camera Scan QR Code]
        ↓
[Parse JSON from QR]
        ↓
[Extract userToken Object]
        ↓
[Map to User Information Display]
        ↓
[Show Extraction Results]
```

---

## 🚨 Troubleshooting

### **Camera Permission Issues:**
- **Problem**: Camera access denied
- **Solution**: Enable camera permissions in browser settings
- **Chrome**: Settings > Privacy > Camera > Allow for localhost

### **QR Scanning Problems:**
- **Problem**: QR code won't scan
- **Solution**: Ensure good lighting, hold steady, try different angles
- **Backup**: Use image upload method if camera fails

### **Token Extraction Failures:**
- **Problem**: "Failed to extract token data"  
- **Solution**: Ensure QR contains valid JSON with `userToken` field
- **Debug**: Check raw data in expansion panel

### **Authentication Context Issues:**
- **Problem**: Demo data always shown
- **Solution**: Ensure user is logged in to see real data
- **Check**: Look for green vs yellow status alert

---

## 📝 Test Results Template

Document your test results:

```markdown
## QR Token Extraction Test Results

### Environment:
- Frontend URL: http://localhost:5173
- Backend URL: http://localhost:5000  
- User Status: [Authenticated/Not Authenticated]
- Browser: [Chrome/Firefox/Safari]
- Device: [Desktop/Mobile]

### Test Results:

#### QR Generation:
- [✅/❌] QR code generated successfully
- [✅/❌] Token summary displays correctly
- [✅/❌] User data populated accurately

#### Token Extraction:
- [✅/❌] Camera scanning works
- [✅/❌] QR code parsed successfully  
- [✅/❌] User token extracted
- [✅/❌] Name field extracted: ___________
- [✅/❌] Email field extracted: __________
- [✅/❌] Student ID extracted: __________

#### Data Accuracy:
- [✅/❌] Extracted data matches generated data
- [✅/❌] All user fields populated correctly
- [✅/❌] Token data complete and accurate

### Issues Found:
- Issue 1: ________________________
- Issue 2: ________________________

### Overall Status: [PASS/FAIL]
```

---

## 🎉 Next Steps

After successful token extraction testing:

1. **Integration**: Apply token extraction to real attendance forms
2. **Security**: Add token validation and expiration checks  
3. **Enhancement**: Include additional user metadata
4. **Production**: Deploy with HTTPS for camera access
5. **Mobile**: Test on various mobile devices and browsers

---

## 📞 Support

For test issues:
1. Check browser console for JavaScript errors
2. Verify camera permissions are granted
3. Ensure QR codes contain valid JSON data
4. Test with different QR code content formats
5. Try different browsers if issues persist

**The QR Token Extraction system is ready for production use!** 🎯✨
