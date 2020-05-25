'use strict'

const GitLab = require('./GitLab')
const GitHub = require('./GitHub')

module.exports.create = async (service, options) => {
  switch (service) {
    case 'gitlab':
      return await new GitLab(options)
    default:
      return await new GitHub(options)
  }
}
