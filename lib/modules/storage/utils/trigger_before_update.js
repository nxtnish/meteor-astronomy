import Event from "../../events/event.js";

function triggerBeforeUpdate(args) {
  const {
    doc,
    stopOnFirstError,
    fields,
    simulation,
    forceUpdate,
    trusted,
    oldDoc
  } = args;
  // Trigger the "beforeUpdate" event handlers.
  const event = new Event("beforeUpdate", {
        cancelable: true,
        propagates: true,
        doc,
        stopOnFirstError,
        fields,
        simulation,
        forceUpdate,
        trusted,
        oldDoc
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
      eventName: "beforeUpdate"
    });
  };

  if (result && typeof result.then === 'function') {
    return result.then(checkResult);
  }

  return checkResult(result);
}

export default triggerBeforeUpdate;
