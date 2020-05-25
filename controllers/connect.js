'use strict'

const path = require('path')
const config = require(path.join(__dirname, '/../config'))
const GitServiceFactory = require(path.join(__dirname, '/../lib/GitServiceFactory'))

module.exports = async (req, res) => {
  const ua = config.get('analytics.uaTrackingId')
    ? require('universal-analytics')(config.get('analytics.uaTrackingId'))
    : null


  const gitService = await GitServiceFactory.create(req.params.service, {
    username: req.params.username,
    repository: req.params.repository,
    branch: req.params.branch,
    token: config.get(req.params.service + 'Token'),
    version: req.params.version
  })

  const isAppAuth = gitService.isAppAuth(config)

  if (isAppAuth) {
    return res.send('OK!')
  }

  // the function calls below applies to github only
  // TODO: have the GitService class account for this, perhaps?
  return gitService.api.repos.listInvitationsForAuthenticatedUser({}).then(({ data }) => {
    let invitationId = null

    const invitation = Array.isArray(data) && data.some(invitation => {
      if (invitation.repository.full_name === (req.params.username + '/' + req.params.repository)) {
        invitationId = invitation.id

        return true
      }
    })

    if (!invitation) {
      return res.status(404).send('Invitation not found')
    }

    return gitService.api.repos.acceptInvitation({
      invitation_id: invitationId
    }).then(response => {
      res.send('OK!')

      if (ua) {
        ua.event('Repositories', 'Connect').send()
      }
    }).catch(err => { // eslint-disable-line handle-callback-err
      res.status(500).send('Error')

      if (ua) {
        ua.event('Repositories', 'Connect error').send()
      }
    })
  })
}
