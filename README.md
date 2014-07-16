Name
----

aoLists-db - Advanced REST Node.js interface for MongoDB with subscriptions and attachments.

Description
-----------

Node.js REST interface for MongoDB.  It is intended as the server side code for aoLists client where "ao" in aoLists stand for aggregate object, the "techie" term for the JSON document at the heart of most noSQL implementations.  It is not, however, limited to aoLists clients, as its features allow for a more advanced user experience.

There are three main points in aoLists:

1. Work disconnected - Allow Android/iOS/Windows clients to get a subset of any collection into the device and  be able to bi-directional synchronization of changes.

2. Create aggregate objects - Embedding documents is one solution, but it may fall short when dealing with many child documents.  aoLists allow for the attachment of child documents and support for their management.

3. Since the support for clients and synchronization, aoLists also adds for support for users and authentication.

Other additions:

- Supports SSL certificate
- Supports MongoDB write acknowledgement options
- Query parameters can be passed as header parameters
- Fully configurable via config.json (see server.js for a complete list of configuration options)

I begun with the work done by Mariano Fiorentino and Andrea Negro in AMID, first to learn node.js, however little of the original code remains. An attempt was made to keep as many AMID calls as compatible as possible.

Installation
------------

Installation is via npm: `npm install aolists`.

After that you can just issue `aolists-rest` on the command line and the server should start.

Configuration
-------------

The config.json file has been modified to only contain CHANGES to the default configuration settings, found in server.js.  Note that if you are making changes to a sub document (in noSQL parlance), you only need to define the elements that you are changing and not the entire sub-document, for example:

```javascript
{
	"login": {
		"hash": "2735b82c1004ac4717c073fec16bb0f6"
	}
}
```

will change the hash entry but leave the username alone.

REST calls
----------

Supported REST calls (using Node.js route naming conventions):

* `GET /` - List all databases

* `GET /:db` - List all collections
* `DELETE /:db` - Deletes the database.  Must be manager.

* `GET /:db/metadata` - Returns the database metadata
* `POST /:db/metadata` - Stores the database metadata

* `GET /:db/:collection` - Returns all documents
* `DELETE /:db/:collection` - Deletes the collection.  Must be manager
* `GET /:db/:collection/:id` - Returns document with given _id

* `GET /:db/:collection/metadata` - Return the collection metadata
* `POST /:db/:collection/metadata` - Stores the collection metadata
* `DELETE /:db/:collection/metadata` - Deletes the collection metadata
* `GET /allmetadata` - Return an array of all metadata for the collections

* `GET /:db/:collection?query={'isDone'%3A false}` - Returns all documents satisfying query
* `GET /:db/:collection?query={'isDone'%3A false}&limit=2&skip=2` - Ability to add options to query (see list below)
* `GET /:db/:collection?query={'isDone'%3A false}&operation=count` - Count elements 
* `GET /:db/:collection/?sort=[{'property'%3A null, 'direction'%3A 'ASC'}]` - Returns all document sorted by property ASC

* `GET /:db/:collection?operation=keys` - List all keys of collection
* `GET /:db/:collection?operation=distinct&fields=Market&sort=[{'property'%3A null, 'direction'%3A 'ASC'}]` - Distinct and sort operation
* `GET /:db/:collection?operation=csv&query={'isDone'%3A false}` - export query as CSV

NOTE:  In the above examples, the collection is required.  The ? is the delimiter to the query parameters.

* `POST /:db/:collection` - Update/Insert a new document in collection (document in POST body)

* `DELETE /:db/:collection/:id` - Delete document with given _id

* `GET /:db/:collection/:id/attach/:db2/:collection2/:id2/:style?` - Attaches a document, given to db2/collection2/id2 to a parent document given by db1/collection1/id1
* `GET /:db/:collection/:id/detach/:db2/:collection2/:id2/:style?` - Detaches a document, given to db2/collection2/id2 to a parent document given by db1/collection1/id1
* `GET /:db/:collection/:id/attached/:style?` - Lists all attachemnts to a given document.  You can optionally enter a style to be returned
* `GET /:db/:collection/:id/ao` - Returns the aggregate document
* `GET /:db/:collection/:id/attachedto` - Lists all parents for a given document
* `GET /:db/:collection/:id/whereused/:target` - Lists all parents, or parents of parents, for a given document where the parent collection matches the target

