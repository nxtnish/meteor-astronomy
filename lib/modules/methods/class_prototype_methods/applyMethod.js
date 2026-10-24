import callMeteorMethod from "../../storage/utils/call_meteor_method";
import callMeteorMethodAsync from "../../storage/utils/call_meteor_method_async";
import rawAll from "../../fields/utils/rawAll";

function applyMethod(methodName, methodArgs, callback) {
  return applyMethodWithMode.call(
    this, methodName, methodArgs, callback, false
  );
}

function applyMethodAsync(methodName, methodArgs) {
  return applyMethodWithMode.call(
    this, methodName, methodArgs, undefined, true
  );
}

function applyMethodWithMode(methodName, methodArgs, callback, asyncMode) {
  const doc = this;
  const Class = doc.constructor;

  // Prepare arguments to be sent to the "/Astronomy/execute" method.
  const meteorMethodArgs = {
    className: Class.getName(),
    methodName,
    methodArgs,
    rawDoc: rawAll(doc, {
      transient: false
    })
  };

  try {
    return asyncMode
      ? callMeteorMethodAsync(Class, "/Astronomy/execute", [meteorMethodArgs])
      : callMeteorMethod(
          Class,
          "/Astronomy/execute",
          [meteorMethodArgs],
          callback
        );
  } catch (err) {
    if (callback) {
      callback(err);
      return null;
    }
    throw err;
  }
}

export { applyMethodAsync };
export default applyMethod;
