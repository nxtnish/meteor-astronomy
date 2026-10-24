import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/nxtdev:astronomy';
import { assert } from '../assert';

const Meteor3Documents = new Mongo.Collection('astronomy_meteor3_tests');
let afterFindCompleted = false;
const Meteor3Document = Class.create({
  name: 'Meteor3Document',
  collection: Meteor3Documents,
  secured: false,
  fields: {
    value: Number,
    hookCompleted: Boolean
  },
  events: {
    async afterFind() {
      await Promise.resolve();
      afterFindCompleted = true;
    },
    async beforeSave(event) {
      await Promise.resolve();
      event.currentTarget.hookCompleted = true;
    }
  },
  meteorMethods: {
    async increment(amount) {
      this.value += amount;
      await this.saveAsync();
      return this.value;
    }
  }
});

if (Meteor.isServer) Meteor.publish(null, function() {
  return Meteor3Documents.find();
});

if (Meteor.isServer) describe('Meteor 3 storage API (server)', function() {
  beforeEach(async function() {
    await Meteor3Documents.removeAsync({});
  });

  it('persists, reloads and removes documents asynchronously', async function() {
    const doc = new Meteor3Document({
      _id: 'instance-api',
      value: 1
    });

    assert.deepEqual(await doc.saveAsync(), 'instance-api');
    afterFindCompleted = false;
    let stored = await Meteor3Document.findOneAsync('instance-api');
    assert.isTrue(afterFindCompleted);
    assert.deepEqual(stored.value, 1);
    assert.isTrue(stored.hookCompleted);

    stored.value = 2;
    assert.isTrue(await stored.isModifiedAsync());
    assert.deepEqual(await stored.getModifierAsync(), {
      $inc: {
        value: 1
      }
    });
    assert.deepEqual(await stored.saveAsync(), 1);

    stored.value = 99;
    await stored.reloadAsync();
    assert.deepEqual(stored.value, 2);
    assert.deepEqual(await stored.removeAsync(), 1);
    assert.isUndefined(await Meteor3Document.findOneAsync('instance-api'));
  });

  it('supports asynchronous class mutations and upserts', async function() {
    assert.deepEqual(await Meteor3Document.insertAsync({
      _id: 'class-api',
      value: 1
    }), 'class-api');
    assert.deepEqual(await Meteor3Document.updateAsync('class-api', {
      $set: {
        value: 2
      }
    }), 1);

    const inserted = await Meteor3Document.upsertAsync('upsert-api', {
      $set: {
        value: 3
      }
    });
    assert.deepEqual(inserted.numberAffected, 0);
    assert.deepEqual(inserted.insertedId, 'upsert-api');

    const updated = await Meteor3Document.upsertAsync('upsert-api', {
      $set: {
        value: 4
      }
    });
    assert.deepEqual(updated.numberAffected, 1);
    assert.deepEqual(await Meteor3Document.removeAsync({
      _id: {
        $in: ['class-api', 'upsert-api']
      }
    }, {
      multi: true
    }), 2);
  });

  it('awaits the legacy mutation names on the server', async function() {
    const doc = new Meteor3Document({
      _id: 'legacy-api',
      value: 1
    });
    await doc.save();
    const stored = await Meteor3Document.findOneAsync('legacy-api');
    assert.deepEqual(stored.value, 1);
  });

  it('executes class Meteor methods through callMethodAsync', async function() {
    const doc = new Meteor3Document({
      _id: 'method-api',
      value: 1
    });
    await doc.saveAsync();

    assert.deepEqual(await doc.callMethodAsync('increment', 2), 3);
    const stored = await Meteor3Document.findOneAsync('method-api');
    assert.deepEqual(stored.value, 3);
  });
});

if (Meteor.isClient) describe('Meteor 3 storage API (client)', function() {
  it('uses async stubs and returns the server result', async function() {
    const id = `client-api-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const doc = new Meteor3Document({
      _id: id,
      value: 1
    });

    assert.deepEqual(await doc.saveAsync(), id);
    assert.isFalse(doc._isNew);

    doc.value = 2;
    assert.deepEqual(await doc.saveAsync(), 1);
    assert.deepEqual(await doc.callMethodAsync('increment', 2), 4);
    assert.deepEqual(await doc.removeAsync(), 1);
  });
});