* `GET /:db/:collection/subscription` - Returns all _id and _ver for subscribed documents as an IDCollection
* `GET /:db/:collection/changes/:from?/:to?` - Returns all _id and _ver for subscribed documents that have changed as an IDCollection (see below)
* `GET /:db/:collection/:id/subscribe` - Subscribe to document with given _id
* `GET /:db/:collection/:id/unsubscribe` - Unsubscribe to document with given _id
* `GET /:db/:collection/startsynch` - Starts a synch cycle.  Returns array of start and end datetime of cycle
* `GET /:db/:collection/synchlist` - Returns all _id and _ver for subscribed documents that have changed since the last sync as an IDCollection
* `GET /:db/:collection/:id/attachedsynchlist` - Returns all _id and _ver for a docuemnt that have changed since the last sync as Attachment Entries
* `GET /:db/:collection/commitsynch` - Commits the synch as successful
* `GET /:db/:collection/rollbacksynch` - Rolls back synch as failure
* `GET /:db/:collection/lastsynch` - Returns the date/time that the synch took place

* `GET /users` - Lists all the users (only available to managers)
* `GET /users/:name/:pwd` - Adds a user to the user table (level=manager to flag as manager)
* `GET /users/:name/:pwd/validate` - Returns whether the name and password are valid
* `DELETE /users/:name` - Removes a user and subscriptions (only available to managers)
* `GET /users/admin` - Display the administration web interface

* `GET /metadata` - Returns the credentials user profile
* `POST /metadata` - Sets the credentials user profile
* `POST /metadata/set` - Sets entries in the credentials user profile
* `GET /users/:user/metadata` - Returns the user profile
* `POST /users/:user/metadata` - Sets the user profile
* `POST /users/:user/metadata/set` - Sets entries in the user profile
* `POST /users/metadata/set` - Sets entries in all the user profiles

* `GET /util/hash/:value` - Returns the hash of the value

A presumption that you are familiar with MongoDB and basic calls is made, so no explanation of those calls are given.

Query shorthand
---------------

The following query parameters have the shorthand indicated:

* username - u
* password - p
* endpoint - e
* query - q
* operation - o

So username=jose and u=jose are the same.

Operations
----------

The following operations are available in the collection query call:

* find - Returns an array of all documents that match the query
* findOne - Returns the first document that matches the query
* distinct - Returns an array of distinct documents that match the query
* count - Returns the count of documents that match the query
* keys - Returns an array of _ids that match the query
* idcoll - Returns an IDCollection of documents that match the query
* csv - Returns a .CSV file of the documents that match the query

Query Options
-------------

The following options are supported:

* limit
* sort
* fields
* skip
* hint
* explain
* snapshot
* timeout

This list can be modified via config.json.

Authentication
--------------

Any call to the server must have a user name and password attached.  The following options are available:

* Query parameter - Example `...?u=me&pwd=secret`.

* Header option - Example `username=me` and `password=secret`

* Basic Authentication - Example: `http://me:secret@mysite.com:42324`

Once the user name and password are validated, a token will be kept as pasrt of the session, if any.  When sessions are used, the name and password do not need to be resent.

Optionally you can also include an endpoint value, which is useful when the user has multiple devices/clients that access the server.  This allows the synch logic to properly prepare a list of changes and if one endpoint is synchronized, the same change will go to other endpoints.   The endpoint is passed as e=<value> as a query value or header option.

The users collection is names "users" and kept in database "aoLists", but are user configurable, as are the fields used in the collection.

Custom Authentication
---------------------

You can provide your own authentication mechanism by modifying the customAUTH function in util_auth,js.

_VER field
----------

The _ver field is used to track changes and it consists of three parts, delimited by #:
 
1) The UTC date/time when the document was last updated

2) A hash of the user name and endpoint

3) The version number which is incremented every time the document is updated in the database

When a new document is created at the client, it must not have a _ver field as it has never been written into the server database.  The field is passed to the client when the document is read from the server database and must match the value in the database for any update to take place.  If the value does not match, it indicates that the document was updated by another user after it was read.

_DESC field
-----------

The _desc field is used as a description of the document.  It is generated by the aoLists clients and returned at valrious places by the server.

Description support is controlled by config.json `enableDESC`.

NOTE:  If you are going to use attachemnts, it is strongly suggested that you enable description support BEFORE you begin using attachments, otherwise any attachment that is created before description support is created will not have descriptions.

ID Collection
-------------

Some operations return an ID Collection which has a format of:

```javascript
{
	'id1': 'ver1',	
	'id2': 'ver2'	
}
```

Attachment Entry
----------------

Some operations return attachment entries, which have a format of:

```javascript
{
	'_db': 'the database of the document',
	'_coll': 'the collection of the document',
	'_id': ' the _id of the document',
	'_desc': 'the current _ver of the document',
	'_ver': 'the current _ver of the document',
	'_style': 'the style given at the time of attachment'
}
```

The _desc field is returned if the description support is enabled.

Attachments
-----------

While noSQL databases are excellent for being able to aggregate multiple documents into a single one, it lacks similar support when a document has other documents that make up an aggregate and are to be kept as separate documents.  

