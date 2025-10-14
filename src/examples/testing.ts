import { ServiceContainer, TYPES } from '../index';

// Mock services for testing
class MockUserService {
  isLoggedIn() {
    return true;
  }
  
  login(profile: any) {
    console.log('Mock login:', profile);
  }
  
  logout() {
    console.log('Mock logout');
  }
}

class MockChatService {
  private messages: any[] = [];
  
  addMessage(message: any) {
    this.messages.push(message);
  }
  
  getMessages() {
    return this.messages;
  }
  
  clearMessages() {
    this.messages = [];
  }
}

// Mock store facade
const mockStoreFacade = {
  getState: () => ({ isLogin: true, userProfile: { name: 'Test User' } }),
  setState: (partial: any) => console.log('Mock setState:', partial),
  subscribe: (listener: any) => {
    console.log('Mock subscribe');
    return () => console.log('Mock unsubscribe');
  },
};

// Test setup
export function createTestContainer() {
  const container = new ServiceContainer();
  
  // Mock services
  container.registerConstant(TYPES.UserService, new MockUserService());
  container.registerConstant(TYPES.ChatService, new MockChatService());
  container.registerConstant(TYPES.UserStore, mockStoreFacade);
  
  return container;
}

// Example test
export function runTests() {
  console.log('Running tests...');
  
  const container = createTestContainer();
  
  // Test service resolution
  const userService = container.get(TYPES.UserService);
  console.log('User service resolved:', !!userService);
  
  // Test store access
  const userStore = container.get(TYPES.UserStore) as any;
  console.log('User store resolved:', !!userStore);
  console.log('Store state:', userStore.getState());
  
  // Cleanup
  container.dispose();
  console.log('Tests completed');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
