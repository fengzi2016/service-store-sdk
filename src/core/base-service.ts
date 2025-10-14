import { IService, ILogger } from '../types';
import { Logger, NoOpLogger } from '../utils/logger';

/**
 * Base service class that provides common functionality for all services
 */
export abstract class BaseService implements IService {
  public readonly serviceName: string;
  protected logger: ILogger;
  private disposed: boolean = false;

  constructor(logger?: ILogger) {
    this.serviceName = this.constructor.name;
    this.logger = logger || new NoOpLogger();
  }

  /**
   * Check if the service has been disposed
   */
  protected get isDisposed(): boolean {
    return this.disposed;
  }

  /**
   * Dispose the service and clean up resources
   */
  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this._debug('Disposing service', { serviceName: this.serviceName });
    
    try {
      this.onDispose();
    } catch (error) {
      this._error('Error during service disposal', { error, serviceName: this.serviceName });
    } finally {
      this.disposed = true;
    }
  }

  /**
   * Override this method to implement custom disposal logic
   */
  protected onDispose(): void {
    // Override in subclasses if needed
  }

  /**
   * Log debug message
   */
  protected _debug(message: string, context?: any): void {
    this.logger.debug(message, context);
  }

  /**
   * Log info message
   */
  protected _info(message: string, context?: any): void {
    this.logger.info(message, context);
  }

  /**
   * Log warning message
   */
  protected _warn(message: string, context?: any): void {
    this.logger.warn(message, context);
  }

  /**
   * Log error message
   */
  protected _error(message: string, context?: any): void {
    this.logger.error(message, context);
  }

  /**
   * Create a child logger with service context
   */
  protected createChildLogger(context: string): ILogger {
    if (this.logger instanceof Logger) {
      return this.logger.child(context);
    }
    return this.logger;
  }

  /**
   * Assert that the service is not disposed
   */
  protected assertNotDisposed(): void {
    if (this.disposed) {
      throw new Error(`Service ${this.serviceName} has been disposed and cannot be used`);
    }
  }

  /**
   * Get service metadata
   */
  public getMetadata(): { serviceName: string; disposed: boolean } {
    return {
      serviceName: this.serviceName,
      disposed: this.disposed,
    };
  }
}
