import { buildASTSchema } from 'graphql';
import gql from 'graphql-tag';

import { buildPathFromOperation } from '../../src/open-api/operations';
import { buildOperation } from '../../src/operation';

const schema = buildASTSchema(gql`
  type Post {
    comments(filter: String!): [String!]!
    author: Author
    postId: Int
  }

  type Author {
    authorId: Int
  }

  type Query {
    feed: [Post]
  }

  type Mutation {
    addPost(comments: [String!]!): Post
  }
`);

test('handle query', async () => {
  const operation = buildOperation({
    schema,
    type: schema.getQueryType()!,
    fieldName: 'feed',
    models: [],
  });

  const result = buildPathFromOperation({
    operation,
    schema,
  });

  expect(result.operationId).toEqual('feedQuery');
  expect(result.parameters.length).toEqual(1);
  expect(result.parameters[0]).toEqual({
    in: 'query',
    name: 'feedCommentsFilter',
    required: true,
    schema: {
      type: 'string',
    },
  });

  const response = result.responses[200].content['application/json'].schema;
  expect(response).toEqual({
    type: 'array',
    items: { $ref: '#/components/schemas/Post' },
  });
});

test('handle mutation', async () => {
  const operation = buildOperation({
    schema,
    type: schema.getMutationType()!,
    fieldName: 'addPost',
    models: [],
  });

  const result = buildPathFromOperation({
    operation,
    schema,
  });

  // id
  expect(result.operationId).toEqual('addPostMutation');

  // params
  expect(result.parameters).toEqual([]);

  // request body
  const def = result.requestBody!.content['application/json'].schema;

  expect(result.requestBody).toBeDefined();
  expect(def.type).toEqual('object');
  expect(def.required).toEqual(['comments', 'addPostCommentsFilter']);
  expect(def.properties!.comments).toEqual({
    type: 'array',
    items: {
      type: 'string',
    },
  });
});