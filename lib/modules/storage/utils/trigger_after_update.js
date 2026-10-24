import Event from "../../events/event.js";

function triggerAfterUpdate(args) {
  const {
    doc,
    stopOnFirstError,
    fields,
    simulation,
    forceUpdate,
    trusted,
    oldDoc
  } = args;
  // Trigger the "afterUpdate" event handlers.
  return (args.async ? doc.dispatchEventAsync : doc.dispatchEvent).call(
    doc,
    new Event("afterUpdate", {
      propagates: true,
      doc,
      stopOnFirstError,
      fields,
      simulation,
      forceUpdate,
      trusted,
      oldDoc
    })
  );
}

export default triggerAfterUpdate;
