import isRemote from '../utils/is_remote.js';
import callMeteorMethod from '../utils/call_meteor_method.js';
import callMeteorMethodAsync from '../utils/call_meteor_method_async.js';
import classInsert from '../utils/class_insert.js';
import handleResult from '../utils/handle_result.js';

function insert(rawDoc, callback) {
  return insertWithMode.call(this, rawDoc, callback, false);
}

function insertAsync(rawDoc) {
  return insertWithMode.call(this, rawDoc, undefined, true);
}

function insertWithMode(rawDoc, callback, asyncMode) {
  const Class = this;
  const Collection = Class.getCollection();

  // Prepare arguments.
  const args = {
    className: Class.getName(),
    rawDoc,
    async: asyncMode
  };

  // Generate ID if not provided.
  if (!rawDoc._id) {
    let generateId = true;
    // Don't generate the id if we're the client and the 'outermost' call.
    // This optimization saves us passing both the randomSeed and the id.
    // Passing both is redundant.
    if (Collection._isRemoteCollection()) {
      const enclosing = DDP._CurrentMethodInvocation.get();
      if (!enclosing) {
        generateId = false;
      }
    }
    if (generateId) {
      rawDoc._id = Collection._makeNewID();
    }
  }

  // If we are dealing with a remote collection and we are not on the server.
  if (isRemote(Class)) {
    // Prepare meteor method name to be called.
    const methodName = '/Astronomy/insert';

    try {
      // Run Meteor method.
      return asyncMode
        ? callMeteorMethodAsync(Class, methodName, [args])
        : callMeteorMethod(Class, methodName, [args], callback);
    }
    // Catch stub exceptions.
    catch (err) {
      if (callback) {
        callback(err);
        return null;
      }
      throw err;
    }
  }

  // If we can just insert a document without calling the meteor method. We may
  // be on the server or the collection may be local.
  try {
    // Set the "trusted" argument to true.
    args.trusted = true;
    // Insert a document.
    const result = classInsert(args);
    return asyncMode
      ? Promise.resolve(result)
      : handleResult(result, callback);
  }
  catch (err) {
    if (callback) {
      callback(err);
      return null;
    }
    throw err;
  }
}

export { insertAsync };
export default insert;
