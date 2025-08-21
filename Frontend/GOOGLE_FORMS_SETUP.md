# Google Forms QR Attendance Setup Guide

This guide explains how to set up Google Forms to work with the QR attendance system, making it accessible on mobile devices without needing to deploy the application.

## Step 1: Create a Google Form

1. Go to [Google Forms](https://forms.google.com)
2. Click "➕ Blank" to create a new form
3. Give it a title: "QR Code Attendance Form"
4. Add a description: "Scan the QR code to quickly register your attendance"

## Step 2: Add Form Fields

Create the following fields in your Google Form:

### Required Fields:
1. **Full Name** (Short answer)
   - Question: "What is your full name?"
   - Required: Yes

2. **Email Address** (Short answer)
   - Question: "What is your email address?"
   - Required: Yes
   - Add validation: Email

3. **Student/Employee ID** (Short answer)
   - Question: "What is your Student ID or Employee ID?"
   - Required: Yes

### Optional Fields:
4. **Phone Number** (Short answer)
   - Question: "Phone Number (Optional)"
   - Required: No

5. **Organization** (Short answer)
   - Question: "Organization/Company (Optional)"
   - Required: No

6. **Position/Role** (Short answer)
   - Question: "Position or Role (Optional)"
   - Required: No

7. **Additional Notes** (Paragraph)
   - Question: "Additional Notes (Optional)"
   - Required: No

### Hidden/System Fields:
8. **Session Title** (Short answer)
   - Question: "Session Title"
   - Required: No

9. **QR Code ID** (Short answer)
   - Question: "QR Code ID"
   - Required: No

10. **Session Time** (Short answer)
    - Question: "Session Time"
    - Required: No

11. **Location** (Short answer)
    - Question: "Location"
    - Required: No

12. **Metadata** (Paragraph)
    - Question: "System Metadata"
    - Required: No

## Step 3: Get Form URL and Entry IDs

### Get the Form URL:
1. Click the "Send" button in your Google Form
2. Click the "Link" tab (🔗)
3. Copy the URL - it will look like:
   ```
   https://docs.google.com/forms/d/e/1FAIpQLSf_YOUR_FORM_ID_HERE/viewform
   ```

### Get Entry IDs:
1. Open your form in preview mode
2. Right-click on the first field and select "Inspect Element"
3. Look for the `name` attribute - it will be something like `entry.123456789`
4. Record the entry ID for each field

Example entry IDs you'll find:
```
Full Name: entry.123456789
Email: entry.987654321
Student ID: entry.111222333
Phone: entry.444555666
Organization: entry.777888999
Position: entry.101112131
Notes: entry.141516171
Session Title: entry.181920212
QR Code ID: entry.223344556
Session Time: entry.334455667
Location: entry.445566778
Metadata: entry.556677889
```

## Step 4: Update the Code

Replace the placeholder values in `AdminQRGenerator.jsx`:

```javascript
// Replace this line:
const googleFormBaseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSf_YOUR_FORM_ID_HERE/viewform';

// With your actual form URL:
const googleFormBaseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSf_YOUR_ACTUAL_FORM_ID/viewform';

// Update all the entry IDs with your actual ones:
params.set('entry.123456789', qrData.attendanceConfig?.sessionTitle); // Session Title
params.set('entry.987654321', qrData.id); // QR Code ID
// ... etc for all fields
```

## Step 5: Set Up Form Response Collection

### Create a Spreadsheet:
1. In your Google Form, click "Responses" tab
2. Click the Google Sheets icon to create a spreadsheet
3. Choose "Create a new spreadsheet"
4. Name it "QR Attendance Responses"

### Optional - Set up Email Notifications:
1. In the "Responses" tab, click the ⋮ menu
2. Select "Get email notifications for new responses"
3. This will email you whenever someone submits attendance

## Step 6: Test the System

1. Generate a QR code from your admin dashboard
2. Scan it with your mobile phone
3. Verify that:
   - Google Form opens in mobile browser
   - Fields are pre-filled with user data
   - Form submits successfully
   - Response appears in your Google Sheet

## Example Pre-filled Google Form URL

When a user scans the QR code, they'll be redirected to a URL like this:

```
https://docs.google.com/forms/d/e/1FAIpQLSf_YOUR_FORM_ID/viewform?
entry.123456789=Attendance%20Session%20-%20Dec%2021,%202024%2010:30&
entry.987654321=attendance_1640089800000&
entry.111222333=John%20Doe&
entry.444555666=john.doe@school.edu&
entry.777888999=STU123456&
entry.101112131=Computer%20Science
```

## Benefits of Google Forms Integration

✅ **Mobile Accessibility**: Works on any device with internet connection  
✅ **No Deployment Required**: No need to host the application publicly  
✅ **Pre-filled Data**: User information automatically populated  
✅ **Data Collection**: Responses automatically stored in Google Sheets  
✅ **Email Notifications**: Optional email alerts for new submissions  
✅ **Free and Reliable**: Uses Google's infrastructure  
✅ **Easy Management**: View and export data from Google Sheets  

## Advanced Configuration

### Custom Styling:
You can customize the form appearance in Google Forms settings to match your branding.

### Data Processing:
Set up Google Apps Script to automatically process form responses and integrate with your backend system.

### Analytics:
Use Google Forms' built-in analytics to track attendance patterns and response rates.

## Troubleshooting

### QR Code Not Working:
- Verify the Google Form URL is correct
- Check that entry IDs match your form fields
- Ensure the form is set to "Public" or "Anyone with the link"

### Fields Not Pre-filling:
- Double-check entry IDs in the code
- Verify URL encoding is working properly
- Test the pre-filled URL manually in a browser

### Mobile Issues:
- Ensure QR code size is adequate (200px minimum)
- Test with different QR scanner apps
- Verify mobile browser compatibility

---

**Note**: Remember to replace all placeholder values with your actual Google Form URL and entry IDs for the system to work properly.
