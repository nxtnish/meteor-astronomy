import Event from "../../events/event.js";

function triggerBeforeInsert(args) {
  const { doc, stopOnFirstError, fields, simulation, trusted } = args;
  // Trigger the "beforeInsert" event handlers.
  const event = new Event("beforeInsert", {
        cancelable: true,
        propagates: true,
        doc,
        stopOnFirstError,
        fields,
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
      eventName: "beforeInsert"
    });
  };

  if (result && typeof result.then === 'function') {
    return result.then(checkResult);
  }

  return checkResult(result);
}

export default triggerBeforeInsert;
