import Event from "../../events/event.js";

function triggerAfterSave(args) {
  const {
    doc,
    stopOnFirstError,
    fields,
    simulation,
    forceUpdate,
    trusted,
    oldDoc
  } = args;
  // Trigger the "afterSave" event handlers.
  return (args.async ? doc.dispatchEventAsync : doc.dispatchEvent).call(
    doc,
    new Event("afterSave", {
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

export default triggerAfterSave;
