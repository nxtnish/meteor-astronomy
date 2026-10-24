import _extend from 'lodash/extend';
import _mapKeys from 'lodash/mapKeys';
import AstroClass from '../../../core/class.js';
import alreadyInSimulation from './already_in_simulation.js';
import throwIfSelectorIsNotId from './throw_if_selector_is_not_id.js';
import documentInsert from './document_insert.js';
import documentUpdate from './document_update.js';
import applyModifier from './apply_modifier.js';
import { Minimongo, LocalCollection } from 'meteor/minimongo';

function classUpsert(args = {}) {
  const {
    className,
    selector,
    modifier,
    options,
    stopOnFirstError,
    fields,
    simulation = true,
    trusted = false,
    async = false,
  } = args;

  // Stop execution, if we are not on the server, when the "simulation" flag is
  // not set.
  if (!simulation && !Meteor.isServer) {
    return;
  }

  // Throw exception if we are trying to perform an operation on more than one
  // document at once and it's not trusted call.
  if (!trusted && !alreadyInSimulation()) {
    throwIfSelectorIsNotId(selector, 'upsert');
  }

  const Class = AstroClass.get(className);

  if (Meteor.isServer || async) {
    return classUpsertAsync(args, Class);
  }

  // Get all documents matching selector.
  let docs;
  if (options.multi) {
    docs = Class.find(selector, options);
  }
  else {
    docs = Class.find(selector, _extend(options, {
      limit: 1
    }));
  }

  // Create a minimongo matcher object to find array indexes on the projection
  // operator use.
  const matcher = new Minimongo.Matcher(selector);

  // Prepare result of the method execution.
  const result = {
    numberAffected: 0,
    insertedId: null
  };

  if (docs.count() > 0) {
    docs.forEach((doc) => {
      // Use matcher to find array indexes in a given document that needs updating
      // on the projection operator use.
      let queryResult = matcher.documentMatches(doc);

      // Apply modifier.
      applyModifier({
        doc,
        modifier,
        options: queryResult.arrayIndices ? {
          arrayIndices: queryResult.arrayIndices
        } : {}
      });

      // Update a document.
      result.numberAffected += documentUpdate({
        doc,
        stopOnFirstError,
        simulation,
        fields,
        trusted,
        async
      });
    });
  }
  else {
    let doc;
    // Create a new document from selector.
    if (LocalCollection._createUpsertDocument) {
      doc = new Class(LocalCollection._createUpsertDocument(selector, modifier));
    }
    else if (LocalCollection._removeDollarOperators) {
      doc = new Class(LocalCollection._removeDollarOperators(selector));
      // Apply modifier for the insert operation.
      applyModifier({
        doc,
        modifier,
        options: {
          isInsert: true
        }
      });
    }

    // Insert a document.
    result.insertedId = documentInsert({
      doc,
      stopOnFirstError,
      simulation,
      trusted,
      async,
    });
  }

  return result;
};

async function classUpsertAsync(args, Class) {
  const {
    selector,
    modifier,
    options,
    stopOnFirstError,
    fields,
    simulation = true,
    trusted = false,
    async = false
  } = args;
  const queryOptions = options.multi
    ? options
    : _extend({}, options, { limit: 1 });
  const [docs, storedDocs] = await Promise.all([
    Class.find(selector, queryOptions).fetchAsync(),
    Class.find(selector, _extend({}, queryOptions, {
      defaults: false
    })).fetchAsync()
  ]);
  const oldDocs = _mapKeys(storedDocs, oldDoc => oldDoc._id);
  const matcher = new Minimongo.Matcher(selector);
  const result = {
    numberAffected: 0,
    insertedId: null
  };

  if (docs.length > 0) {
    for (const doc of docs) {
      const queryResult = matcher.documentMatches(doc);
      applyModifier({
        doc,
        modifier,
        options: queryResult.arrayIndices ? {
          arrayIndices: queryResult.arrayIndices
        } : {}
      });
      result.numberAffected += await documentUpdate({
        doc,
        stopOnFirstError,
        simulation,
        fields,
        trusted,
        oldDoc: oldDocs[doc._id],
        async
      });
    }
  }
  else {
    let doc;
    if (LocalCollection._createUpsertDocument) {
      doc = new Class(LocalCollection._createUpsertDocument(selector, modifier));
    }
    else if (LocalCollection._removeDollarOperators) {
      doc = new Class(LocalCollection._removeDollarOperators(selector));
      applyModifier({
        doc,
        modifier,
        options: {
          isInsert: true
        }
      });
    }

    result.insertedId = await documentInsert({
      doc,
      stopOnFirstError,
      simulation,
      trusted,
      async
    });
  }

  return result;
}

export default classUpsert;
