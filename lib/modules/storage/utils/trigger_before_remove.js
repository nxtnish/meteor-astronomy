import Event from "../../events/event.js";

function triggerBeforeRemove(args) {
  const { doc, simulation, trusted } = args;
  // Trigger the "beforeRemove" event handlers.
  const event = new Event("beforeRemove", {
        cancelable: true,
        propagates: true,
        doc,
        simulation,
        trusted
      });
  const result = args.async
    ? doc.dispatchEventAsync(event)
    : doc.dispatchEvent(event);
  const checkResult = (allowed) => {
    if (allowed) {
      return true;
    }
    // If an event was prevented, then we stop here.
    throw new Meteor.Error("prevented", "Operation prevented", {
      eventName: "beforeRemove"
    });
  };

  if (result && typeof result.then === 'function') {
    return result.then(checkResult);
  }

  return checkResult(result);
}

export default triggerBeforeRemove;