One way around this issue is to place the _id of the "parent" document as a field in the "child", which works in many cases, but fails when the child is to be shared among multiple parents.

aoLists tackles the issue by creating a collection that holds pointers to both parent and child, along with information that is used to describe the relationship, which for historical reasons are called "style" and a copy of the child document _ver field, which is updated when it changes in the child document itself.  The _ver is used for subscription synchronization purposes.

Attachment support is controlled by config.json `enableATTACH`.  

Attaching a document
--------------------

Use `GET /:db/:collection/:id/attach/:db2/:collection2/:id2/:style?` to attach the document given by `:db2/:collection2/:id2` to the document given by `:db/:collection/:id`.  The style is optional but highly recomended.

You may attach the same child document the the same parent using different styles.  For example, if the parent document is an invoice and the child document is an company, you can attach the company to the invoice as both a 'billto' and 'shipto' child.

Detaching a document
--------------------

Use `GET /:db/:collection/:id/detach/:db2/:collection2/:id2/:style?` to detach the document given by `:db2/:collection2/:id2` from the document given by `:db/:collection/:id`.  The style is required and must match the one used when attaching.

If you have attached the same child document to the same parent, detaching the child in one style does not detach it as another style.

Getting an attachment list ot attachments
-----------------------------------------

Use `GET /:db/:collection/:id/attached` to get an array of attachments for a given document.  Each attachemnt is returned as an attachment entry.


Getting an attachment list of parent documents
----------------------------------------------

Use `GET /:db/:collection/:id/attachedto` to get an array of parents for a given document.  Each parent is returned as an attachment entry.

Getting an aggregate document
-----------------------------

Use `GET /:db/:collection/:id/ao` to get the aggregate document.  The aggregate document is made up of the base document with any attachments inserted as embedded documents using the style value of the attachment as the field.  Fox example:

```javascript
{ 
	"_id" : "jose",
	"_ver" : "2014-06-20T20:54:55.704Z#21232f297a57a5a743894a0e4a801fc3#1",
	"employer" : [ 
		{ 
			"_id" : "test",
			"_ver" : "2014-06-21T21:45:27.556Z#662eaa47199461d01a623884080934ab#1",
			"attachment" : [ 
				{ 
					"_id" : "53936742aeea600e64e8bb32",
					"_ver" : "2014-06-21T21:45:27.555Z#662caa47199461d01a623884080934ab#1",
					"attachment" : { 
						"_id" : "jose",
						"_ver" : "duplicate"
					},
					...
				},
				{ 
					"_id" : "jose",
					"_ver" : "duplicate"
				}
			],
			...
		},
		{ 
			"_id" : "123456789012345678901234567890123456789012345678901234567890",
			"_ver" : "duplicate",
			...
		}
    ],
	"insured" : { 
		"_id" : "123456789012345678901234567890123456789012345678901234567890",
		"_ver" : "2014-06-20T18:35:31.705Z#admin#1",
		...
	},
	...
}
```

This is the result of the attachment of these three documents:

```javascript
{
	"_id" : "jose",
	"_ver" : "2014-06-20T20:54:55.704Z#21232f297a57a5a743894a0e4a801fc3#1",
	...
}

{ 
	"_id" : "test",
	"_ver" : "2014-06-21T21:45:27.556Z#662eaa47199461d01a623884080934ab#1",
	...
}

{ 
	"_id" : "123456789012345678901234567890123456789012345678901234567890",
	"_ver" : "2014-06-20T18:35:31.705Z#admin#1",
	...
}

{ 
	"_id" : "53936742aeea600e64e8bb32",
	"_ver" : "2014-06-21T21:45:27.555Z#662caa47199461d01a623884080934ab#1",
	...
}
```

As follows:

* "test" is attached to "jose" with a style of "employer"
* "123456789012345678901234567890123456789012345678901234567890" is attached to "jose" with a style of "employer"
* "123456789012345678901234567890123456789012345678901234567890" is attached to "jose" with a style of "insured"

* "53936742aeea600e64e8bb32" is attached to "test" with no style.
* "jose" is attached to "test" with no style.

* "jose" is attached to "53936742aeea600e64e8bb32" with no style.

As you can tell, you can make cyclic attachments, where document "a" is attached to a document "b" which is attached to document "a".  The API will handle these by never displaying attachemnts to documents which have been shown before.

The following parameters are available when getting an aggregate object:

* showsource = y - Will add _db and _collection fields to each document with the database and collection where the document originated
* structureonly = y - Will display only the _id and _ver of each document.  May be used in conjunction with "showsource" to create a reference map
* showdups = y - Will display the contents of the duplicate documents but will not display any attachments for the duplicates
* nosubs = y - Only the attachments to the documents are returned.  Attachments to attachments are omitted
* include = <delim><value><delim><value>... - Will include only those documents with the styles given.  Example: include=,employer,payer
* exclude = <delim><value><delim><value>... - Will exclude any document with the styles given.  Example: exclude=,attachment

