import Event from '../event';
import throwParseError from '../../core/utils/throw_parse_error';

async function dispatchEventAsync(event) {
  const Class = this;

  if (!Match.test(event, Event)) {
    throwParseError([{
      'class': Class.getName()
    }, {
      'method': 'dispatchEventAsync'
    }, 'The first argument has to be an event object']);
  }

  const eventHandlers = Class.getEvents(event.type);
  if (eventHandlers.length === 0) {
    return true;
  }

  if (event.target === null) {
    event.target = Class;
  }
  if (event.currentTarget === null) {
    event.currentTarget = Class;
  }

  for (const eventHandler of eventHandlers) {
    await eventHandler(event);
    if (event.immediatePropagationStopped) {
      break;
    }
  }

  return event.cancelable ? !event.defaultPrevented : true;
}

export default dispatchEventAsync;
