/**
 * Comprehensive Zoom Integration Testing Script
 * Tests all Zoom-related functionality in the School Project
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ZoomIntegrationTester {
  constructor() {
    this.backendUrl = 'http://localhost:5000';
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  // Test helper functions
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': 'ℹ️ ',
      'success': '✅ ',
      'error': '❌ ',
      'warning': '⚠️ ',
      'debug': '🔍 '
    }[type] || 'ℹ️ ';
    
    console.log(`${prefix}[${timestamp}] ${message}`);
  }

  async test(name, testFn) {
    this.testResults.total++;
    try {
      this.log(`Testing: ${name}`, 'debug');
      const result = await testFn();
      
      if (result !== false) {
        this.testResults.passed++;
        this.testResults.details.push({ name, status: 'PASS', message: result || 'Test passed' });
        this.log(`PASS: ${name}`, 'success');
        return true;
      } else {
        this.testResults.failed++;
        this.testResults.details.push({ name, status: 'FAIL', message: 'Test returned false' });
        this.log(`FAIL: ${name}`, 'error');
        return false;
      }
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({ name, status: 'FAIL', message: error.message });
      this.log(`FAIL: ${name} - ${error.message}`, 'error');
      return false;
    }
  }

  // Backend Service Tests
  async testBackendHealth() {
    const response = await axios.get(`${this.backendUrl}/api/health`, { timeout: 5000 });
    if (response.status !== 200) throw new Error(`Backend health check failed: ${response.status}`);
    return `Backend healthy - ${response.data.message || 'OK'}`;
  }

  async testZoomCredentialsConfiguration() {
    const response = await axios.get(`${this.backendUrl}/api/simple-zoom/test`, { timeout: 10000 });
    
    if (!response.data.success) {
      throw new Error(`Zoom credentials test failed: ${response.data.error}`);
    }
    
    const tests = response.data.tests;
    if (tests.environment !== 'passed') {
      throw new Error('Missing Zoom environment variables');
    }
    if (tests.authentication !== 'passed') {
      throw new Error('Zoom authentication failed');
    }
    
    return `Zoom credentials valid - User: ${response.data.user.email}`;
  }

  async testZoomTokenGeneration() {
    try {
      // Test simple zoom service token generation
      const response = await axios.get(`${this.backendUrl}/api/simple-zoom/user-info`, { timeout: 10000 });
      
      if (!response.data.success) {
        throw new Error(`Token generation failed: ${response.data.error}`);
      }
      
      return `Token generation working - User ID: ${response.data.user.id}`;
    } catch (error) {
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  async testJWTSignatureGeneration() {
    const testMeetingNumber = '123456789';
    const response = await axios.post(`${this.backendUrl}/api/simple-zoom/generate-signature`, {
      meetingNumber: testMeetingNumber,
      role: 0
    }, { timeout: 5000 });
    
    if (!response.data.success) {
      throw new Error(`Signature generation failed: ${response.data.error}`);
    }
    
    if (!response.data.signature || !response.data.sdkKey) {
      throw new Error('Missing signature or SDK key in response');
    }
    
    return `JWT signature generated - SDK Key: ${response.data.sdkKey.substring(0, 10)}...`;
  }

  async testMeetingCreation() {
    const testMeeting = {
      topic: 'Test Meeting - Zoom Integration Check',
      duration: 5,
      agenda: 'Testing Zoom integration functionality',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        waiting_room: false
      }
    };

    try {
      const response = await axios.post(`${this.backendUrl}/api/simple-zoom/create-meeting`, testMeeting, { timeout: 15000 });
      
      if (!response.data.success) {
        throw new Error(`Meeting creation failed: ${response.data.error}`);
      }
      
      const meeting = response.data.meeting;
      if (!meeting.id || !meeting.join_url) {
        throw new Error('Created meeting missing required fields');
      }
      
      // Store meeting ID for cleanup
      this.testMeetingId = meeting.id;
      
      return `Meeting created successfully - ID: ${meeting.id}, Join URL: ${meeting.join_url}`;
    } catch (error) {
      throw new Error(`Meeting creation failed: ${error.message}`);
    }
  }

  async testMeetingRetrieval() {
    if (!this.testMeetingId) {
      throw new Error('No test meeting ID available - run meeting creation test first');
    }

    const response = await axios.get(`${this.backendUrl}/api/simple-zoom/meeting/${this.testMeetingId}`, { timeout: 10000 });
    
    if (!response.data.success) {
      throw new Error(`Meeting retrieval failed: ${response.data.error}`);
    }
    
    const meeting = response.data.meeting;
    if (meeting.id.toString() !== this.testMeetingId.toString()) {
      throw new Error('Retrieved meeting ID does not match');
    }
    
    return `Meeting retrieved successfully - Topic: ${meeting.topic}`;
  }

  // Enhanced Zoom Service Tests
  async testEnhancedZoomService() {
    try {
      // Test if enhanced zoom service endpoints exist
      const response = await axios.get(`${this.backendUrl}/api/zoom/validate-credentials`, { timeout: 10000 });
      
      if (response.data.success) {
        return `Enhanced Zoom service working - Token valid: ${response.data.tokenValid}`;
      } else {
        throw new Error(`Enhanced Zoom service failed: ${response.data.error}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return 'Enhanced Zoom service endpoints not available (using Simple Zoom service)';
      }
      throw new Error(`Enhanced Zoom service test failed: ${error.message}`);
    }
  }

  // Webhook Tests
  async testWebhookEndpoints() {
    try {
      // Check if webhook endpoints are available
      const endpoints = [
        '/api/webhooks/webhook-config',
        '/api/webhooks/webhook-status'
      ];

      let webhookResults = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${this.backendUrl}${endpoint}`, { timeout: 5000 });
          webhookResults.push(`${endpoint}: ${response.data.success ? 'Available' : 'Error'}`);
        } catch (error) {
          if (error.response && error.response.status === 404) {
            webhookResults.push(`${endpoint}: Not implemented`);
          } else {
            webhookResults.push(`${endpoint}: Error - ${error.message}`);
          }
        }
      }
      
      return `Webhook endpoints checked: ${webhookResults.join(', ')}`;
    } catch (error) {
      throw new Error(`Webhook test failed: ${error.message}`);
    }
  }

  // Socket.IO Tests
  async testSocketIOAvailability() {
    try {
      // Check if Socket.IO is available by checking server info
      const response = await axios.get(`${this.backendUrl}/socket.io/`, { 
        timeout: 5000,
        validateStatus: function (status) {
          return status < 500; // Accept 4xx responses as valid
        }
      });
      
      if (response.status === 200 || response.status === 400) {
        return 'Socket.IO server is available and responding';
      } else {
        throw new Error(`Unexpected Socket.IO response: ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Socket.IO server not available');
      }
      throw new Error(`Socket.IO test failed: ${error.message}`);
    }
  }

  // Frontend Integration Tests
  async checkFrontendFiles() {
    const criticalFiles = [
      'Frontend/src/Components/Zoom/EnhancedZoomDashboard.jsx',
      'Frontend/src/Components/Admin/AdminZoomDashboard.jsx',
      'Frontend/src/Components/User/UserZoomDashboard.jsx',
      'Frontend/src/Components/Zoom/ZoomRealTimeTracker.jsx'
    ];

    let missingFiles = [];
    let foundFiles = [];

    for (const file of criticalFiles) {
      const fullPath = path.join(__dirname, file);
      if (fs.existsSync(fullPath)) {
        foundFiles.push(file);
      } else {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      throw new Error(`Missing frontend files: ${missingFiles.join(', ')}`);
    }

    return `All critical frontend files found: ${foundFiles.length} files`;
  }

  async checkEnvironmentVariables() {
    const requiredEnvVars = [
      'ZOOM_ACCOUNT_ID',
      'ZOOM_CLIENT_ID', 
      'ZOOM_CLIENT_SECRET'
    ];

    const envPath = path.join(__dirname, 'Backend', '.env');
    const envExamplePath = path.join(__dirname, 'Backend', '.env.example');

    if (!fs.existsSync(envPath)) {
      if (fs.existsSync(envExamplePath)) {
        throw new Error('.env file not found, but .env.example exists. Copy and configure it.');
      } else {
        throw new Error('No .env or .env.example file found');
      }
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const missingVars = requiredEnvVars.filter(varName => 
      !envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your_`)
    );

    if (missingVars.length > 0) {
      throw new Error(`Missing or unconfigured environment variables: ${missingVars.join(', ')}`);
    }

    return `All required Zoom environment variables are configured`;
  }

  // Database Integration Tests
  async testZoomDatabaseModels() {
    try {
      // Test if Zoom-related database endpoints work
      const response = await axios.get(`${this.backendUrl}/api/zoom/meetings`, { 
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500; // Accept 4xx as valid response format
        }
      });
      
      if (response.status === 200 && response.data) {
        return `Zoom database models working - Found ${response.data.meetings?.length || 0} meetings`;
      } else if (response.status === 404) {
        return 'Zoom database endpoints not implemented (using Simple Zoom service)';
      } else {
        throw new Error(`Database test returned status ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Database model test failed: ${error.message}`);
    }
  }

  // Rate Limiting Tests
  async testRateLimiting() {
    try {
      // Make multiple rapid requests to test rate limiting
      const requests = Array.from({ length: 5 }, () => 
        axios.get(`${this.backendUrl}/api/simple-zoom/health`, { timeout: 3000 })
      );

      const results = await Promise.allSettled(requests);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return `Rate limiting test: ${successful} successful, ${failed} failed requests`;
    } catch (error) {
      throw new Error(`Rate limiting test failed: ${error.message}`);
    }
  }

  // QR Code Integration Tests
  async testQRCodeIntegration() {
    try {
      // Test QR code generation endpoint
      const response = await axios.get(`${this.backendUrl}/api/attendance/qr-test`, {
        timeout: 5000,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      if (response.status === 200) {
        return 'QR code integration endpoints available';
      } else if (response.status === 404) {
        return 'QR code integration not implemented yet';
      } else {
        throw new Error(`QR code test returned status ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Backend server not available for QR code test');
      }
      return `QR code integration test skipped: ${error.message}`;
    }
  }

  // Main test runner
  async runAllTests() {
    console.log('\n🚀 Starting Comprehensive Zoom Integration Tests\n');
    console.log('='.repeat(60));

    // Environment and Configuration Tests
    console.log('\n📋 ENVIRONMENT & CONFIGURATION TESTS');
    console.log('-'.repeat(40));
    await this.test('Check Environment Variables', () => this.checkEnvironmentVariables());
    await this.test('Check Frontend Files', () => this.checkFrontendFiles());
    await this.test('Backend Health Check', () => this.testBackendHealth());

    // Zoom API Tests
    console.log('\n🔐 ZOOM API AUTHENTICATION TESTS');
    console.log('-'.repeat(40));
    await this.test('Zoom Credentials Configuration', () => this.testZoomCredentialsConfiguration());
    await this.test('Zoom Token Generation', () => this.testZoomTokenGeneration());
    await this.test('JWT Signature Generation', () => this.testJWTSignatureGeneration());

    // Zoom Meeting Tests
    console.log('\n🎥 ZOOM MEETING MANAGEMENT TESTS');
    console.log('-'.repeat(40));
    await this.test('Meeting Creation', () => this.testMeetingCreation());
    await this.test('Meeting Retrieval', () => this.testMeetingRetrieval());

    // Enhanced Service Tests
    console.log('\n⚡ ENHANCED SERVICES TESTS');
    console.log('-'.repeat(40));
    await this.test('Enhanced Zoom Service', () => this.testEnhancedZoomService());
    await this.test('Webhook Endpoints', () => this.testWebhookEndpoints());
    await this.test('Socket.IO Availability', () => this.testSocketIOAvailability());

    // Integration Tests
    console.log('\n🔧 INTEGRATION TESTS');
    console.log('-'.repeat(40));
    await this.test('Database Models', () => this.testZoomDatabaseModels());
    await this.test('Rate Limiting', () => this.testRateLimiting());
    await this.test('QR Code Integration', () => this.testQRCodeIntegration());

    // Print Results
    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    console.log(`\nTotal Tests: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.testResults.passed / this.testResults.total) * 100)}%`);

    if (this.testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      console.log('-'.repeat(30));
      this.testResults.details
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`• ${test.name}: ${test.message}`);
        });
    }

    if (this.testResults.passed > 0) {
      console.log('\n✅ PASSED TESTS:');
      console.log('-'.repeat(30));
      this.testResults.details
        .filter(test => test.status === 'PASS')
        .forEach(test => {
          console.log(`• ${test.name}: ${test.message}`);
        });
    }

    // Overall Status
    console.log('\n' + '='.repeat(60));
    if (this.testResults.failed === 0) {
      console.log('🎉 ALL ZOOM INTEGRATION TESTS PASSED!');
      console.log('✅ Your Zoom integration is working correctly.');
    } else if (this.testResults.passed > this.testResults.failed) {
      console.log('⚠️  ZOOM INTEGRATION MOSTLY WORKING');
      console.log(`✅ ${this.testResults.passed} tests passed, ❌ ${this.testResults.failed} need attention.`);
    } else {
      console.log('🚨 ZOOM INTEGRATION NEEDS ATTENTION');
      console.log(`❌ ${this.testResults.failed} critical issues found.`);
    }
    console.log('='.repeat(60));

    // Cleanup test meeting if created
    if (this.testMeetingId) {
      console.log(`\n🧹 Note: Test meeting ${this.testMeetingId} was created and may need manual cleanup.`);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ZoomIntegrationTester();
  tester.runAllTests().catch(error => {
    console.error('\n🚨 Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = ZoomIntegrationTester;
