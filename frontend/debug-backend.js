// Debug script to test backend API endpoints
// Run with: node debug-backend.js

const testBackend = async () => {
  const baseUrl = 'http://localhost:8000';
  
  console.log('🔍 Testing backend API endpoints...');
  console.log('Base URL:', baseUrl);
  
  // Test 1: Health check
  console.log('\n1. Testing health endpoint...');
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log('Health status:', healthResponse.status);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health data:', healthData);
    } else {
      console.log('Health check failed');
    }
  } catch (error) {
    console.log('Health check error:', error.message);
  }
  
  // Test 2: NASA data all endpoint
  console.log('\n2. Testing neo_data_all endpoint...');
  try {
    const testDate = '2022-10-10';
    const url = `${baseUrl}/neo_data_all/?start_date=${testDate}&end_date=${testDate}`;
    console.log('URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Element count:', data.element_count);
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
  } catch (error) {
    console.log('❌ Request error:', error.message);
  }
  
  // Test 3: NASA data per object endpoint
  console.log('\n3. Testing neo_data_per_object endpoint...');
  try {
    const testDate = '2022-10-10';
    const url = `${baseUrl}/neo_data_per_object/?start_date=${testDate}&end_date=${testDate}`;
    console.log('URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Object count:', Object.keys(data).length);
      console.log('Object names:', Object.keys(data));
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
  } catch (error) {
    console.log('❌ Request error:', error.message);
  }
  
  console.log('\n🏁 Backend testing complete!');
};

testBackend();