_SUBS field - Subscriptions
---------------------------

The _subs field, which is an array, holds the list of users that have subscribed to the document.  By subscribing, you make the document available for the synchronization logic.  The field is never passed to the client, nor can be written by the client during an update.

If you are using attachments, you do not need to subscribe to any attachment, all attachments are considered part of the parent document subscription.

Subscriptions support is controlled by config.json `enableSUBS`.  

Subscribing to a document
-------------------------

Use the `GET /:db/:collection/:id/subscribe` to subscribe to a document.  Note that you should retrieve a copy of the document to use as the starting point in the synchronization process.

Unsubscribing to a document
---------------------------

Use the `GET /:db/:collection/:id/unsubscribe` to unsubscribe to a document.

Getting a list of subcscriptions
--------------------------------

Use the `GET /:db/:collection/subscribed` to get an ID Coll for all the documents that you have subscribed to.

Synchronization
---------------

Although the "changes" call can be used to get a list of changes done between a date range, aoLists server provide for a simple mechanism to synchronize.  This is makes the API a `synch server`.

`startsynch` - The startsynch call establishes a from/to date range to check.  It is the first call to make in the sequence.

`synclist` - The synclist call returns a list of _id and _rev that have changed in the date range established above by users/endpoints other than the calling.  

`commitsynch` - Tells the server that the synch took place correctly.

`rollbacksynch` - Tells the server that the synch did not take place correctly.

The Synch Process
-----------------

1) Call `startsynch` to establish a date range.  The first time that it is called, the "from" date will be null (no starting date) and the "to" date will be set to the current datetime.

2) Call `synchlist` and save the list.

2) Write any local document that has changed. If the _id exists in the synchlist, the document has been changed by another user/endpoint.  If you want to force an overwrite of the document, set the document _ver to the value in the synchlist, or handle the conflict whichever way you decide.

3) If using attachments, Write any attachment that has changed.

4) Read each document in the synchlist, if you did not force an overwrite.

5) If using attachments, Call attachedsynchlist for the document and read each attached document.

6) Call `commitsynch`.  This sets moves to "to" date used by startsynch to the "from" date and sets the "to" date to null, setting up the logic for the next synch cycle.

7) If you call `rollbacksynch`, the "to" date is reset to null wthout changing the "from" date.

Metadata
--------

aoLists makes use of metadata objects at the database, collection and user levels.  These metadata objects are JSON objects and can be used to store any information needed by the application.  They do not interfere with normal MongoDB operations.

Configuring routes
------------------

If you have databases with the names of `users`, `profile` or `util`, you can eliminate any possibility of conflict by changing the config.json entries of `db.users.label`, `db.users.metadata.label` or `db.util.label`.  For example, setting `db.user.label` to "logins" will change the routes to:

* `GET /logins` - Lists all the users (only available to managers)
* `GET /logins/add/:name/:pwd` - Adds a user to the user table (level=manager flag as manager)
* `GET /logins/remove/:name` - Removes a user and subscriptions (only available to managers)

Reserved IDs
------------

As they are used in the collection calls, the following values are not allowed as document _ids:

* metadata
* subscription
* changes
* startsynch
* synchlist
* commitsynch
* rollbacksynch
* lastsynch

These are used in db calls:

* describe

Using existing MongoDB collections
----------------------------------

None of the changes in aoLists causes a conflict with existing MongoDB collections.  If you are using either _ver or _subs, you can change the fields used via config.json. 

Testing
-------

A MS Windows batch file is included in /test/calls.bat.  It runs every command in the API.  The /test/run20,bat runs the calls.bat file as twenty separate instances, to simulate a multi-user environment.

Content Type
------------

* Please make sure `application/json` is used as Content-Type when using POST/PUT with request body's.

Dependencies
------------

* Are all indicated in package.json. So far I indicate the lowest version with which I tested the code. Sadly this can result in non-working code when later versions are used.

* aoLists has been tested in Node.js 0.10.29.0

Credits
-------

* [AMID](http://github.com/mariano-fiorentino/amid)
* [MongoDB Driver](http://github.com/christkv/node-mongodb-native)
* [Express](http://expressjs.com/)
* [npm](http://npmjs.org/)
* [mongodb-rest](https://github.com/tdegrunt/mongodb-rest)

Authors
------------

* Jose E. Gonzalez jr

License
-------

All code contained herein is distributed under the LGPL 3.0 license.  All code is copyright 2014 Candid.Concept LC.
