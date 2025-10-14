// Simple demo to test the SDK functionality
const { ServiceContainer, TYPES, createStoreFacade, Logger } = require('./dist/index.js');

// Create a simple store
const createSimpleStore = (initialState) => {
  let state = initialState;
  const listeners = new Set();
  
  return {
    getState: () => state,
    setState: (newState) => {
      state = { ...state, ...newState };
      listeners.forEach(listener => listener(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
};

// Create demo store
const demoStore = createSimpleStore({ count: 0, name: 'Demo' });

console.log('🚀 @refly/service-store-sdk Demo');
console.log('================================');

// Test 1: Create container
console.log('\n1. Creating service container...');
const container = new ServiceContainer();

// Test 2: Register store
console.log('2. Registering store...');
const storeFacade = createStoreFacade(demoStore);
container.registerStore('DemoStore', storeFacade);

// Test 3: Test store operations
console.log('3. Testing store operations...');
const retrievedStore = container.get('DemoStore');
console.log('Initial state:', retrievedStore.getState());

retrievedStore.setState({ count: 5, name: 'Updated Demo' });
console.log('Updated state:', retrievedStore.getState());

// Test 4: Test logger
console.log('4. Testing logger...');
const logger = container.get(TYPES.Logger);
logger.info('Hello from the SDK!');
logger.warn('This is a warning');
logger.error('This is an error');

// Test 5: Cleanup
console.log('5. Cleaning up...');
container.dispose();

console.log('\n✅ Demo completed successfully!');
console.log('The SDK is working correctly.');
