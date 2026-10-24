import documentRemove from '../utils/document_remove.js';
import isRemote from '../utils/is_remote.js';
import callMeteorMethod from '../utils/call_meteor_method.js';
import callMeteorMethodAsync from '../utils/call_meteor_method_async.js';
import handleResult from '../utils/handle_result.js';

function remove(args = {}, callback) {
  if (arguments.length === 1 && Match.test(args, Function)) {
    callback = args;
    args = {};
  }

  return removeWithMode.call(this, args, callback, false);
}

function removeAsync(args = {}) {
  return Promise.resolve(removeWithMode.call(this, args, undefined, true));
}

function removeWithMode(args, callback, asyncMode) {
  let doc = this;
  let Class = doc.constructor;

  // Get variables from the first argument.
  let {
    simulation = true
  } = args;

  // If we are dealing with a remote collection and we are not on the server.
  if (isRemote(Class)) {
    // Prepare meteor method name to be called.
    let methodName = '/Astronomy/remove';
    // Prepare arguments for the meteor method.
    let methodArgs = {
      className: Class.getName(),
      selector: {
        _id: doc._id
      },
      simulation,
      async: asyncMode
    };

    try {
      // Run meteor method.
      const result = asyncMode
        ? callMeteorMethodAsync(Class, methodName, [methodArgs])
        : callMeteorMethod(Class, methodName, [methodArgs], callback);
      // Change the "_isNew" flag to "true". After removing a document can be
      // saved again as a new one.
      doc._isNew = true;
      // Return result of the meteor method call.
      return result;
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

  // If we can just remove a document without calling the meteor method. We may
  // be on the server or the collection may be local.
  try {
    // Prepare arguments.
    let methodArgs = {
      doc,
      simulation,
      trusted: true,
      async: asyncMode
    };
    const result = documentRemove(methodArgs);
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

export { removeAsync };
export default remove;
