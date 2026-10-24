import castNested from '../../fields/utils/castNested';
import resolveValues from '../../fields/utils/resolveValues';
import Event from '../../events/event';

function reload() {
  if (Meteor.isServer) {
    return reloadAsync.call(this);
  }

  const doc = this;
  const Class = doc.constructor;

  // The document has to be already saved in the collection.
  // Get a document from the collection without transformation.
  const rawDoc = Class.findOne(doc._id, {
    transform: null
  });
  if (rawDoc) {
    // Trigger the "beforeInit" event handlers.
    doc.dispatchEvent(new Event('beforeInit'));

    // Set all fields.
    doc.set(resolveValues({
      Class,
      rawDoc
    }));

    // Trigger the "afterInit" event handlers.
    doc.dispatchEvent(new Event('afterInit'));
  }
};

async function reloadAsync() {
  const doc = this;
  const Class = doc.constructor;
  const rawDoc = await Class.findOneAsync(doc._id, {
    transform: null
  });
  if (rawDoc) {
    await doc.dispatchEventAsync(new Event('beforeInit'));
    doc.set(resolveValues({
      Class,
      rawDoc
    }));
    await doc.dispatchEventAsync(new Event('afterInit'));
  }

  return doc;
}

export { reloadAsync };
export default reload;
