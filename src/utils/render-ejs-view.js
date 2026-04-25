const path = require('node:path');
const ejs = require('ejs');

async function renderEjsView(app, viewName, locals) {
  const viewsPath = app.get('views');
  const filePath = path.join(viewsPath, `${viewName}.ejs`);
  return ejs.renderFile(filePath, locals);
}

module.exports = {
  renderEjsView
};
