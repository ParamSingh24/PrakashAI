// Test utility to verify voice assistant backend integration
import { applianceAPI } from '../services/applianceAPI';
import { createVoiceProcessor } from './smartVoiceCommands';

export const testBackendConnection = async (): Promise<boolean> => {
  console.log('🧪 Testing Backend Connection...');
  console.log('==================================');
  
  try {
    const isConnected = await applianceAPI.testConnection();
    
    if (isConnected) {
      console.log('✅ Backend connection successful!');
      return true;
    } else {
      console.log('❌ Backend connection failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Backend connection error:', error);
    return false;
  }
};

export const testApplianceRetrieval = async () => {
  console.log('🏠 Testing Appliance Retrieval...');
  console.log('==================================');
  
  try {
    const appliances = await applianceAPI.getAllAppliances();
    
    console.log(`📱 Retrieved ${appliances.length} appliances:`);
    appliances.forEach((app, index) => {
      console.log(`  ${index + 1}. ${app.name} (${app.type}) - ${app.state} - ${app.location}`);
    });
    
    if (appliances.length === 0) {
      console.log('⚠️ No appliances found in backend');
      return false;
    }
    
    console.log('✅ Appliance retrieval successful!');
    return appliances;
  } catch (error) {
    console.error('❌ Appliance retrieval failed:', error);
    return false;
  }
};

export const testVoiceToBackendControl = async () => {
  console.log('🎤 Testing Voice → Backend Control...');
  console.log('=====================================');
  
  try {
    // Get appliances from backend
    const appliances = await applianceAPI.getAllAppliances();
    
    if (appliances.length === 0) {
      console.log('❌ No appliances available for testing');
      return false;
    }
    
    // Create voice processor
    const simpleAppliances = appliances.map(app => ({
      uid: app.uid,
      name: app.name,
      type: app.type,
      state: app.state,
      location: app.location
    }));
    
    const processor = createVoiceProcessor(simpleAppliances);
    
    // Test commands
    const testCommands = [
      'Please turn on the fan',
      'आप पंखा चालू कर दीजिए',
      'Switch off the lights',
      'Turn on AC',
      'What is the status?'
    ];
    
    let successCount = 0;
    
    for (const command of testCommands) {
      console.log(`\\n🗣️ Testing: "${command}"`);
      
      const result = processor.processVoiceCommand(command);
      console.log(`  Intent: ${result.intent}`);
      console.log(`  Action: ${result.action}`);
      console.log(`  Appliance: ${result.appliance}`);
      console.log(`  Confidence: ${result.confidence}`);
      
      if (result.intent === 'appliance_control' && result.appliance) {
        const matches = processor.findMatchingAppliances(result);
        
        if (matches.length > 0) {
          const bestMatch = matches[0];
          console.log(`  🎯 Best match: ${bestMatch.name} (confidence: ${bestMatch.confidence.toFixed(2)})`);
          
          // Test actual backend control
          const currentAppliance = appliances.find(a => a.uid === bestMatch.uid);
          if (currentAppliance) {
            const newState = result.action === 'turn_on' ? 'on' : 'off';
            
            console.log(`  🎛️ Attempting to control: ${currentAppliance.name} → ${newState}`);
            
            const controlResult = await applianceAPI.controlAppliance(currentAppliance.uid, newState);
            
            if (controlResult.success) {
              console.log(`  ✅ Successfully controlled ${currentAppliance.name}`);
              successCount++;
              
              // Wait a moment then switch back to avoid leaving devices on
              setTimeout(async () => {
                const revertState = newState === 'on' ? 'off' : 'on';
                await applianceAPI.controlAppliance(currentAppliance.uid, revertState);
                console.log(`  🔄 Reverted ${currentAppliance.name} to ${revertState}`);
              }, 2000);
            } else {
              console.log(`  ❌ Failed to control: ${controlResult.message}`);
            }
          }
        } else {
          console.log(`  ❌ No matching appliance found`);
        }
      } else {
        console.log(`  ℹ️ Non-control command or not recognized`);
      }
    }
    
    console.log(`\\n📊 Test Results:`);
    console.log(`  Commands tested: ${testCommands.length}`);
    console.log(`  Successful controls: ${successCount}`);
    console.log(`  Success rate: ${((successCount / testCommands.filter(cmd => 
      processor.processVoiceCommand(cmd).intent === 'appliance_control'
    ).length) * 100).toFixed(1)}%`);
    
    return successCount > 0;
  } catch (error) {
    console.error('❌ Voice to backend control test failed:', error);
    return false;
  }
};

export const testApplianceStates = async () => {
  console.log('📊 Testing Appliance State Management...');
  console.log('========================================');
  
  try {
    const appliances = await applianceAPI.getAllAppliances();
    
    if (appliances.length === 0) {
      console.log('❌ No appliances available for state testing');
      return false;
    }
    
    // Test getting individual appliance states
    console.log('\\n🔍 Individual Appliance States:');
    for (const appliance of appliances.slice(0, 3)) { // Test first 3 only
      try {
        const state = await applianceAPI.getApplianceState(appliance.uid);
        console.log(`  ${appliance.name}: ${state.state} (${state.name})`);
      } catch (error) {
        console.log(`  ${appliance.name}: Error getting state`);
      }
    }
    
    // Test state changes
    const testAppliance = appliances[0];
    console.log(`\\n🎛️ Testing State Changes on: ${testAppliance.name}`);
    
    const originalState = testAppliance.state;
    const newState = originalState === 'on' ? 'off' : 'on';
    
    console.log(`  Original state: ${originalState}`);
    console.log(`  Changing to: ${newState}`);
    
    const controlResult = await applianceAPI.controlAppliance(testAppliance.uid, newState);
    
    if (controlResult.success) {
      console.log(`  ✅ State change successful`);
      console.log(`  Previous: ${controlResult.previous_state}`);
      console.log(`  New: ${controlResult.new_state}`);
      
      // Revert back to original state
      setTimeout(async () => {
        await applianceAPI.controlAppliance(testAppliance.uid, originalState);
        console.log(`  🔄 Reverted to original state: ${originalState}`);
      }, 3000);
      
      return true;
    } else {
      console.log(`  ❌ State change failed: ${controlResult.message}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Appliance state test failed:', error);
    return false;
  }
};

export const runCompleteBackendTest = async () => {
  console.log('🚀 Running Complete Backend Integration Test...');
  console.log('===============================================');
  
  const results = {
    connection: false,
    retrieval: false,
    voiceControl: false,
    stateManagement: false
  };
  
  // Test 1: Backend Connection
  results.connection = await testBackendConnection();
  
  if (!results.connection) {
    console.log('\\n❌ Backend connection failed. Skipping other tests.');
    return results;
  }
  
  // Test 2: Appliance Retrieval
  const appliances = await testApplianceRetrieval();
  results.retrieval = !!appliances;
  
  if (!results.retrieval) {
    console.log('\\n❌ Appliance retrieval failed. Skipping control tests.');
    return results;
  }
  
  // Test 3: Voice to Backend Control
  results.voiceControl = await testVoiceToBackendControl();
  
  // Test 4: State Management
  results.stateManagement = await testApplianceStates();
  
  // Final Results
  console.log('\\n🎉 Complete Backend Integration Test Results:');
  console.log('==============================================');
  console.log(`✅ Backend Connection: ${results.connection ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Appliance Retrieval: ${results.retrieval ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Voice Control: ${results.voiceControl ? 'PASS' : 'FAIL'}`);
  console.log(`✅ State Management: ${results.stateManagement ? 'PASS' : 'FAIL'}`);
  
  const passCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\\n📊 Overall Score: ${passCount}/${totalTests} tests passed (${((passCount/totalTests)*100).toFixed(1)}%)`);
  
  if (passCount === totalTests) {
    console.log('\\n🎉 ALL TESTS PASSED! Voice Assistant → Backend integration is working perfectly!');
  } else {
    console.log('\\n⚠️ Some tests failed. Check the logs above for details.');
  }
  
  return results;
};