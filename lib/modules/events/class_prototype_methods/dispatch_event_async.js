import _isArray from 'lodash/isArray';
import Event from '../event.js';
import throwParseError from '../../core/utils/throw_parse_error.js';
import AstroClass from '../../../core/class.js';

function returnFromDispatchEvent(event) {
  return event.cancelable ? !event.defaultPrevented : true;
}

async function dispatchEventAsync(event) {
  const doc = this;
  const Class = doc.constructor;

  if (!Match.test(event, Event)) {
    throwParseError([{
      'class': Class.getName()
    }, {
      'method': 'dispatchEventAsync'
    }, 'The first argument has to be an event object']);
  }

  if (event.target === null) {
    event.target = doc;
  }
  if (event.currentTarget === null) {
    event.currentTarget = doc;
  }

  for (const eventHandler of Class.getEvents(event.type)) {
    await eventHandler(event);
    if (event.immediatePropagationStopped) {
      break;
    }
  }

  if (event.propagationStopped || !event.propagates) {
    return returnFromDispatchEvent(event);
  }

  for (const field of Class.getObjectFields()) {
    const value = doc[field.name];
    if (value instanceof AstroClass) {
      event.currentTarget = value;
      await value.dispatchEventAsync(event);
    }
  }

  for (const field of Class.getListFields()) {
    const value = doc[field.name];
    if (field.isClass && _isArray(value)) {
      for (const element of value) {
        if (element instanceof AstroClass) {
          event.currentTarget = element;
          await element.dispatchEventAsync(event);
        }
      }
    }
  }

  return returnFromDispatchEvent(event);
}

export default dispatchEventAsync;
