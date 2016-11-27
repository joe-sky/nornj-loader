var nj = require('nornj'),
  includeParser = require('nornj/tools/includeParser'),
  loaderUtils = require('loader-utils');

function buildTmplFns(fns) {
  var ret = '{\n';
  nj.each(fns, function (v, k, i, l) {
    if (k.indexOf('_') != 0) {
      ret += '  ' + k + ': ' + v.toString() + (i < l - 1 ? ',' : '') + '\n';
    }
  });
  return ret + '}';
}

module.exports = function (source) {
  var options = loaderUtils.parseQuery(this.query);
  this.cacheable && this.cacheable();

  var tmpls = includeParser(source, this.resourcePath, true),
    tmplNames = Object.keys(tmpls),
    output = '';

  //Precompiling template
  if (tmplNames.length == 1 && tmplNames[0] === 'main') {
    if (tmpls.main.trim().length > 0) {
      output += buildTmplFns(nj.precompile(tmpls.main, options.outputComponent)) + ';';
    }
  }
  else {  //Export multiple templates
    var tmplsStr = '';
    nj.each(tmpls, function (tmpl, name, i, l) {
      if (tmpl.trim().length > 0) {
        tmplsStr += '  ' + name + ': ' + buildTmplFns(nj.precompile(tmpl, options.outputComponent)) + (i < l - 1 ? ',' : '') + '\n';
      }
    });
    output += '{\n' + tmplsStr + '};';
  }

  return '\'use strict\';\n\nmodule.exports = ' + output;
};