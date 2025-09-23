// Simple test utility to verify dashboard functionality
export const testDashboardConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:3000/users/krishnasinghprojects', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000)
    });
    
    return response.ok;
  } catch (error) {
    console.log('Backend connection test failed:', error);
    return false;
  }
};

export const logDashboardStatus = () => {
  testDashboardConnection().then(isConnected => {
    if (isConnected) {
      console.log('✅ Dashboard: Backend server is running and accessible');
    } else {
      console.log('⚠️ Dashboard: Backend server is not available, using demo data');
    }
  });
};