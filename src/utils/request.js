function wantsJsonResponse(req) {
  const accept = String(req.get('accept') || '').toLowerCase();
  const requestedWith = String(req.get('x-requested-with') || '').toLowerCase();

  return req.xhr || requestedWith === 'xmlhttprequest' || accept.includes('application/json');
}

module.exports = {
  wantsJsonResponse
};
