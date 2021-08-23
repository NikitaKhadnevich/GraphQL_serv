const { ApolloServer, gql, PubSub } = require('apollo-server'); // 1. Происходит объявление зависимотей

const pubsub = new PubSub();

const users = [
  {
    id: 1,
    fname: 'Richie',
    age: 27,
    likes: 0,
  },
  {
    id: 2,
    fname: 'Betty',
    age: 20,
    likes: 205,
  },
  {
    id: 3,
    fname: 'Joe',
    age: 28,
    likes: 10,
  },
];

const posts = [
  {
    id: 1,
    userId: 2,
    title: 'Worry about',
    body: "Hello how are you?"
  },
  {
    id: 1,
    userId: 3,
    title: "Friends",
    body: "What's up?"
  },
  {
    id: 1,
    userId: 1,
    title: "Learning",
    body: "Let's learn GraphQL"
  },
]

/*2. Тут строим Schema (Описание или же правила работы с полями)
На примере поля User мы говорим:
-есть поле fname и оно должно возвращать строку
-есть поле age - тоже строку и тд
поле -- posts: [Post] -- Тут важно показать тайпу User на что он ссылается - откуда брать данные для парсинга, это и есть связь между user/post */

const typeDefs = gql` 
  type User {
    id: Int
    fname: String
    age: String
    likes: Int
    posts: [Post] 
  }

  type Post {
    id: Int
    user: User
    title: String
    body: String
  }

  type Query {
    users(id: Int!): User!
    posts(id: Int!): Post!
  }

  type Mutation {
    incrementLike(fname: String!) : [User!]
  }

  type Subscription {
    listenLikes : [User]
  }
`;
//3. Тут описываем Резолверы для ОПИСАНИЯ работы наших полей схемы
const resolvers = {
  Query: {
    users(root, args) { return users.filter(user => user.id === args.id)[0] },
    posts(root, args) { return posts.filter(post => post.id === args.id)[0] }
  },

  User: {
    age: (user) => {
      return `Мой возраст ${user.age}`
    }, // На этом примере мы задали чтобы функция выводила УЖЕ преобразованую строку age//
    fname: (user) => {
      return `Моe имя ${user.fname}`
    }, // На этом примере мы задали чтобы функция выводила УЖЕ преобразованую строку age//
    posts: (user) => {
      return posts.filter(post => post.userId === user.id)
    } // А тут мы фильтруем данные и передам, согласно имеющемуся и соответствующему id user
  },

  Post: {
    user: (post) => {
      return users.filter(user => user.id === post.userId)[0]
    }
  },

  Mutation: {
    incrementLike(parent, args) {
      users.map((user) => {
        if(user.fname === args.fname) user.likes++
        return user
      })
      pubsub.publish('LIKES', {listenLikes: users});
      return users
    }
  },

  Subscription: {
    listenLikes: {
      subscribe: () => pubsub.asyncIterator(['LIKES'])
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers }); // 3. Отдаем серверу нашу Schema, Resolvers 

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
}); // 4. Тут запускаем сервер