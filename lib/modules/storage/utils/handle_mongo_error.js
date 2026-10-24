function handleMongoError(error) {
  if (
    error &&
    typeof error.name === 'string' &&
    (error.name === 'MinimongoError' || error.name.startsWith('Mongo'))
  ) {
    throw new Meteor.Error(409, error.toString());
  }

  throw error;
}

export default handleMongoError;
