import _omit from "lodash/omit";
import _size from "lodash/size";
import castNested from "../../fields/utils/castNested";
import triggerBeforeSave from "./trigger_before_save";
import triggerBeforeUpdate from "./trigger_before_update";
import triggerAfterSave from "./trigger_after_save";
import triggerAfterUpdate from "./trigger_after_update";
import isModified from "./isModified";
import getModifier from "./getModifier";
import documentValidate from "../../validators/utils/document_validate";
import handleMongoError from "./handle_mongo_error";

function documentUpdate(args = {}) {
  let {
    doc,
    stopOnFirstError,
    fields,
    simulation = true,
    forceUpdate = false,
    trusted = false,
    oldDoc
  } = args;

  // Stop execution, if we are not on the server, when the "simulation" flag is
  // not set.
  if (!simulation && !Meteor.isServer) {
    return;
  }

  let Class = doc.constructor;
  let Collection = Class.getCollection();

  if (Meteor.isServer && !oldDoc) {
    return Class.findOneAsync(doc._id, { defaults: false }).then((storedDoc) => {
      return documentUpdate({
        ...args,
        oldDoc: storedDoc || new Class({}, { defaults: false })
      });
    });
  }

  // Return if there were no modifications.
  if (
    !isModified({
      doc,
      fields,
      oldDoc
    })
  ) {
    // Validate a document even if there were no modifications.
    documentValidate({
      doc,
      fields,
      stopOnFirstError,
      simulation
    });
    // 0 documents were modified.
    return 0;
  }

  // Check if a class is secured.
  if (Class.isSecured("update") && Meteor.isServer && !trusted) {
    throw new Meteor.Error(403, "Updating from the client is not allowed");
  }

  if (Meteor.isServer || args.async) {
    return documentUpdateAsync({ ...args, async: true }, doc, Collection);
  }

  // Cast nested documents.
  castNested({
    doc,
    options: {
      clone: false
    }
  });

  // Trigger before events.
  triggerBeforeSave(args);
  triggerBeforeUpdate(args);

  // Cast nested documents.
  castNested({
    doc,
    options: {
      clone: false
    }
  });

  // Validate a document.
  documentValidate({
    doc,
    fields,
    stopOnFirstError,
    simulation
  });

  // Get modifier.
  // If the "forceUpdate" option was set then we don't run the "getModifier"
  // function to get modifier and instead we just take entire raw object and
  // remove the "_id" field as we can't update it.
  const modifier = forceUpdate
    ? _omit(doc.raw(), ["_id"])
    : getModifier({
        doc,
        fields,
        oldDoc
      });
  // Stop execution is a modifier is empty.
  if (_size(modifier) === 0) {
    return 0;
  }
  // Update a document.
  try {
    const selector = {
      _id: doc._id
    };
    const operation = Meteor.isServer
      ? Collection._collection.updateAsync(selector, modifier)
      : Collection._collection.update(selector, modifier);
    const finish = (result) => {
      // Trigger after events.
      triggerAfterUpdate(args);
      triggerAfterSave(args);

      return result;
    };

    if (operation && typeof operation.then === "function") {
      return operation.then(finish).catch(handleMongoError);
    }

    return finish(operation);
  } catch (err) {
    return handleMongoError(err);
  }
}

async function documentUpdateAsync(args, doc, Collection) {
  try {
    castNested({
      doc,
      options: {
        clone: false
      }
    });
    await triggerBeforeSave(args);
    await triggerBeforeUpdate(args);
    castNested({
      doc,
      options: {
        clone: false
      }
    });
    documentValidate({
      doc,
      fields: args.fields,
      stopOnFirstError: args.stopOnFirstError,
      simulation: args.simulation
    });

    const modifier = args.forceUpdate
      ? _omit(doc.raw(), ["_id"])
      : getModifier({
          doc,
          fields: args.fields,
          oldDoc: args.oldDoc
        });
    if (_size(modifier) === 0) {
      return 0;
    }

    const selector = {
      _id: doc._id
    };
    const result = Meteor.isServer
      ? await Collection._collection.updateAsync(selector, modifier)
      : Collection._collection.update(selector, modifier);
    await triggerAfterUpdate(args);
    await triggerAfterSave(args);
    return result;
  }
  catch (error) {
    return handleMongoError(error);
  }
}

export default documentUpdate;
