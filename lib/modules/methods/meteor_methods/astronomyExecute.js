import AstroClass from '../../../core/class';

function astronomyExecute(args = {}) {
  check(args, Match.Any);

  const {
    className,
    rawDoc,
    methodName,
    methodArgs
  } = args;

  const Class = AstroClass.get(className);
  if (rawDoc._id && Meteor.isServer) {
    return Class.findOneAsync(rawDoc._id).then((doc) => {
      return executeMethod(Class, doc, rawDoc, methodName, methodArgs);
    });
  }

  const doc = rawDoc._id ? Class.findOne(rawDoc._id) : undefined;
  return executeMethod(Class, doc, rawDoc, methodName, methodArgs);
};

function executeMethod(Class, doc, rawDoc, methodName, methodArgs) {
  if (doc) {
    doc.set(rawDoc);
  }
  else {
    doc = new Class(rawDoc, {
      clone: false
    });
  }

  // Get a method from the class. In some cases method may not be present,
  // because it might be defined only on the server.
  const method = Class.getMeteorMethod(methodName);
  if (!method) {
    return;
  }

  return method.apply(doc, methodArgs);
}

export default astronomyExecute;
