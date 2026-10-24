const callMeteorMethodAsync = (Class, methodName, methodArgs) => {
  const Collection = Class.getCollection();
  let connection = Collection && Collection._connection;
  if (!connection && (!Collection || !Collection._name)) {
    connection = Meteor.connection || Meteor.server;
  }
  const methodOptions = {
    throwStubExceptions: true,
    returnStubValue: true,
    returnServerResultPromise: true
  };

  return connection.applyAsync(methodName, methodArgs, methodOptions);
};

export default callMeteorMethodAsync;
