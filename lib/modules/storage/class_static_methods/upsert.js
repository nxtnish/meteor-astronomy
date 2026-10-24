import isRemote from '../utils/is_remote.js';
import callMeteorMethod from '../utils/call_meteor_method.js';
import callMeteorMethodAsync from '../utils/call_meteor_method_async.js';
import classUpsert from '../utils/class_upsert.js';
import handleResult from '../utils/handle_result.js';

function upsert(selector, modifier, options, callback) {
  return upsertWithMode.call(
    this, selector, modifier, options, callback, false
  );
}

function upsertAsync(selector, modifier, options) {
  return upsertWithMode.call(
    this, selector, modifier, options, undefined, true
  );
}

function upsertWithMode(selector, modifier, options, callback, asyncMode) {
  const Class = this;

  // If we omit options argument then it may be a callback function.
  if (options instanceof Function) {
    callback = options;
    options = {};
  }
  // Make sure that options is at least an empty object.
  options = options || {};
  // Prepare arguments.
  const args = {
    className: Class.getName(),
    selector,
    modifier,
    options,
    async: asyncMode
  };

  // If we are dealing with a remote collection and we are not on the server.
  if (isRemote(Class)) {
    // Prepare meteor method name to be called.
    const methodName = '/Astronomy/upsert';

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

  // If we can just remove a document without calling the meteor method. We may
  // be on the server or the collection may be local.
  try {
    // Set the "trusted" argument to true.
    args.trusted = true;
    // Remove a document.
    const result = classUpsert(args);
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

export { upsertAsync };
export default upsert;
