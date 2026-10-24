// Class static methods.
import dispatchEvent from '../class_static_methods/dispatch_event.js';
import dispatchEventAsync from '../class_static_methods/dispatch_event_async.js';
import getEvents from '../class_static_methods/get_events.js';
import hasEvent from '../class_static_methods/hasEvent';
// Class prototype methods.
import { default as dispatchEventProto } from '../class_prototype_methods/dispatch_event.js';
import dispatchEventProtoAsync from '../class_prototype_methods/dispatch_event_async.js';

function onInitClass(Class, className) {
  // Class static methods.
  Class.dispatchEvent = dispatchEvent;
  Class.dispatchEventAsync = dispatchEventAsync;
  Class.getEvents = getEvents;
  Class.hasEvent = hasEvent;
  // Class prototype methods.
  Class.prototype.dispatchEvent = dispatchEventProto;
  Class.prototype.dispatchEventAsync = dispatchEventProtoAsync;
}

export default onInitClass;
