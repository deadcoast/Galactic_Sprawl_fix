import EventEmitter from 'events';

/**
 * Module event bus for handling module-level events
 */
class ModuleEventBus extends EventEmitter {
  emit(event: string, data: any): boolean {
    return super.emit(event, data);
  }
}

export const moduleEventBus = new ModuleEventBus(); 