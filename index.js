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

  //Set delimiter rule of templates
  nj.setTmplRule({
    start: options.startRule,
    end: options.endRule,
    expr: options.exprRule,
    external: options.externalRule,
    prop: options.propRule,
    template: options.templateRule
  });

  //Set configs for expressions and filters
  if(options.exprConfig) {
    var exprConfig = {};
    nj.each(options.exprConfig, function(v, k) {
      exprConfig[k] = {
        options: v
      };
    });

    nj.registerExpr(exprConfig);
  }
  if(options.filterConfig) {
    var filterConfig = {};
    nj.each(options.filterConfig, function(v, k) {
      filterConfig[k] = {
        options: v
      };
    });

    nj.registerFilter(filterConfig);
  }

  //Parse the "include" and "template" block
  var tmpls = includeParser(source, this.resourcePath, true),
    tmplNames = Object.keys(tmpls),
    output = '';

  //Precompiling template
  if (tmplNames.length == 1 && tmplNames[0] === 'main') {
    if (tmpls.main.trim().length > 0) {
      output += buildTmplFns(nj.precompile(tmpls.main, options.outputComponent)) + ';';
    }
  }
  else {  //Output multiple templates
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