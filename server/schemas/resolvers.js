const { User } = require('../models');
const { signToken } = require('../utils/auth');
const { AuthenticationError } = require('apollo-server-express');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        // Finding user, excluding version and password
        const userInfo = await User.findOne({ _id: context.user._id }).select(
          '-__v -password'
        );

        return userInfo;
      }

      throw new AuthenticationError('Unable to login, please try again');
    },
  },
  Mutation: {
    addUser: async (parent, args) => {
      try {
        // Create user and assign token
        const user = await User.create(args);
        const token = signToken(user);
        // Return auth obj with user and token info- signed in
        return { token, user };
      } catch (error) {
        console.log(error);
      }
    },
    login: async (parent, { email, password }) => {
      // Logging user in
      const userLogin = await User.findOne({ email });

      // If incorrect- auth error
      if (!userLogin) {
        throw new AuthenticationError('Incorrect email or password');
      }

      const correctPw = await userLogin.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect email or password');
      }

      // If email and password are correct, sign user in with JWT(token)
      const token = signToken(userLogin);
      return { token, userLogin };
    },
    saveBook: async (parent, args, context) => {
      if (context.user) {
        // Saving book to logged in user
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: args.input } },
          { new: true, runValidators: true }
        );

        return updatedUser;
      }

      throw new AuthenticationError(
        'To add or remove a book, you must be logged in'
      );
    },
    removeBook: async (parent, args, context) => {
      if (context.user) {
        // Removing book from the logged in user
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: args.bookId } } },
          { new: true }
        );

        return updatedUser;
      }

      throw new AuthenticationError(
        'To add or remove a book, you must be logged in'
      );
    },
  },
};

module.exports = resolvers;
