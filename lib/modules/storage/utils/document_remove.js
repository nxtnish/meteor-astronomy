import triggerBeforeRemove from './trigger_before_remove.js';
import triggerAfterRemove from './trigger_after_remove.js';
import handleMongoError from './handle_mongo_error.js';

function documentRemove(args = {}) {
  const {
    doc,
    simulation = true,
    trusted = false
  } = args;

  // Stop execution, if we are not on the server, when the "simulation" flag is
  // not set.
  if (!simulation && !Meteor.isServer) {
    return;
  }

  const Class = doc.constructor;
  const Collection = Class.getCollection();

  // Remove only when document has the "_id" field (it's persisted).
  if (doc._isNew) {
    return 0;
  }

  // Check if a class is secured.
  if (Class.isSecured('remove') && Meteor.isServer && !trusted) {
    throw new Meteor.Error(403, 'Removing from the client is not allowed');
  }

  if (Meteor.isServer || args.async) {
    return documentRemoveAsync({ ...args, async: true }, doc, Collection);
  }

  // Trigger before events.
  triggerBeforeRemove(args);

  // Remove a document.
  try {
    const selector = {
      _id: doc._id
    };
    const operation = Meteor.isServer
      ? Collection._collection.removeAsync(selector)
      : Collection._collection.remove(selector);
    const finish = (result) => {
      // Mark a document as new, so it will be possible to save it again.
      doc._isNew = true;

      // Trigger after events.
      triggerAfterRemove(args);

      return result;
    };

    if (operation && typeof operation.then === 'function') {
      return operation.then(finish).catch(handleMongoError);
    }

    return finish(operation);
  }
  catch(err) {
    return handleMongoError(err);
  }
};

async function documentRemoveAsync(args, doc, Collection) {
  try {
    await triggerBeforeRemove(args);
    const selector = {
      _id: doc._id
    };
    const result = Meteor.isServer
      ? await Collection._collection.removeAsync(selector)
      : Collection._collection.remove(selector);
    doc._isNew = true;
    await triggerAfterRemove(args);
    return result;
  }
  catch (error) {
    return handleMongoError(error);
  }
}

export default documentRemove;
