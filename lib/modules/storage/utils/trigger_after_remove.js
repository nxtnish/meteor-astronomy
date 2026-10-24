import Event from "../../events/event.js";

function triggerAfterRemove(args) {
  const { doc, simulation, trusted } = args;
  // Trigger the "afterRemove" event handlers.
  return (args.async ? doc.dispatchEventAsync : doc.dispatchEvent).call(
    doc,
    new Event("afterRemove", {
      propagates: true,
      doc,
      simulation,
      trusted
    })
  );
}

export default triggerAfterRemove;
