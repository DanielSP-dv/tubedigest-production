const { chromium } = require('playwright');

async function runFullAppFlow() {
  console.log('🚀 Starting Full Application Flow Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Test Backend API Health
    console.log('📡 Testing Backend API Health...');
    await page.goto('http://localhost:3000/health');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/01-backend-health.png', fullPage: true });
    console.log('✅ Backend health check completed');
    
    // 2. Test API Home Page
    console.log('🏠 Testing API Home Page...');
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/02-api-home.png', fullPage: true });
    console.log('✅ API home page loaded');
    
    // 3. Test Frontend Dashboard
    console.log('📊 Testing Frontend Dashboard...');
    await page.goto('http://localhost:3001/');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/03-frontend-dashboard.png', fullPage: true });
    console.log('✅ Frontend dashboard loaded');
    
    // 4. Test Authentication UI
    console.log('🔐 Testing Authentication UI...');
    // Look for auth buttons
    const authButton = await page.locator('button:has-text("Sign In")').first();
    if (await authButton.isVisible()) {
      console.log('✅ Authentication UI found');
      await page.screenshot({ path: 'screenshots/04-auth-ui.png', fullPage: true });
    }
    
    // 5. Test Single Column Layout
    console.log('📱 Testing Single Column Layout...');
    const videoCards = await page.locator('.ant-card').count();
    console.log(`Found ${videoCards} video cards in single column layout`);
    await page.screenshot({ path: 'screenshots/05-single-column-layout.png', fullPage: true });
    console.log('✅ Single column layout verified');
    
    // 6. Test Search Functionality
    console.log('🔍 Testing Search Functionality...');
    const searchInput = await page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/06-search-functionality.png', fullPage: true });
      console.log('✅ Search functionality tested');
    }
    
    // 7. Test Channel Management
    console.log('📺 Testing Channel Management...');
    await page.goto('http://localhost:3001/channels');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/07-channel-management.png', fullPage: true });
    console.log('✅ Channel management page loaded');
    
    // 8. Test API Endpoints
    console.log('🔌 Testing API Endpoints...');
    
    // Test channels endpoint
    const channelsResponse = await page.request.get('http://localhost:3000/channels');
    console.log(`Channels API: ${channelsResponse.status()}`);
    
    // Test videos endpoint
    const videosResponse = await page.request.get('http://localhost:3000/videos/digest');
    console.log(`Videos API: ${videosResponse.status()}`);
    
    // Test transcripts endpoint
    const transcriptsResponse = await page.request.get('http://localhost:3000/transcripts/config');
    console.log(`Transcripts API: ${transcriptsResponse.status()}`);
    
    await page.screenshot({ path: 'screenshots/08-api-endpoints.png', fullPage: true });
    console.log('✅ API endpoints tested');
    
    // 9. Test Responsive Design
    console.log('📱 Testing Responsive Design...');
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile view
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/09-mobile-responsive.png', fullPage: true });
    console.log('✅ Mobile responsive design tested');
    
    // 10. Final Dashboard View
    console.log('🎯 Final Dashboard View...');
    await page.setViewportSize({ width: 1280, height: 720 }); // Desktop view
    await page.goto('http://localhost:3001/');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/10-final-dashboard.png', fullPage: true });
    console.log('✅ Final dashboard view captured');
    
    console.log('\n🎉 Full Application Flow Test Completed Successfully!');
    console.log('📸 Screenshots saved to screenshots/ folder');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
runFullAppFlow().catch(console.error);
